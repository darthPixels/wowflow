import { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useWorkflowStore from '../store/workflowStore';

const colorValues = {
  blue: { bg: 'rgba(0, 113, 227, 0.06)', border: 'rgba(0, 113, 227, 0.25)', text: '#0a84ff' },
  green: { bg: 'rgba(52, 199, 89, 0.06)', border: 'rgba(52, 199, 89, 0.25)', text: '#30d158' },
  orange: { bg: 'rgba(255, 149, 0, 0.06)', border: 'rgba(255, 149, 0, 0.25)', text: '#ff9f0a' },
  red: { bg: 'rgba(255, 59, 48, 0.06)', border: 'rgba(255, 59, 48, 0.25)', text: '#ff453a' },
  purple: { bg: 'rgba(175, 82, 222, 0.06)', border: 'rgba(175, 82, 222, 0.25)', text: '#bf5af2' },
  teal: { bg: 'rgba(90, 200, 250, 0.06)', border: 'rgba(90, 200, 250, 0.25)', text: '#64d2ff' },
  pink: { bg: 'rgba(255, 45, 85, 0.06)', border: 'rgba(255, 45, 85, 0.25)', text: '#ff375f' },
  yellow: { bg: 'rgba(255, 204, 0, 0.06)', border: 'rgba(255, 204, 0, 0.25)', text: '#ffd60a' },
  gray: { bg: 'rgba(142, 142, 147, 0.06)', border: 'rgba(142, 142, 147, 0.25)', text: '#98989d' },
};

export default function GroupNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef(null);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const collapseZone = useWorkflowStore((s) => s.collapseZone);
  const expandZone = useWorkflowStore((s) => s.expandZone);
  const dissolveZone = useWorkflowStore((s) => s.dissolveZone);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  const isCollapsed = data.zoneCollapsed || false;

  useEffect(() => {
    setEditValue(data.label);
  }, [data.label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitLabel = () => {
    setEditing(false);
    if (editValue.trim() && editValue !== data.label) {
      updateNodeData(id, { label: editValue.trim() });
    } else {
      setEditValue(data.label);
    }
  };

  const handleCollapseToggle = (e) => {
    e.stopPropagation();
    if (isCollapsed) {
      expandZone(id);
    } else {
      collapseZone(id);
    }
  };

  const colors = colorValues[data.color] || colorValues.gray;

  return (
    <div
      className={`wf-group ${isCollapsed ? 'wf-group--collapsed' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {!isCollapsed && (
        <NodeResizer
          isVisible={selected}
          minWidth={200}
          minHeight={120}
          lineStyle={{ borderColor: colors.border }}
          handleStyle={{ backgroundColor: colors.text, width: 8, height: 8 }}
        />
      )}
      <div className="wf-group__header">
        <div className="wf-group__header-left">
          <div
            className="wf-group__label"
            style={{ color: colors.text }}
            onDoubleClick={() => setEditing(true)}
          >
            {editing ? (
              <input
                ref={inputRef}
                className="wf-group__label-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitLabel();
                  if (e.key === 'Escape') {
                    setEditValue(data.label);
                    setEditing(false);
                  }
                }}
              />
            ) : (
              data.label
            )}
          </div>
          {data.subtitle && !isCollapsed && (
            <div className="wf-group__subtitle">{data.subtitle}</div>
          )}
        </div>
        <div className="wf-group__actions">
          <button
            className="wf-group__action-btn"
            onClick={handleCollapseToggle}
            title={isCollapsed ? 'Expand zone' : 'Collapse zone'}
            style={{ color: colors.text }}
          >
            {isCollapsed ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 8.5L7 4.5L11 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11.5L7 7.5L11 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5.5L7 9.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 2.5L7 6.5L11 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <button
            className="wf-group__action-btn"
            onClick={(e) => { e.stopPropagation(); dissolveZone(id); }}
            title="Dissolve zone (keep nodes)"
            style={{ color: colors.text }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/></svg>
          </button>
          <button
            className="wf-group__action-btn"
            onClick={(e) => { e.stopPropagation(); setSelectedNode(id); }}
            title="Edit zone properties"
            style={{ color: colors.text }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5l3 3M2 12l1-4L10.5 0.5l3 3L6 11l-4 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            className="wf-group__action-btn wf-group__action-btn--danger"
            onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
            title="Delete zone and all nodes"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M4.5 4v7a1 1 0 001 1h3a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Bidirectional handles for collapsed zone edge routing */}
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
