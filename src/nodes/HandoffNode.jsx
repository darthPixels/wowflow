import BaseNode from './BaseNode';
import { Icon } from '../icons';

export default function HandoffNode(props) {
  const { fromRole, toRole } = props.data;
  return (
    <BaseNode {...props} shape="rounded">
      {fromRole && toRole && (
        <div className="wf-node__handoff-flow">
          <span>{fromRole}</span>
          <Icon name="handoff" size={14} />
          <span>{toRole}</span>
        </div>
      )}
    </BaseNode>
  );
}
