import { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Icon } from '../icons';
import useWorkflowStore from '../store/workflowStore';

const colorValues = {
  blue: { light: '#0071e3', dark: '#0a84ff' },
  green: { light: '#34c759', dark: '#30d158' },
  orange: { light: '#ff9500', dark: '#ff9f0a' },
  red: { light: '#ff3b30', dark: '#ff453a' },
  purple: { light: '#af52de', dark: '#bf5af2' },
  teal: { light: '#5ac8fa', dark: '#64d2ff' },
  pink: { light: '#ff2d55', dark: '#ff375f' },
  yellow: { light: '#ffcc00', dark: '#ffd60a' },
  gray: { light: '#8e8e93', dark: '#98989d' },
  white: { light: '#d2d2d7', dark: '#636366' },
};

export function getColor(name) {
  if (!name || name === 'none') return null;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  return colorValues[name]?.[theme] || null;
}

export function hexToRgba(hex, alpha) {
  if (!hex) return 'transparent';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BaseNode({
  data,
  id,
  selected,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef(null);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const toggleNodeDescription = useWorkflowStore((s) => s.toggleNodeDescription);
  // Hide node handles when this node is an endpoint of the selected edge
  const isEdgeEndpoint = useWorkflowStore((s) => {
    if (!s.selectedEdge) return false;
    const edge = s.edges.find((e) => e.id === s.selectedEdge);
    return edge ? edge.source === id || edge.target === id : false;
  });
  const nodeIndex = useWorkflowStore((s) => {
    let idx = 0;
    for (const n of s.nodes) {
      if (n.type === 'groupNode') continue;
      idx++;
      if (n.id === id) return idx;
    }
    return 0;
  });
  const collapsed = data.collapsed || false;
  const showDesc = data.showDesc || false;

  useEffect(() => {
    setEditValue(data.label);
  }, [data.label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // If node is hidden inside a collapsed zone, render as invisible point
  if (data._hiddenInZone) {
    return (
      <div style={{ width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}>
        <Handle type="target" position={Position.Top} className="wf-handle" id="top" />
        <Handle type="source" position={Position.Top} className="wf-handle" id="top" />
        <Handle type="source" position={Position.Bottom} className="wf-handle" id="bottom" />
        <Handle type="target" position={Position.Bottom} className="wf-handle" id="bottom" />
        <Handle type="target" position={Position.Left} className="wf-handle" id="left" />
        <Handle type="source" position={Position.Left} className="wf-handle" id="left" />
        <Handle type="source" position={Position.Right} className="wf-handle" id="right" />
        <Handle type="target" position={Position.Right} className="wf-handle" id="right" />
      </div>
    );
  }

  const outlineHex = getColor(data.outlineColor);
  const accentColor = outlineHex || 'var(--text-tertiary)';
  const hasFill = data.fillColor && data.fillColor !== 'none';
  const fillBg = hasFill ? hexToRgba(getColor(data.fillColor), 0.06) : 'transparent';
  const borderColor = outlineHex || 'var(--border-primary)';

  const handleDetailToggle = (e) => {
    e.stopPropagation();
    toggleNodeDescription(id);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const commitLabel = () => {
    setEditing(false);
    if (editValue.trim() && editValue !== data.label) {
      updateNodeData(id, { label: editValue.trim() });
    } else {
      setEditValue(data.label);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitLabel();
    if (e.key === 'Escape') {
      setEditValue(data.label);
      setEditing(false);
    }
  };

  const descHtml = data.description
    ? (/<[a-z][\s\S]*>/i.test(data.description)
        ? data.description
        : data.description.replace(/\n/g, '<br>'))
    : '';

  // ===== COLLAPSED =====
  if (collapsed) {
    return (
      <div
        className={`wf-node wf-node--collapsed ${selected ? 'wf-node--selected' : ''} ${isEdgeEndpoint ? 'wf-node--edge-endpoint' : ''}`}
        style={{ '--node-color': accentColor }}
        title={data.description ? data.description.replace(/<[^>]*>/g, '') : ''}
      >
        <div className="wf-node__collapsed-icon" style={{ color: accentColor }}>
          <Icon name={data.icon || 'process'} size={20} />
        </div>
        <div className="wf-node__collapsed-label" onDoubleClick={handleDoubleClick}>
          {editing ? (
            <input
              ref={inputRef}
              className="wf-node__label-input wf-node__label-input--sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={handleKeyDown}
            />
          ) : (
            data.label
          )}
        </div>
        {/* Bidirectional handles — source+target at each position */}
        <Handle type="target" position={Position.Top} className="wf-handle" id="top" />
        <Handle type="source" position={Position.Top} className="wf-handle" id="top" />
        <Handle type="source" position={Position.Bottom} className="wf-handle" id="bottom" />
        <Handle type="target" position={Position.Bottom} className="wf-handle" id="bottom" />
        <Handle type="target" position={Position.Left} className="wf-handle" id="left" />
        <Handle type="source" position={Position.Left} className="wf-handle" id="left" />
        <Handle type="source" position={Position.Right} className="wf-handle" id="right" />
        <Handle type="target" position={Position.Right} className="wf-handle" id="right" />
      </div>
    );
  }

  // ===== FULL NODE =====
  return (
    <div
      className={`wf-node ${selected ? 'wf-node--selected' : ''} ${isEdgeEndpoint ? 'wf-node--edge-endpoint' : ''}`}
      style={{
        '--node-color': accentColor,
        backgroundColor: fillBg,
        borderColor: borderColor,
      }}
    >
      {/* Label above — H1: bold, white */}
      <div className="wf-node__label-above" onDoubleClick={handleDoubleClick}>
        {editing ? (
          <input
            ref={inputRef}
            className="wf-node__label-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span>{data.label}</span>
        )}
      </div>

      {/* Detail toggle — top right of node */}
      {data.description && (
        <button
          className="wf-node__detail-btn"
          onClick={handleDetailToggle}
          title={showDesc ? 'Hide details' : 'Show details'}
        >
          {showDesc ? '▴' : '▾'}
        </button>
      )}

      {/* Main row: outline icon + shape body */}
      <div className="wf-node__content">
        <div className="wf-node__icon-outline" style={{ color: accentColor }}>
          <Icon name={data.icon || 'process'} size={24} />
        </div>

        <div className="wf-node__body">
          {data.role && (
            <div className="wf-node__role">
              <Icon name="user" size={12} />
              <span>{data.role}</span>
            </div>
          )}
          {children}
          {data.duration && (
            <div className="wf-node__meta">
              <Icon name="clock" size={12} />
              <span>{data.duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Inline description — expands the node */}
      {showDesc && descHtml && (
        <div className="wf-node__desc-section">
          <div
            className="wf-node__desc"
            dangerouslySetInnerHTML={{ __html: descHtml }}
          />
        </div>
      )}

      {/* Node number — bottom right */}
      {nodeIndex > 0 && (
        <div className="wf-node__number">#{nodeIndex}</div>
      )}

      {/* Bidirectional handles — source+target at each position */}
      <Handle type="target" position={Position.Top} className="wf-handle" id="top" />
      <Handle type="source" position={Position.Top} className="wf-handle" id="top" />
      <Handle type="source" position={Position.Bottom} className="wf-handle" id="bottom" />
      <Handle type="target" position={Position.Bottom} className="wf-handle" id="bottom" />
      <Handle type="target" position={Position.Left} className="wf-handle" id="left" />
      <Handle type="source" position={Position.Left} className="wf-handle" id="left" />
      <Handle type="source" position={Position.Right} className="wf-handle" id="right" />
      <Handle type="target" position={Position.Right} className="wf-handle" id="right" />
    </div>
  );
}
