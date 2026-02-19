import BaseNode from './BaseNode';

export default function ApprovalNode(props) {
  return (
    <BaseNode {...props} shape="rounded">
      {props.data.approver && (
        <div className="wf-node__tag">Approver: {props.data.approver}</div>
      )}
    </BaseNode>
  );
}
