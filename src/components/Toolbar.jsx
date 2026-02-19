import { nodeCategories } from '../nodes';
import { Icon } from '../icons';
import useWorkflowStore from '../store/workflowStore';
import WorkflowManager from './WorkflowManager';

export default function Toolbar() {
  const { sidebarOpen, toggleSidebar } = useWorkflowStore();

  const onDragStart = (event, nodeType, nodeData) => {
    event.dataTransfer.setData('application/wowflow-node-type', nodeType);
    event.dataTransfer.setData('application/wowflow-node-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`wf-toolbar ${sidebarOpen ? '' : 'wf-toolbar--collapsed'}`}>
      <div className="wf-toolbar__header">
        <button className="wf-toolbar__toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '◂' : '▸'}
        </button>
      </div>

      {sidebarOpen && (
        <div className="wf-toolbar__content wf-scrollable">
          {/* Workflow manager */}
          <WorkflowManager />

          {/* Shapes */}
          <div className="wf-toolbar__separator" />
          <div className="wf-toolbar__section-title">Shapes</div>
          {nodeCategories.map((category) => (
            <div key={category.name} className="wf-toolbar__category">
              <div className="wf-toolbar__category-name">{category.name}</div>
              <div className="wf-toolbar__items">
                {category.items.map((item, idx) => (
                  <div
                    key={`${item.type}-${idx}`}
                    className="wf-toolbar__item"
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.data || {})}
                    title={item.label}
                  >
                    <span className="wf-toolbar__item-icon">
                      <Icon name={item.iconName} size={18} />
                    </span>
                    <span className="wf-toolbar__item-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
