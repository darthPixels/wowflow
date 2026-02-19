import { useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import Canvas from './Canvas';
import Toolbar from './Toolbar';
import TopBar from './TopBar';
import PropertiesPanel from './PropertiesPanel';
import useWorkflowStore from '../store/workflowStore';

export default function WorkflowEditor() {
  const { workflowName, nodes, edges } = useWorkflowStore();

  const handleExport = useCallback(() => {
    const data = {
      name: workflowName,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflowName, nodes, edges]);

  // Ctrl+S hint — save is handled by WorkflowManager
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save button click in WorkflowManager
        document.querySelector('.wf-wfmgr__save-btn')?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ReactFlowProvider>
      <div className="wf-editor">
        <TopBar onExport={handleExport} />
        <div className="wf-editor__main">
          <Toolbar />
          <Canvas />
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
