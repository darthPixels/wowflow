import BaseNode from './BaseNode';

export default function RoleNode(props) {
  return (
    <BaseNode {...props} shape="rounded">
      {props.data.department && (
        <div className="wf-node__tag">{props.data.department}</div>
      )}
    </BaseNode>
  );
}
