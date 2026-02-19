import BaseNode from './BaseNode';

export default function DocumentNode(props) {
  return (
    <BaseNode {...props} shape="rounded">
      {props.data.docType && (
        <div className="wf-node__tag">{props.data.docType}</div>
      )}
    </BaseNode>
  );
}
