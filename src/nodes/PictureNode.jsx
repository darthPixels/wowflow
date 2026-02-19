import { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import useWorkflowStore from '../store/workflowStore';

export default function PictureNode({ id, data, selected }) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateNodeData(id, { imageData: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  // If hidden inside a collapsed zone, render as invisible point
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

  return (
    <div className={`wf-node wf-picture-node ${selected ? 'wf-node--selected' : ''}`}>
      {/* Label above */}
      {data.label && data.label !== 'Picture' && (
        <div className="wf-node__label-above">
          <span>{data.label}</span>
        </div>
      )}

      {data.imageData ? (
        <div className="wf-picture-node__image-wrap" onClick={() => fileRef.current?.click()}>
          <img src={data.imageData} alt={data.label || 'Picture'} className="wf-picture-node__img" />
        </div>
      ) : (
        <div className="wf-picture-node__placeholder" onClick={() => fileRef.current?.click()}>
          {/* Image upload icon */}
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="16" height="14" rx="2" />
            <circle cx="7" cy="8" r="1.5" />
            <path d="M18 13l-4-4-6 6" />
            <path d="M14 17l-6-6-6 4" />
          </svg>
          <span>Click to upload image</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

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
