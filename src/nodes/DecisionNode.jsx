import BaseNode from './BaseNode';

export default function DecisionNode(props) {
  return (
    <BaseNode {...props}>
      {props.data.condition && (
        <div className="wf-node__tag">{props.data.condition}</div>
      )}
    </BaseNode>
  );
}
