import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '../nodes';
import SmartStepEdge from '../edges/SmartStepEdge';
import useWorkflowStore from '../store/workflowStore';

const DEFAULT_EDGE_THICKNESS = 2;

const defaultEdgeOptions = {
  type: 'smartStep',
  style: { strokeWidth: DEFAULT_EDGE_THICKNESS },
};

const edgeTypes = {
  smartStep: SmartStepEdge,
};

const ZOOM_LEVELS = [10, 25, 50, 75, 100, 125, 150, 175, 200, 250];

function ZoomSlider() {
  const { zoom } = useViewport();
  const { zoomTo } = useReactFlow();
  const pct = Math.round(zoom * 100);

  // Find nearest level index for the slider position
  const nearestIdx = ZOOM_LEVELS.reduce((best, level, i) =>
    Math.abs(level - pct) < Math.abs(ZOOM_LEVELS[best] - pct) ? i : best, 0);

  const handleChange = (e) => {
    const idx = Number(e.target.value);
    zoomTo(ZOOM_LEVELS[idx] / 100, { duration: 150 });
  };

  return (
    <div className="wf-zoom-slider">
      <input
        type="range"
        min={0}
        max={ZOOM_LEVELS.length - 1}
        step={1}
        value={nearestIdx}
        onChange={handleChange}
        className="wf-zoom-slider__input"
      />
      <span className="wf-zoom-slider__label">{pct}%</span>
    </div>
  );
}

export default function Canvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    setSelectedEdge,
    clearSelection,
    selectedEdge,
    theme,
  } = useWorkflowStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/wowflow-node-type');
      if (!type) return;

      let extraData = {};
      try {
        extraData = JSON.parse(
          event.dataTransfer.getData('application/wowflow-node-data') || '{}'
        );
      } catch {
        // ignore
      }

      const raw = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const position = {
        x: Math.round(raw.x / 16) * 16,
        y: Math.round(raw.y / 16) * 16,
      };

      addNode(type, position, extraData);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onEdgeClick = useCallback(
    (_, edge) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Map edges with styling
  const styledEdges = edges.map((e) => {
    const thickness = e.data?.thickness || DEFAULT_EDGE_THICKNESS;
    return {
      ...e,
      type: 'smartStep',
      label: e.data?.label || undefined,
      labelStyle: {
        fill: 'var(--text-primary)',
        fontWeight: 500,
        fontSize: 12,
        fontFamily: 'var(--app-font, Inter, sans-serif)',
      },
      labelBgStyle: { fill: 'var(--bg-canvas)', fillOpacity: 0.9 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 4,
      style: {
        strokeWidth: thickness,
        stroke: 'var(--edge-color)',
      },
      markerEnd: e.markerEnd
        ? { ...e.markerEnd, color: 'var(--edge-color)' }
        : undefined,
    };
  });

  const colorMap = {
    blue: '#0071e3', green: '#34c759', orange: '#ff9500', red: '#ff3b30',
    purple: '#af52de', teal: '#5ac8fa', pink: '#ff2d55', yellow: '#ffcc00',
    gray: '#8e8e93',
  };

  return (
    <div className={`wf-canvas ${selectedEdge ? 'wf-canvas--edge-active' : ''}`} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.05}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        selectionOnDrag
        panOnDrag={[1, 2]}
        panOnScroll
        panActivationKeyCode="Space"
        selectionMode={SelectionMode.Partial}
        zoomOnPinch
        connectionLineType="step"
        connectionLineStyle={{ stroke: 'var(--accent-blue)', strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={theme === 'dark' ? '#333' : '#ddd'}
        />
        <Controls
          className="wf-controls"
          showInteractive={false}
        />
        <ZoomSlider />
        <MiniMap
          className="wf-minimap"
          pannable
          zoomable
          nodeColor={(node) => {
            if (node.type === 'groupNode') return colorMap[node.data?.color] || 'transparent';
            return colorMap[node.data?.outlineColor] || '#8e8e93';
          }}
          maskColor={theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)'}
          style={{
            backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f5f5f7',
          }}
        />
      </ReactFlow>
    </div>
  );
}
