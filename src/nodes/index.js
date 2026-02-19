import ProcessNode from './ProcessNode';
import DecisionNode from './DecisionNode';
import StartEndNode from './StartEndNode';
import RoleNode from './RoleNode';
import ApprovalNode from './ApprovalNode';
import HandoffNode from './HandoffNode';
import NoteNode from './NoteNode';
import DocumentNode from './DocumentNode';
import GroupNode from './GroupNode';
import PictureNode from './PictureNode';

export const nodeTypes = {
  processNode: ProcessNode,
  decisionNode: DecisionNode,
  startEndNode: StartEndNode,
  roleNode: RoleNode,
  approvalNode: ApprovalNode,
  handoffNode: HandoffNode,
  noteNode: NoteNode,
  documentNode: DocumentNode,
  groupNode: GroupNode,
  pictureNode: PictureNode,
};

// All nodes drop as white/uncolored by default — user picks color later
export const nodeCategories = [
  {
    name: 'Layout',
    items: [
      { type: 'groupNode', label: 'Zone / Area', iconName: 'flag', data: { label: 'Zone', color: 'blue' } },
    ],
  },
  {
    name: 'Flow',
    items: [
      { type: 'startEndNode', label: 'Start', iconName: 'start', data: { variant: 'start', label: 'Start', icon: 'start' } },
      { type: 'startEndNode', label: 'End', iconName: 'end', data: { variant: 'end', label: 'End', icon: 'end' } },
      { type: 'processNode', label: 'Process', iconName: 'process', data: { icon: 'process' } },
      { type: 'decisionNode', label: 'Decision', iconName: 'decision', data: { icon: 'decision' } },
    ],
  },
  {
    name: 'People & Roles',
    items: [
      { type: 'roleNode', label: 'Person / Role', iconName: 'user', data: { icon: 'user' } },
      { type: 'roleNode', label: 'Team', iconName: 'users', data: { icon: 'users', label: 'Team' } },
      { type: 'roleNode', label: 'Product Owner', iconName: 'po', data: { icon: 'po', label: 'Product Owner' } },
      { type: 'approvalNode', label: 'Approval', iconName: 'approval', data: { icon: 'approval' } },
      { type: 'handoffNode', label: 'Handoff', iconName: 'handoff', data: { icon: 'handoff' } },
    ],
  },
  {
    name: 'Domain',
    items: [
      { type: 'processNode', label: 'IT / Dev', iconName: 'it', data: { icon: 'it', label: 'IT / Dev' } },
      { type: 'processNode', label: 'Business', iconName: 'business', data: { icon: 'business', label: 'Business' } },
      { type: 'processNode', label: 'Design', iconName: 'design', data: { icon: 'design', label: 'Design' } },
      { type: 'processNode', label: 'Form', iconName: 'form', data: { icon: 'form', label: 'Form' } },
      { type: 'processNode', label: 'Email', iconName: 'email', data: { icon: 'email', label: 'Email' } },
    ],
  },
  {
    name: 'Other',
    items: [
      { type: 'documentNode', label: 'Document', iconName: 'document', data: { icon: 'document' } },
      { type: 'noteNode', label: 'Note', iconName: 'note', data: { icon: 'note', label: 'Note' } },
      { type: 'processNode', label: 'Wait / Timer', iconName: 'clock', data: { icon: 'clock', label: 'Wait' } },
      { type: 'processNode', label: 'Database', iconName: 'database', data: { icon: 'database', label: 'Database' } },
      { type: 'processNode', label: 'Milestone', iconName: 'flag', data: { icon: 'flag', label: 'Milestone' } },
      { type: 'pictureNode', label: 'Picture', iconName: 'image', data: { icon: 'image', label: 'Picture' } },
    ],
  },
];
