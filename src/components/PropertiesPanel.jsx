import { useState } from 'react';
import useWorkflowStore from '../store/workflowStore';
import { Icon, iconList } from '../icons';
import DescriptionEditor from './DescriptionEditor';

const colorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'teal', label: 'Teal' },
  { value: 'pink', label: 'Pink' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'gray', label: 'Gray' },
];

export default function PropertiesPanel() {
  const {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    propertiesPanelOpen,
    updateNodeData,
    updateEdgeData,
    deleteNode,
    deleteEdge,
    setPropertiesPanelOpen,
    collapseZone,
    expandZone,
    dissolveZone,
    setAllNodesData,
    setAllEdgesData,
  } = useWorkflowStore();
  const [collapsed, setCollapsed] = useState(false);

  const node = selectedNode ? nodes.find((n) => n.id === selectedNode) : null;
  const edge = selectedEdge ? edges.find((e) => e.id === selectedEdge) : null;
  const hasSelection = node || edge;

  const handleNodeChange = (key, value) => {
    updateNodeData(selectedNode, { [key]: value });
  };

  const handleEdgeChange = (key, value) => {
    updateEdgeData(selectedEdge, { [key]: value });
  };

  return (
    <div className={`wf-properties ${collapsed ? 'wf-properties--collapsed' : ''}`}>
      <div className="wf-properties__header">
        <button
          className="wf-properties__toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '◂' : '▸'}
        </button>
        {!collapsed && (
          <span className="wf-properties__title">
            {node ? 'Properties' : edge ? 'Edge' : hasSelection ? 'Properties' : 'Workflow'}
          </span>
        )}
      </div>

      {!collapsed && (
        <div className="wf-properties__content wf-scrollable">
          {!hasSelection && (
            <GlobalProperties
              nodes={nodes}
              edges={edges}
              onSetAllNodes={setAllNodesData}
              onSetAllEdges={setAllEdgesData}
            />
          )}
          {node && node.type === 'groupNode' && <GroupProperties node={node} onChange={handleNodeChange} onDelete={() => deleteNode(selectedNode)} onCollapse={() => collapseZone(selectedNode)} onExpand={() => expandZone(selectedNode)} onDissolve={() => dissolveZone(selectedNode)} />}
          {node && node.type === 'pictureNode' && <PictureProperties node={node} onChange={handleNodeChange} onDelete={() => deleteNode(selectedNode)} />}
          {node && node.type !== 'groupNode' && node.type !== 'pictureNode' && <NodeProperties node={node} onChange={handleNodeChange} onDelete={() => deleteNode(selectedNode)} />}
          {edge && <EdgeProperties edge={edge} onChange={handleEdgeChange} onDelete={() => deleteEdge(selectedEdge)} />}
        </div>
      )}
    </div>
  );
}

function GlobalProperties({ nodes, edges, onSetAllNodes, onSetAllEdges }) {
  const nodeCount = nodes.filter((n) => n.type !== 'groupNode' && n.type !== 'pictureNode').length;
  const edgeCount = edges.length;

  return (
    <div className="wf-properties__fields">
      <div className="wf-properties__hint">
        Change properties for all {nodeCount} nodes and {edgeCount} edges at once.
      </div>

      {/* All nodes — outline color */}
      <div className="wf-properties__field">
        <label>All Nodes — Outline Color</label>
        <div className="wf-properties__colors">
          <button
            className="wf-properties__color-btn wf-properties__color-btn--none"
            onClick={() => onSetAllNodes({ outlineColor: 'none' })}
            title="No color"
          />
          {colorOptions.map((c) => (
            <button
              key={c.value}
              className="wf-properties__color-btn"
              style={{ backgroundColor: `var(--accent-${c.value})` }}
              onClick={() => onSetAllNodes({ outlineColor: c.value })}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* All nodes — fill color */}
      <div className="wf-properties__field">
        <label>All Nodes — Fill Color</label>
        <div className="wf-properties__colors">
          <button
            className="wf-properties__color-btn wf-properties__color-btn--none"
            onClick={() => onSetAllNodes({ fillColor: 'none' })}
            title="No fill"
          />
          {colorOptions.map((c) => (
            <button
              key={c.value}
              className="wf-properties__color-btn"
              style={{ backgroundColor: `var(--accent-${c.value})` }}
              onClick={() => onSetAllNodes({ fillColor: c.value })}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* All nodes — collapsed */}
      <div className="wf-properties__field">
        <div className="wf-properties__btn-row">
          <button
            className="wf-btn wf-btn--ghost wf-btn--full"
            onClick={() => onSetAllNodes({ collapsed: true })}
          >
            Collapse All
          </button>
          <button
            className="wf-btn wf-btn--ghost wf-btn--full"
            onClick={() => onSetAllNodes({ collapsed: false })}
          >
            Expand All
          </button>
        </div>
      </div>

      {/* All edges + node outlines — thickness */}
      <div className="wf-properties__field">
        <label>Stroke Thickness (Edges + Nodes)</label>
        <div className="wf-properties__btn-row">
          {[1, 1.5, 2, 3, 4].map((t) => (
            <button
              key={t}
              className="wf-btn wf-btn--ghost"
              onClick={() => onSetAllEdges({ thickness: t })}
            >
              {t}px
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NodeProperties({ node, onChange, onDelete }) {
  const { data, type } = node;

  return (
    <div className="wf-properties__fields">
      {/* Label */}
      <div className="wf-properties__field">
        <label>Label</label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
        />
      </div>

      {/* Icon picker */}
      <div className="wf-properties__field">
        <label>Icon</label>
        <div className="wf-properties__icons">
          {iconList.map((ic) => (
            <button
              key={ic.name}
              className={`wf-properties__icon-btn ${data.icon === ic.name ? 'active' : ''}`}
              onClick={() => onChange('icon', ic.name)}
              title={ic.label}
            >
              <Icon name={ic.name} size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="wf-properties__field">
        <label>Description</label>
        <DescriptionEditor
          value={data.description || ''}
          onChange={(val) => onChange('description', val)}
        />
      </div>

      {/* Outline Color */}
      <div className="wf-properties__field">
        <label>Outline Color</label>
        <div className="wf-properties__colors">
          <button
            className={`wf-properties__color-btn wf-properties__color-btn--none ${!data.outlineColor || data.outlineColor === 'none' ? 'active' : ''}`}
            onClick={() => onChange('outlineColor', 'none')}
            title="No color"
          />
          {colorOptions.map((c) => (
            <button
              key={c.value}
              className={`wf-properties__color-btn ${data.outlineColor === c.value ? 'active' : ''}`}
              style={{ backgroundColor: `var(--accent-${c.value})` }}
              onClick={() => onChange('outlineColor', c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Fill Color */}
      <div className="wf-properties__field">
        <label>Fill Color</label>
        <div className="wf-properties__colors">
          <button
            className={`wf-properties__color-btn wf-properties__color-btn--none ${data.fillColor === 'none' || !data.fillColor ? 'active' : ''}`}
            onClick={() => onChange('fillColor', 'none')}
            title="No fill"
          />
          {colorOptions.map((c) => (
            <button
              key={c.value}
              className={`wf-properties__color-btn ${data.fillColor === c.value ? 'active' : ''}`}
              style={{ backgroundColor: `var(--accent-${c.value})` }}
              onClick={() => onChange('fillColor', c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Type-specific fields */}
      {(type === 'processNode' || type === 'roleNode' || type === 'approvalNode') && (
        <div className="wf-properties__field">
          <label>Role / Responsible</label>
          <input
            type="text"
            value={data.role || ''}
            onChange={(e) => onChange('role', e.target.value)}
          />
        </div>
      )}

      {type === 'roleNode' && (
        <div className="wf-properties__field">
          <label>Department</label>
          <input
            type="text"
            value={data.department || ''}
            onChange={(e) => onChange('department', e.target.value)}
          />
        </div>
      )}

      {type === 'approvalNode' && (
        <div className="wf-properties__field">
          <label>Approver</label>
          <input
            type="text"
            value={data.approver || ''}
            onChange={(e) => onChange('approver', e.target.value)}
          />
        </div>
      )}

      {type === 'handoffNode' && (
        <>
          <div className="wf-properties__field">
            <label>From</label>
            <input
              type="text"
              value={data.fromRole || ''}
              onChange={(e) => onChange('fromRole', e.target.value)}
            />
          </div>
          <div className="wf-properties__field">
            <label>To</label>
            <input
              type="text"
              value={data.toRole || ''}
              onChange={(e) => onChange('toRole', e.target.value)}
            />
          </div>
        </>
      )}

      {type === 'decisionNode' && (
        <div className="wf-properties__field">
          <label>Condition</label>
          <input
            type="text"
            value={data.condition || ''}
            onChange={(e) => onChange('condition', e.target.value)}
            placeholder="e.g., Approved?"
          />
        </div>
      )}

      {type === 'processNode' && (
        <div className="wf-properties__field">
          <label>Duration</label>
          <input
            type="text"
            value={data.duration || ''}
            onChange={(e) => onChange('duration', e.target.value)}
            placeholder="e.g., 2 days"
          />
        </div>
      )}

      {type === 'documentNode' && (
        <div className="wf-properties__field">
          <label>Document Type</label>
          <input
            type="text"
            value={data.docType || ''}
            onChange={(e) => onChange('docType', e.target.value)}
            placeholder="e.g., PDF, Form Template"
          />
        </div>
      )}

      {type === 'startEndNode' && (
        <div className="wf-properties__field">
          <label>Variant</label>
          <select
            value={data.variant || 'start'}
            onChange={(e) => onChange('variant', e.target.value)}
          >
            <option value="start">Start</option>
            <option value="end">End</option>
          </select>
        </div>
      )}

      {/* Collapsed toggle */}
      <div className="wf-properties__field">
        <label className="wf-properties__checkbox-label">
          <input
            type="checkbox"
            checked={data.collapsed || false}
            onChange={(e) => onChange('collapsed', e.target.checked)}
          />
          <span>Collapsed (icon + label only)</span>
        </label>
      </div>

      <div className="wf-properties__actions">
        <button className="wf-btn wf-btn--danger wf-btn--full" onClick={onDelete}>
          Delete Node
        </button>
      </div>
    </div>
  );
}

const groupColorOptions = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'teal', label: 'Teal' },
  { value: 'pink', label: 'Pink' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'gray', label: 'Gray' },
];

function GroupProperties({ node, onChange, onDelete, onCollapse, onExpand, onDissolve }) {
  const { data } = node;
  const isCollapsed = data.zoneCollapsed || false;

  return (
    <div className="wf-properties__fields">
      <div className="wf-properties__field">
        <label>Label</label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
        />
      </div>

      <div className="wf-properties__field">
        <label>Subtitle</label>
        <input
          type="text"
          value={data.subtitle || ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="e.g., Phase 1, Business Layer"
        />
      </div>

      <div className="wf-properties__field">
        <label>Color</label>
        <div className="wf-properties__colors">
          {groupColorOptions.map((c) => (
            <button
              key={c.value}
              className={`wf-properties__color-btn ${data.color === c.value ? 'active' : ''}`}
              style={{ backgroundColor: `var(--accent-${c.value})` }}
              onClick={() => onChange('color', c.value)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="wf-properties__actions">
        <button
          className="wf-btn wf-btn--ghost wf-btn--full"
          onClick={isCollapsed ? onExpand : onCollapse}
        >
          {isCollapsed ? 'Expand Zone' : 'Collapse Zone'}
        </button>
        <button className="wf-btn wf-btn--ghost wf-btn--full" onClick={onDissolve}>
          Dissolve Zone
        </button>
        <button className="wf-btn wf-btn--danger wf-btn--full" onClick={onDelete}>
          Delete Zone & Contents
        </button>
      </div>
    </div>
  );
}

function PictureProperties({ node, onChange, onDelete }) {
  const { data } = node;
  const fileRef = { current: null };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange('imageData', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="wf-properties__fields">
      <div className="wf-properties__field">
        <label>Label</label>
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
        />
      </div>

      <div className="wf-properties__field">
        <label>Image</label>
        <input
          ref={(el) => (fileRef.current = el)}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          className="wf-btn wf-btn--ghost wf-btn--full"
          onClick={() => fileRef.current?.click()}
        >
          Upload Image
        </button>
        {data.imageData && (
          <>
            <img
              src={data.imageData}
              alt={data.label || 'Preview'}
              style={{ maxWidth: '100%', borderRadius: 6, marginTop: 8 }}
            />
            <button
              className="wf-btn wf-btn--danger wf-btn--sm"
              style={{ marginTop: 6 }}
              onClick={() => onChange('imageData', '')}
            >
              Remove Image
            </button>
          </>
        )}
      </div>

      <div className="wf-properties__actions">
        <button className="wf-btn wf-btn--danger wf-btn--full" onClick={onDelete}>
          Delete Node
        </button>
      </div>
    </div>
  );
}

function EdgeProperties({ edge, onChange, onDelete }) {
  return (
    <div className="wf-properties__fields">
      <div className="wf-properties__field">
        <label>Label</label>
        <input
          type="text"
          value={edge.data?.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="e.g., Yes, No, Approved"
        />
      </div>

      <div className="wf-properties__field">
        <label>Line Thickness</label>
        <input
          type="range"
          min="1"
          max="6"
          step="0.5"
          value={edge.data?.thickness || 2}
          onChange={(e) => onChange('thickness', parseFloat(e.target.value))}
        />
        <span className="wf-properties__range-value">{edge.data?.thickness || 2}px</span>
      </div>

      <div className="wf-properties__actions">
        <button className="wf-btn wf-btn--danger wf-btn--full" onClick={onDelete}>
          Delete Edge
        </button>
      </div>
    </div>
  );
}
