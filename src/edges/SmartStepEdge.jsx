import { useMemo, useState, useCallback, useRef } from 'react';
import { useNodes, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import useWorkflowStore from '../store/workflowStore';

const PAD = 36;
const ZONE_HEADER_H = 50;
const DEFAULT_W = 256;
const DEFAULT_H = 120;
const STUB = 30;

export default function SmartStepEdge({
  id,
  sourceX: rfSourceX,
  sourceY: rfSourceY,
  targetX: rfTargetX,
  targetY: rfTargetY,
  sourcePosition: rfSourcePos,
  targetPosition: rfTargetPos,
  source,
  target,
  style,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  selected,
  data,
}) {
  const allNodes = useNodes();
  const { getViewport, getInternalNode, screenToFlowPosition, setViewport } = useReactFlow();
  const updateEdgeData = useWorkflowStore((s) => s.updateEdgeData);
  const reconnectEdgeTo = useWorkflowStore((s) => s.reconnectEdgeTo);
  const swapEdgeDirection = useWorkflowStore((s) => s.swapEdgeDirection);

  const [activeDrag, setActiveDrag] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [reconnectDrag, setReconnectDrag] = useState(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const dragHandlesRef = useRef([]);
  const panVelocityRef = useRef({ dx: 0, dy: 0 });
  const panIntervalRef = useRef(null);
  const lastScreenPosRef = useRef({ x: 0, y: 0 });

  // ── Helper: get absolute position for any node ──
  const getAbsPos = useCallback((nodeId, fallbackPos) => {
    const internal = getInternalNode(nodeId);
    return internal?.internals?.positionAbsolute || fallbackPos;
  }, [getInternalNode]);

  // ── Part A: auto-computed waypoints + handle positions ──
  const rawResult = useMemo(() => {
    const srcNode = allNodes.find((n) => n.id === source);
    const tgtNode = allNodes.find((n) => n.id === target);

    let sx, sy, sPos, tx, ty, tPos;

    if (srcNode && tgtNode && !data?.manualHandles) {
      // Auto mode: compute best handle pair based on node geometry
      const auto = computeAutoHandles(srcNode, tgtNode, allNodes, getAbsPos);
      sx = auto.sx; sy = auto.sy; sPos = auto.sPos;
      tx = auto.tx; ty = auto.ty; tPos = auto.tPos;
    } else {
      // Manual mode (reconnected edge) or fallback: use React Flow positions
      // which respect the stored sourceHandle/targetHandle
      sx = rfSourceX; sy = rfSourceY; sPos = rfSourcePos;
      tx = rfTargetX; ty = rfTargetY; tPos = rfTargetPos;
    }

    // Build obstacle boxes using ABSOLUTE positions
    const nodeBoxes = allNodes
      .filter((n) => n.id !== source && n.id !== target && n.type !== 'groupNode' && !n.data?._hiddenInZone)
      .map((n) => {
        const pos = getAbsPos(n.id, n.position);
        const w = n.measured?.width || DEFAULT_W;
        const h = n.measured?.height || DEFAULT_H;
        return {
          left: pos.x - PAD,
          top: pos.y - PAD,
          right: pos.x + w + PAD,
          bottom: pos.y + h + PAD,
        };
      });

    const zoneHeaderBoxes = allNodes
      .filter((n) => n.type === 'groupNode')
      .filter((zoneNode) => {
        // Allow edges to cross headers of zones containing their source or target
        const zp = getAbsPos(zoneNode.id, zoneNode.position);
        const zw = zoneNode.style?.width || zoneNode.measured?.width || 400;
        const zh = zoneNode.style?.height || zoneNode.measured?.height || 300;
        const isInside = (nd) => {
          if (!nd) return false;
          const p = getAbsPos(nd.id, nd.position);
          return p.x >= zp.x && p.x < zp.x + zw && p.y >= zp.y && p.y < zp.y + zh;
        };
        return !isInside(srcNode) && !isInside(tgtNode);
      })
      .map((n) => {
        const pos = getAbsPos(n.id, n.position);
        const w = n.style?.width || n.measured?.width || 400;
        return {
          left: pos.x,
          top: pos.y,
          right: pos.x + w,
          bottom: pos.y + ZONE_HEADER_H,
        };
      });

    const boxes = [...nodeBoxes, ...zoneHeaderBoxes];

    return {
      waypoints: computeSmartPath(sx, sy, tx, ty, sPos, tPos, boxes),
      sPos,
      tPos,
    };
  }, [
    source, target, rfSourceX, rfSourceY, rfTargetX, rfTargetY,
    rfSourcePos, rfTargetPos, getAbsPos, data?.manualHandles,
    allNodes.map((n) =>
      `${n.id}:${Math.round(n.position.x)}:${Math.round(n.position.y)}:${n.measured?.width || 0}:${n.measured?.height || 0}:${n.style?.width || 0}:${n.style?.height || 0}`
    ).join('|'),
  ]);

  const rawWaypoints = rawResult.waypoints;
  const routeSPos = rawResult.sPos;
  const routeTPos = rawResult.tPos;

  // ── Part B: rawWaypoints + stored adjustments + active drag ──
  const waypoints = useMemo(() => {
    let pts = rawWaypoints.map((p) => [p[0], p[1]]);

    const stored = data?.segmentAdjustments;
    if (stored) {
      const indices = Object.keys(stored)
        .map(Number)
        .sort((a, b) => a - b);
      for (const idx of indices) {
        pts = applySegmentOffset(pts, idx, stored[idx]);
      }
    }

    if (activeDrag) {
      pts = applySegmentOffset(pts, activeDrag.segIdx, activeDrag.offset);
    }

    // Smart orthogonalize: uses handle positions to insert correct corners
    // after segment adjustments (preserves stub entry/exit directions)
    return orthogonalize(pts, routeSPos, routeTPos);
  }, [rawWaypoints, routeSPos, routeTPos, data?.segmentAdjustments, activeDrag]);

  // ── Path + label position + swap button position ──
  const { path, labelPos, swapPos } = useMemo(() => {
    const d = waypointsToPath(waypoints);
    const mid = Math.floor(waypoints.length / 2);
    // Label: midpoint of the middle segment (along the line)
    const lp = {
      x: (waypoints[Math.max(0, mid - 1)][0] + waypoints[mid][0]) / 2,
      y: (waypoints[Math.max(0, mid - 1)][1] + waypoints[mid][1]) / 2,
    };
    // Swap button: at the nearest bend/corner to path center (avoids segment midpoints)
    let sp = lp;
    const bends = [];
    for (let i = 1; i < waypoints.length - 1; i++) {
      const [px, py] = waypoints[i - 1];
      const [cx, cy] = waypoints[i];
      const [nx, ny] = waypoints[i + 1];
      const seg1Horiz = Math.abs(py - cy) < 1;
      const seg2Horiz = Math.abs(cy - ny) < 1;
      if (seg1Horiz !== seg2Horiz) {
        bends.push({ x: cx, y: cy });
      }
    }
    if (bends.length > 0) {
      const cx = (waypoints[0][0] + waypoints[waypoints.length - 1][0]) / 2;
      const cy = (waypoints[0][1] + waypoints[waypoints.length - 1][1]) / 2;
      let best = bends[0], bestDist = Infinity;
      for (const b of bends) {
        const dist = Math.hypot(b.x - cx, b.y - cy);
        if (dist < bestDist) { bestDist = dist; best = b; }
      }
      sp = best;
    }
    return { path: d, labelPos: lp, swapPos: sp };
  }, [waypoints]);

  // ── Draggable segments (always computed for hit areas) ──
  const draggableSegments = useMemo(() => {
    const segs = [];
    for (let i = 1; i < waypoints.length - 2; i++) {
      const [x1, y1] = waypoints[i];
      const [x2, y2] = waypoints[i + 1];
      const isHoriz = Math.abs(y1 - y2) < 1;
      const isVert = Math.abs(x1 - x2) < 1;
      if (!isHoriz && !isVert) continue;
      const segLen = isHoriz ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
      if (segLen < 8) continue;
      segs.push({
        segIdx: i, x1, y1, x2, y2,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
        direction: isHoriz ? 'horizontal' : 'vertical',
      });
    }
    return segs;
  }, [waypoints]);

  // ── Pointer drag handling ──
  const handlePointerDown = useCallback((e, segIdx, direction) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvt) => {
      const rfZoom = getViewport().zoom || 1;
      const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
      const totalZoom = rfZoom * cssZoom;
      if (direction === 'horizontal') {
        setActiveDrag({ segIdx, offset: (moveEvt.clientY - startY) / totalZoom });
      } else {
        setActiveDrag({ segIdx, offset: (moveEvt.clientX - startX) / totalZoom });
      }
    };

    const onPointerUp = (upEvt) => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      const rfZoom = getViewport().zoom || 1;
      const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
      const totalZoom = rfZoom * cssZoom;
      const offset = direction === 'horizontal'
        ? (upEvt.clientY - startY) / totalZoom
        : (upEvt.clientX - startX) / totalZoom;

      if (Math.abs(offset) > 1) {
        const currentData = dataRef.current;
        const existing = currentData?.segmentAdjustments || {};
        const prev = existing[segIdx] || 0;
        updateEdgeData(id, {
          segmentAdjustments: { ...existing, [segIdx]: prev + offset },
        });
      }
      setActiveDrag(null);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }, [id, getViewport, updateEdgeData]);

  // ── Reconnect: drag endpoint to a connector ──
  // Uses screenToFlowPosition for robust cursor tracking (handles CSS zoom, viewport offsets, etc.)
  // Handle positions use React Flow's internal handleBounds for exact DOM positions.
  const SNAP_SCREEN_PX = 80;
  const lastSnapRef = useRef(null);

  const handleReconnectStart = useCallback((e, type) => {
    e.stopPropagation();
    e.preventDefault();

    // Determine which specific handle to exclude (the one being dragged away from)
    const excludeNodeId = type === 'source' ? source : target;
    let excludeHandlePos;
    if (dataRef.current?.manualHandles) {
      // Manual handles mode: the RF-provided position tells us which handle is active
      excludeHandlePos = type === 'source' ? rfSourcePos : rfTargetPos;
    } else {
      // Auto mode: compute to find which handle was auto-selected
      const srcNode = allNodes.find((n) => n.id === source);
      const tgtNode = allNodes.find((n) => n.id === target);
      if (srcNode && tgtNode) {
        const auto = computeAutoHandles(srcNode, tgtNode, allNodes, getAbsPos);
        excludeHandlePos = type === 'source' ? auto.sPos : auto.tPos;
      }
    }

    // Build handle positions from ALL nodes — only exclude the exact handle being dragged from
    const handles = [];
    for (const n of allNodes) {
      if (n.type === 'groupNode' || n.data?._hiddenInZone) continue;
      const internal = getInternalNode(n.id);
      if (!internal) continue;
      const absPos = internal.internals.positionAbsolute;
      const hb = internal.internals.handleBounds;
      if (!hb) continue;
      const allH = [...(hb.source || []), ...(hb.target || [])];
      const seen = new Set();
      for (const h of allH) {
        const key = h.id || h.position;
        if (seen.has(key)) continue;
        seen.add(key);
        // Skip only the exact handle being dragged from
        if (n.id === excludeNodeId && key === excludeHandlePos) continue;
        handles.push({
          nodeId: n.id,
          pos: key,
          x: absPos.x + h.x + (h.width || 0) / 2,
          y: absPos.y + h.y + (h.height || 0) / 2,
        });
      }
    }
    dragHandlesRef.current = handles;
    lastSnapRef.current = null;

    const getCursorFlow = (cx, cy) => {
      const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
      return screenToFlowPosition({ x: cx / cssZoom, y: cy / cssZoom });
    };

    const findSnap = (cursorX, cursorY) => {
      const rfZoom = getViewport().zoom || 1;
      const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
      const snapRadius = SNAP_SCREEN_PX / (rfZoom * cssZoom);
      let snapHandle = null;
      let minDist = Infinity;
      for (const handle of dragHandlesRef.current) {
        const dist = Math.hypot(handle.x - cursorX, handle.y - cursorY);
        if (dist < minDist) {
          minDist = dist;
          if (dist < snapRadius) snapHandle = handle;
        }
      }
      return snapHandle;
    };

    // Auto-pan: when cursor is near container edges, continuously pan the viewport
    const PAN_MARGIN = 60;
    const PAN_SPEED = 12;
    const updateAutoPan = (clientX, clientY) => {
      const container = document.querySelector('.react-flow');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let dx = 0, dy = 0;
      if (clientX - rect.left < PAN_MARGIN) dx = PAN_SPEED;
      else if (rect.right - clientX < PAN_MARGIN) dx = -PAN_SPEED;
      if (clientY - rect.top < PAN_MARGIN) dy = PAN_SPEED;
      else if (rect.bottom - clientY < PAN_MARGIN) dy = -PAN_SPEED;
      panVelocityRef.current = { dx, dy };
      if ((dx || dy) && !panIntervalRef.current) {
        panIntervalRef.current = setInterval(() => {
          const { dx: pdx, dy: pdy } = panVelocityRef.current;
          if (!pdx && !pdy) return;
          const vp = getViewport();
          setViewport({ x: vp.x + pdx, y: vp.y + pdy, zoom: vp.zoom });
          // Re-compute snap with updated viewport (cursor hasn't moved but canvas has)
          const { x: sx, y: sy } = lastScreenPosRef.current;
          const cursor = getCursorFlow(sx, sy);
          const snapHandle = findSnap(cursor.x, cursor.y);
          lastSnapRef.current = snapHandle;
          setReconnectDrag((prev) => prev ? { ...prev, cursorX: cursor.x, cursorY: cursor.y, snapHandle } : null);
        }, 30);
      } else if (!dx && !dy && panIntervalRef.current) {
        clearInterval(panIntervalRef.current);
        panIntervalRef.current = null;
      }
    };

    const onPointerMove = (moveEvt) => {
      lastScreenPosRef.current = { x: moveEvt.clientX, y: moveEvt.clientY };
      const cursor = getCursorFlow(moveEvt.clientX, moveEvt.clientY);
      const snapHandle = findSnap(cursor.x, cursor.y);
      lastSnapRef.current = snapHandle;
      setReconnectDrag({ type, cursorX: cursor.x, cursorY: cursor.y, snapHandle });
      updateAutoPan(moveEvt.clientX, moveEvt.clientY);
    };

    const onPointerUp = (upEvt) => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      // Stop auto-pan
      if (panIntervalRef.current) {
        clearInterval(panIntervalRef.current);
        panIntervalRef.current = null;
      }
      const cursor = getCursorFlow(upEvt.clientX, upEvt.clientY);
      const snapAtRelease = findSnap(cursor.x, cursor.y);
      const snap = snapAtRelease || lastSnapRef.current;
      if (snap) {
        const updates = type === 'source'
          ? { source: snap.nodeId, sourceHandle: snap.pos }
          : { target: snap.nodeId, targetHandle: snap.pos };
        reconnectEdgeTo(id, updates);
      }
      setReconnectDrag(null);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }, [id, source, target, allNodes, getInternalNode, screenToFlowPosition, getViewport, setViewport, reconnectEdgeTo, getAbsPos, rfSourcePos, rfTargetPos]);

  const strokeWidth = style?.strokeWidth || 2;
  const edgeColor = selected ? 'var(--edge-selected)' : (style?.stroke || 'var(--edge-color)');

  return (
    <>
      {/* Wide invisible hit area for hover + click */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!activeDrag) setHovered(false); }}
        style={{ cursor: 'pointer', pointerEvents: reconnectDrag ? 'none' : 'auto' }}
      />
      {/* Main edge path — fades to 20% during reconnect mode */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          opacity: reconnectDrag ? 0.2 : 1,
        }}
        markerEnd={markerEnd}
        fill="none"
      />
      {/* Per-segment hit areas with directional cursors */}
      {draggableSegments.map((seg) => (
        <line
          key={`seg-hit-${seg.segIdx}`}
          x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
          stroke="transparent"
          strokeWidth={16}
          strokeLinecap="round"
          style={{ cursor: seg.direction === 'horizontal' ? 'ns-resize' : 'ew-resize' }}
          onPointerDown={(e) => handlePointerDown(e, seg.segIdx, seg.direction)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { if (!activeDrag) setHovered(false); }}
        />
      ))}
      {/* Reconnect drag preview — dashed line + dot + snap ring + debug markers */}
      {reconnectDrag && (() => {
        const fixedEnd = reconnectDrag.type === 'source'
          ? { x: waypoints[waypoints.length - 1][0], y: waypoints[waypoints.length - 1][1] }
          : { x: waypoints[0][0], y: waypoints[0][1] };
        const snapped = reconnectDrag.snapHandle;
        const dragEnd = snapped
          ? { x: snapped.x, y: snapped.y }
          : { x: reconnectDrag.cursorX, y: reconnectDrag.cursorY };
        return (
          <>
            {/* Available snap targets — small dots at each handle */}
            {dragHandlesRef.current.map((h, i) => (
              <circle key={`snap-target-${i}`} cx={h.x} cy={h.y} r={4}
                fill="var(--accent-blue)" opacity={0.3} stroke="none" />
            ))}
            <line
              x1={fixedEnd.x} y1={fixedEnd.y}
              x2={dragEnd.x} y2={dragEnd.y}
              stroke="var(--accent-blue)"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="none"
            />
            <circle
              cx={dragEnd.x} cy={dragEnd.y}
              r={snapped ? 6 : 4}
              fill="var(--accent-blue)"
            />
            {snapped && (
              <circle
                cx={snapped.x} cy={snapped.y}
                r={9}
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth={2}
                opacity={0.5}
              />
            )}
          </>
        );
      })()}
      {/* Reconnect handles as SVG circles — rendered in SVG layer, always on top of paths.
           Each has an invisible 20px hit area behind the visible 7px dot for easy grabbing. */}
      {selected && !activeDrag && !reconnectDrag && (
        <>
          {/* Source handle */}
          <circle
            cx={waypoints[0][0]} cy={waypoints[0][1]}
            r={20}
            fill="transparent"
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onPointerDown={(e) => handleReconnectStart(e, 'source')}
          />
          <circle
            cx={waypoints[0][0]} cy={waypoints[0][1]}
            r={7}
            fill="var(--accent-blue)"
            stroke="var(--bg-canvas)"
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
          />
          {/* Target handle */}
          <circle
            cx={waypoints[waypoints.length - 1][0]} cy={waypoints[waypoints.length - 1][1]}
            r={20}
            fill="transparent"
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onPointerDown={(e) => handleReconnectStart(e, 'target')}
          />
          <circle
            cx={waypoints[waypoints.length - 1][0]} cy={waypoints[waypoints.length - 1][1]}
            r={7}
            fill="var(--accent-blue)"
            stroke="var(--bg-canvas)"
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
          />
        </>
      )}
      <EdgeLabelRenderer>
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
              fontSize: labelStyle?.fontSize || 12,
              fontWeight: labelStyle?.fontWeight || 500,
              fontFamily: labelStyle?.fontFamily || 'var(--app-font, Inter, sans-serif)',
              color: labelStyle?.fill || 'var(--text-primary)',
              background: labelBgStyle?.fill || 'var(--bg-canvas)',
              opacity: labelBgStyle?.fillOpacity || 0.9,
              padding: labelBgPadding
                ? `${labelBgPadding[1]}px ${labelBgPadding[0]}px`
                : '4px 6px',
              borderRadius: labelBgBorderRadius || 4,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        )}
        {(selected || hovered || activeDrag) && draggableSegments.map((seg) => (
          <div
            key={`seg-handle-${seg.segIdx}`}
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--accent-blue)',
              border: '2px solid var(--bg-canvas)',
              cursor: seg.direction === 'horizontal' ? 'ns-resize' : 'ew-resize',
              pointerEvents: 'all',
              transform: `translate(-50%, -50%) translate(${seg.midX}px, ${seg.midY}px)`,
              zIndex: 10,
            }}
            className="nodrag nopan"
            onPointerDown={(e) => handlePointerDown(e, seg.segIdx, seg.direction)}
          />
        ))}
        {/* Swap direction button — only when edge selected, not dragging */}
        {selected && !activeDrag && !reconnectDrag && (
          <div
            className="nodrag nopan wf-swap-btn"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${swapPos.x}px, ${swapPos.y}px)`,
              cursor: 'pointer',
              pointerEvents: 'all',
              background: 'var(--bg-node)',
              border: '1px solid var(--border-primary)',
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              zIndex: 20,
              lineHeight: 1.2,
            }}
            onClick={() => swapEdgeDirection(id)}
            title="Swap direction"
          >
            ⇄
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

// ───── Auto-nearest-connector using ABSOLUTE positions ─────

const LABEL_OFFSET = 22; // .wf-node margin-top for label-above space

function computeAutoHandles(srcNode, tgtNode, allNodes, getAbsPos) {
  const resolveNode = (node) => {
    if (node.data?._hiddenInZone) {
      const zone = allNodes.find((n) => n.id === node.data._hiddenInZone);
      if (zone) {
        const zonePos = getAbsPos(zone.id, zone.position);
        return {
          absPos: zonePos,
          w: zone.style?.width || zone.measured?.width || 400,
          h: zone.style?.height || 50,
          labelOff: 0,
        };
      }
    }
    const absPos = getAbsPos(node.id, node.position);
    const isGroup = node.type === 'groupNode';
    const isCollapsed = node.data?.collapsed || false;
    return {
      absPos,
      w: node.measured?.width || DEFAULT_W,
      h: node.measured?.height || DEFAULT_H,
      labelOff: (isGroup || isCollapsed) ? 0 : LABEL_OFFSET,
    };
  };

  const src = resolveNode(srcNode);
  const tgt = resolveNode(tgtNode);

  // Use CARD center (offset by labelOff) for direction computation
  const srcCx = src.absPos.x + src.w / 2;
  const srcCy = src.absPos.y + (src.h + src.labelOff) / 2;
  const tgtCx = tgt.absPos.x + tgt.w / 2;
  const tgtCy = tgt.absPos.y + (tgt.h + tgt.labelOff) / 2;

  const dx = tgtCx - srcCx;
  const dy = tgtCy - srcCy;

  // Handle positions on the CARD (top of card = absPos.y + labelOff)
  const srcHandles = [
    { x: src.absPos.x + src.w / 2, y: src.absPos.y + src.labelOff,              pos: 'top',    score: -dy },
    { x: src.absPos.x + src.w / 2, y: src.absPos.y + src.h,                     pos: 'bottom', score: dy },
    { x: src.absPos.x,             y: src.absPos.y + (src.h + src.labelOff) / 2, pos: 'left',   score: -dx },
    { x: src.absPos.x + src.w,     y: src.absPos.y + (src.h + src.labelOff) / 2, pos: 'right',  score: dx },
  ];

  const tgtHandles = [
    { x: tgt.absPos.x + tgt.w / 2, y: tgt.absPos.y + tgt.labelOff,              pos: 'top',    score: dy },
    { x: tgt.absPos.x + tgt.w / 2, y: tgt.absPos.y + tgt.h,                     pos: 'bottom', score: -dy },
    { x: tgt.absPos.x,             y: tgt.absPos.y + (tgt.h + tgt.labelOff) / 2, pos: 'left',   score: dx },
    { x: tgt.absPos.x + tgt.w,     y: tgt.absPos.y + (tgt.h + tgt.labelOff) / 2, pos: 'right',  score: -dx },
  ];

  // Zone header penalty: when target is inside a zone and source is beside the zone,
  // penalize "top" target handle (would cross zone header) and prefer side entry.
  // Skip penalty when source is above the zone — top entry is natural in that case.
  const tgtAbsPos = tgt.absPos;
  const srcAbsPos = src.absPos;
  const zones = allNodes.filter((n) => n.type === 'groupNode');
  for (const zone of zones) {
    const zonePos = getAbsPos(zone.id, zone.position);
    const zoneW = zone.style?.width || zone.measured?.width || 400;
    const zoneH = zone.style?.height || zone.measured?.height || 300;
    const tgtInZone =
      tgtAbsPos.x >= zonePos.x && tgtAbsPos.x < zonePos.x + zoneW &&
      tgtAbsPos.y >= zonePos.y && tgtAbsPos.y < zonePos.y + zoneH;
    const srcInZone =
      srcAbsPos.x >= zonePos.x && srcAbsPos.x < zonePos.x + zoneW &&
      srcAbsPos.y >= zonePos.y && srcAbsPos.y < zonePos.y + zoneH;
    if (tgtInZone && !srcInZone) {
      // If source is above the zone, top entry is natural — skip penalty
      const srcBottom = srcAbsPos.y + src.h;
      if (srcBottom < zonePos.y + ZONE_HEADER_H) break;
      const topH = tgtHandles.find((h) => h.pos === 'top');
      if (topH) topH.score -= 1000;
      if (dx >= 0) {
        const leftH = tgtHandles.find((h) => h.pos === 'left');
        if (leftH) leftH.score += 200;
      } else {
        const rightH = tgtHandles.find((h) => h.pos === 'right');
        if (rightH) rightH.score += 200;
      }
      break;
    }
  }

  const bestSrc = [...srcHandles].sort((a, b) => b.score - a.score)[0];
  const bestTgt = [...tgtHandles].sort((a, b) => b.score - a.score)[0];

  return {
    sx: bestSrc.x, sy: bestSrc.y, sPos: bestSrc.pos,
    tx: bestTgt.x, ty: bestTgt.y, tPos: bestTgt.pos,
  };
}

// ───── Guarantee all segments are orthogonal (90°) ─────

function orthogonalize(pts, sPos, tPos) {
  if (pts.length < 2) return pts;
  const result = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = result[result.length - 1];
    const curr = pts[i];
    if (Math.abs(prev[0] - curr[0]) > 0.5 && Math.abs(prev[1] - curr[1]) > 0.5) {
      // Non-orthogonal: need to insert a corner point.
      // Two options: vertical-first [prev.x, curr.y] or horizontal-first [curr.x, prev.y]
      // Smart mode (sPos/tPos provided): choose based on stub directions so that
      // dragging segments preserves proper entry/exit angles.
      let useHorizFirst = false;
      if (sPos && tPos) {
        const prevPrev = result.length >= 2 ? result[result.length - 2] : null;
        if (!prevPrev) {
          // First corner: preserve source handle exit direction
          // Horizontal handles (left/right) exit horizontally → horizontal-first
          useHorizFirst = (sPos === 'left' || sPos === 'right');
        } else if (i === pts.length - 1) {
          // Last corner: preserve target handle entry direction
          // Vertical handles (top/bottom) enter vertically → horizontal-first
          useHorizFirst = (tPos === 'top' || tPos === 'bottom');
        } else {
          // Middle corners: alternate based on previous segment direction
          const prevIsVert = Math.abs(prevPrev[0] - prev[0]) < 0.5;
          useHorizFirst = prevIsVert;
        }
      }
      result.push(useHorizFirst ? [curr[0], prev[1]] : [prev[0], curr[1]]);
    }
    result.push(curr);
  }
  return result;
}

// ───── Helper: apply offset to a segment's waypoints ─────

function applySegmentOffset(pts, segIdx, offset) {
  if (segIdx < 0 || segIdx >= pts.length - 1) return pts;
  const result = pts.map((p) => [p[0], p[1]]);
  const [x1, y1] = result[segIdx];
  const [x2, y2] = result[segIdx + 1];
  const isHoriz = Math.abs(y1 - y2) < 1;
  if (isHoriz) {
    result[segIdx] = [x1, y1 + offset];
    result[segIdx + 1] = [x2, y2 + offset];
  } else {
    result[segIdx] = [x1 + offset, y1];
    result[segIdx + 1] = [x2 + offset, y2];
  }
  return result;
}

// ───── SVG Path ─────

function waypointsToPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0]} ${pts[i][1]}`;
  }
  return d;
}

// ───── Intersection ─────

function segmentHitsBox(x1, y1, x2, y2, box) {
  const isHoriz = Math.abs(y1 - y2) < 1;
  const isVert = Math.abs(x1 - x2) < 1;
  if (isHoriz) {
    const y = y1;
    if (y <= box.top || y >= box.bottom) return false;
    const segL = Math.min(x1, x2);
    const segR = Math.max(x1, x2);
    return segR > box.left && segL < box.right;
  }
  if (isVert) {
    const x = x1;
    if (x <= box.left || x >= box.right) return false;
    const segT = Math.min(y1, y2);
    const segB = Math.max(y1, y2);
    return segB > box.top && segT < box.bottom;
  }
  return false;
}

function findBlockingBox(x1, y1, x2, y2, boxes) {
  for (const box of boxes) {
    if (segmentHitsBox(x1, y1, x2, y2, box)) return box;
  }
  return null;
}

// ───── Basic Step Path ─────

function computeBasicStepPath(sx, sy, tx, ty, sPos, tPos) {
  if (sPos === 'bottom' && tPos === 'top') {
    if (Math.abs(sx - tx) < 1) return [[sx, sy], [sx, ty]];
    const midY = (sy + ty) / 2;
    return [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
  }
  if (sPos === 'top' && tPos === 'bottom') {
    if (Math.abs(sx - tx) < 1) return [[sx, sy], [sx, ty]];
    const midY = (sy + ty) / 2;
    return [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
  }
  if (sPos === 'right' && tPos === 'left') {
    if (tx > sx + 10) {
      if (Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];
      const midX = (sx + tx) / 2;
      return [[sx, sy], [midX, sy], [midX, ty], [tx, ty]];
    }
    const exitX = sx + 40;
    const entryX = tx - 40;
    const detourY = Math.min(sy, ty) - 120;
    return [[sx, sy], [exitX, sy], [exitX, detourY], [entryX, detourY], [entryX, ty], [tx, ty]];
  }
  if (sPos === 'left' && tPos === 'right') {
    if (tx < sx - 10) {
      if (Math.abs(sy - ty) < 1) return [[sx, sy], [tx, ty]];
      const midX = (sx + tx) / 2;
      return [[sx, sy], [midX, sy], [midX, ty], [tx, ty]];
    }
    const exitX = sx - 40;
    const entryX = tx + 40;
    const detourY = Math.min(sy, ty) - 120;
    return [[sx, sy], [exitX, sy], [exitX, detourY], [entryX, detourY], [entryX, ty], [tx, ty]];
  }
  if (sPos === 'right' && tPos === 'top') {
    if (tx >= sx) return [[sx, sy], [tx, sy], [tx, ty]];
    const exitX = sx + 40;
    const detourY = Math.min(sy, ty) - 120;
    return [[sx, sy], [exitX, sy], [exitX, detourY], [tx, detourY], [tx, ty]];
  }
  if (sPos === 'left' && tPos === 'top') {
    if (tx <= sx) return [[sx, sy], [tx, sy], [tx, ty]];
    const exitX = sx - 40;
    const detourY = Math.min(sy, ty) - 120;
    return [[sx, sy], [exitX, sy], [exitX, detourY], [tx, detourY], [tx, ty]];
  }
  if (sPos === 'bottom' && tPos === 'left') {
    const offX = tx - 40;
    if (sx <= offX) return [[sx, sy], [sx, ty], [tx, ty]];
    const midY = (sy + ty) / 2;
    return [[sx, sy], [sx, midY], [offX, midY], [offX, ty], [tx, ty]];
  }
  if (sPos === 'bottom' && tPos === 'right') {
    const offX = tx + 40;
    if (sx >= offX) return [[sx, sy], [sx, ty], [tx, ty]];
    const midY = (sy + ty) / 2;
    return [[sx, sy], [sx, midY], [offX, midY], [offX, ty], [tx, ty]];
  }
  if (sPos === 'top' && tPos === 'left') {
    const offY = Math.min(sy, ty) - 60;
    return [[sx, sy], [sx, offY], [tx - 60, offY], [tx - 60, ty], [tx, ty]];
  }
  if (sPos === 'top' && tPos === 'right') {
    const offY = Math.min(sy, ty) - 60;
    return [[sx, sy], [sx, offY], [tx + 60, offY], [tx + 60, ty], [tx, ty]];
  }
  if (sPos === 'right' && tPos === 'bottom') {
    return [[sx, sy], [tx, sy], [tx, ty]];
  }
  if (sPos === 'left' && tPos === 'bottom') {
    return [[sx, sy], [tx, sy], [tx, ty]];
  }
  if (sPos === 'right' && tPos === 'right') {
    const offX = Math.max(sx, tx) + 60;
    return [[sx, sy], [offX, sy], [offX, ty], [tx, ty]];
  }
  if (sPos === 'left' && tPos === 'left') {
    const offX = Math.min(sx, tx) - 60;
    return [[sx, sy], [offX, sy], [offX, ty], [tx, ty]];
  }
  if (sPos === 'top' && tPos === 'top') {
    const offY = Math.min(sy, ty) - 60;
    return [[sx, sy], [sx, offY], [tx, offY], [tx, ty]];
  }
  if (sPos === 'bottom' && tPos === 'bottom') {
    const offY = Math.max(sy, ty) + 60;
    return [[sx, sy], [sx, offY], [tx, offY], [tx, ty]];
  }
  const midY = (sy + ty) / 2;
  return [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
}

// ───── Detour around obstacle ─────

function computeDetour(x1, y1, x2, y2, box) {
  const isHoriz = Math.abs(y1 - y2) < 1;
  if (isHoriz) {
    const distTop = Math.abs(y1 - box.top);
    const distBot = Math.abs(y1 - box.bottom);
    const detourY = distTop <= distBot ? box.top : box.bottom;
    return [[x1, detourY], [x2, detourY]];
  } else {
    const distLeft = Math.abs(x1 - box.left);
    const distRight = Math.abs(x1 - box.right);
    const detourX = distLeft <= distRight ? box.left : box.right;
    return [[detourX, y1], [detourX, y2]];
  }
}

// ───── Enforce minimum exit/entry stubs (always inserted) ─────

function enforceStubs(waypoints, sPos, tPos) {
  if (waypoints.length < 2) return waypoints;
  const pts = waypoints.map((p) => [p[0], p[1]]);

  // Always insert source stub to guarantee a clean 90° exit
  const [sx, sy] = pts[0];
  const stubSrc =
    sPos === 'bottom' ? [sx, sy + STUB] :
    sPos === 'top' ? [sx, sy - STUB] :
    sPos === 'right' ? [sx + STUB, sy] :
    [sx - STUB, sy];
  pts.splice(1, 0, stubSrc);

  // Always insert target stub to guarantee a clean 90° entry
  const last = pts.length - 1;
  const [tx, ty] = pts[last];
  const stubTgt =
    tPos === 'top' ? [tx, ty - STUB] :
    tPos === 'bottom' ? [tx, ty + STUB] :
    tPos === 'left' ? [tx - STUB, ty] :
    [tx + STUB, ty];
  pts.splice(last, 0, stubTgt);

  return pts;
}

// ───── Smart Path with obstacle avoidance ─────

function computeSmartPath(sx, sy, tx, ty, sPos, tPos, boxes) {
  let waypoints = computeBasicStepPath(sx, sy, tx, ty, sPos, tPos);

  // Obstacle avoidance
  for (let iter = 0; iter < 12; iter++) {
    let found = false;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [x1, y1] = waypoints[i];
      const [x2, y2] = waypoints[i + 1];
      const blocker = findBlockingBox(x1, y1, x2, y2, boxes);
      if (blocker) {
        const detour = computeDetour(x1, y1, x2, y2, blocker);
        waypoints = [
          ...waypoints.slice(0, i + 1),
          ...detour,
          ...waypoints.slice(i + 1),
        ];
        found = true;
        break;
      }
    }
    if (!found) break;
  }

  // Enforce stubs, then orthogonalize + clean
  waypoints = enforceStubs(waypoints, sPos, tPos);
  waypoints = orthogonalize(waypoints);
  return cleanWaypoints(waypoints);
}

// ───── Cleanup ─────

function cleanWaypoints(pts) {
  if (pts.length <= 2) return pts;
  const result = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    // Preserve stub points (source stub at index 1, target stub at length-2)
    // so they survive cleanup and guarantee visible 30px entry/exit segments
    if (i === 1 || i === pts.length - 2) {
      result.push(pts[i]);
      continue;
    }
    const prev = result[result.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const sameX = Math.abs(prev[0] - curr[0]) < 1 && Math.abs(curr[0] - next[0]) < 1;
    const sameY = Math.abs(prev[1] - curr[1]) < 1 && Math.abs(curr[1] - next[1]) < 1;
    if (!sameX && !sameY) {
      result.push(curr);
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}
