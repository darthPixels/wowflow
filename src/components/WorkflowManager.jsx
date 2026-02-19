import { useState, useEffect } from 'react';
import { Icon } from '../icons';
import useWorkflowStore from '../store/workflowStore';
import { exampleWorkflow } from '../exampleWorkflow';

const API_URL = '/api';

export default function WorkflowManager() {
  const {
    token,
    workflowId,
    workflowName,
    nodes,
    edges,
    setWorkflow,
    setIsDirty,
    isDirty,
  } = useWorkflowStore();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch(`${API_URL}/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  };

  const handleNew = () => {
    setWorkflow({ id: null, name: 'Untitled Workflow', nodes: [], edges: [] });
  };

  const handleLoadDemo = () => {
    setWorkflow({
      id: null,
      name: exampleWorkflow.name,
      nodes: exampleWorkflow.nodes,
      edges: exampleWorkflow.edges,
    });
  };

  const handleLoad = async (wf) => {
    try {
      const res = await fetch(`${API_URL}/workflows/${wf.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflow({
          id: data.id,
          name: data.name,
          nodes: JSON.parse(data.nodes || '[]'),
          edges: JSON.parse(data.edges || '[]'),
        });
      }
    } catch (err) {
      console.error('Failed to load workflow:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = {
        name: workflowName,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      };

      let res;
      if (workflowId) {
        res = await fetch(`${API_URL}/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_URL}/workflows`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.id && !workflowId) {
          setWorkflow({ id: data.id, name: workflowName, nodes, edges });
        }
        setIsDirty(false);
        fetchWorkflows();
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch(`${API_URL}/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (workflowId === id) {
        handleNew();
      }
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="wf-wfmgr">
      <div
        className="wf-wfmgr__header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="wf-wfmgr__title">Workflows</span>
        <span className="wf-wfmgr__toggle">{expanded ? '▾' : '▸'}</span>
      </div>

      {expanded && (
        <div className="wf-wfmgr__content">
          {/* Action buttons */}
          <div className="wf-wfmgr__actions">
            <button className="wf-btn wf-btn--primary wf-btn--sm wf-btn--full" onClick={handleNew}>
              + New
            </button>
            <button
              className="wf-btn wf-btn--ghost wf-btn--sm wf-btn--full wf-wfmgr__save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Demo workflow */}
          <div className="wf-wfmgr__section-label">Demo</div>
          <div
            className="wf-wfmgr__item wf-wfmgr__item--demo"
            onClick={handleLoadDemo}
          >
            <Icon name="form" size={14} />
            <span className="wf-wfmgr__item-name">WorkSafeBC Form Creation</span>
          </div>

          {/* Saved workflows */}
          {workflows.length > 0 && (
            <>
              <div className="wf-wfmgr__section-label">Saved</div>
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className={`wf-wfmgr__item ${wf.id === workflowId ? 'wf-wfmgr__item--active' : ''}`}
                  onClick={() => handleLoad(wf)}
                >
                  <Icon name="process" size={14} />
                  <span className="wf-wfmgr__item-name">{wf.name}</span>
                  <button
                    className="wf-wfmgr__item-delete"
                    onClick={(e) => handleDelete(wf.id, e)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
