// Example workflow: Form creation/update process at a large health insurance company
// Modeled after organizations like WorkSafeBC

const X = 16; // grid unit
// Row spacing: 12*X between nodes, 4*X extra gap between zones

export const exampleWorkflow = {
  name: 'Form Creation & Update Process',
  nodes: [
    // === ZONES ===
    {
      id: 'zone-initiation',
      type: 'groupNode',
      position: { x: -8 * X, y: -6 * X },
      style: { width: 52 * X, height: 54 * X },
      zIndex: -1,
      data: { label: 'Initiation', subtitle: 'Request & Approval', color: 'blue' },
    },
    {
      id: 'zone-planning',
      type: 'groupNode',
      position: { x: 16 * X, y: 50 * X },
      style: { width: 30 * X, height: 52 * X },
      zIndex: -1,
      data: { label: 'Planning & Content', subtitle: 'Requirements, Compliance, Drafting', color: 'green' },
    },
    {
      id: 'zone-design',
      type: 'groupNode',
      position: { x: 16 * X, y: 104 * X },
      style: { width: 30 * X, height: 42 * X },
      zIndex: -1,
      data: { label: 'Design & Build', subtitle: 'UX, Accessibility, Development', color: 'purple' },
    },
    {
      id: 'zone-testing',
      type: 'groupNode',
      position: { x: -8 * X, y: 148 * X },
      style: { width: 52 * X, height: 32 * X },
      zIndex: -1,
      data: { label: 'Testing & QA', subtitle: 'Quality Assurance Cycle', color: 'orange' },
    },
    {
      id: 'zone-release',
      type: 'groupNode',
      position: { x: 16 * X, y: 182 * X },
      style: { width: 30 * X, height: 84 * X },
      zIndex: -1,
      data: { label: 'Release & Operate', subtitle: 'Deploy, Communicate, Monitor', color: 'teal' },
    },

    // === ROW 0: Trigger ===
    {
      id: 'start',
      type: 'startEndNode',
      position: { x: 24 * X, y: 0 },
      data: {
        label: 'Start',
        icon: 'start',
        variant: 'start',
        description: 'A new form is needed or an existing form requires updates (regulatory change, business process change, user feedback, etc.)',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 1: Request ===
    {
      id: 'request',
      type: 'processNode',
      position: { x: 22 * X, y: 12 * X },
      data: {
        label: 'Form Request Submitted',
        icon: 'form',
        role: 'Business Unit / Requestor',
        description: 'Requestor fills out a form request ticket. Includes: purpose, target audience, regulatory requirement (if any), deadline, and business justification.',
        duration: '1-2 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 2: PO Triage ===
    {
      id: 'po-triage',
      type: 'processNode',
      position: { x: 22 * X, y: 24 * X },
      data: {
        label: 'PO Triage & Prioritization',
        icon: 'po',
        role: 'Product Owner',
        description: 'Product Owner reviews the request, assesses priority against current backlog, checks for duplicates, and assigns to a sprint or roadmap slot.',
        duration: '1-3 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 3: Decision — Approved? ===
    {
      id: 'decision-approved',
      type: 'decisionNode',
      position: { x: 22 * X, y: 36 * X },
      data: {
        label: 'Request Approved?',
        icon: 'decision',
        condition: 'Approved?',
        description: 'PO decides whether the request is approved, deferred, or rejected. Considers budget, capacity, regulatory urgency.',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === Rejected path (left column, same row as decision) ===
    {
      id: 'rejected',
      type: 'processNode',
      position: { x: -4 * X, y: 36 * X },
      data: {
        label: 'Request Rejected / Deferred',
        icon: 'reject',
        role: 'Product Owner',
        description: 'Requestor is notified with reason. Deferred requests are re-evaluated next quarter.',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 4: Requirements ===
    {
      id: 'requirements',
      type: 'processNode',
      position: { x: 22 * X, y: 54 * X },
      data: {
        label: 'Requirements Gathering',
        icon: 'business',
        role: 'Business Analyst',
        description: 'BA works with stakeholders to document requirements: fields, validations, data mapping, accessibility needs, bilingual requirements, integration points (e.g., claims system, member portal).',
        duration: '3-10 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 5: Legal / Compliance ===
    {
      id: 'compliance-review',
      type: 'approvalNode',
      position: { x: 22 * X, y: 66 * X },
      data: {
        label: 'Legal & Compliance Review',
        icon: 'approval',
        role: 'Compliance Officer',
        approver: 'Legal / Privacy Team',
        description: 'Reviews for regulatory compliance (PIPEDA, provincial health privacy acts), required disclaimers, consent language, data retention rules.',
        duration: '3-5 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 6: Content Drafting ===
    {
      id: 'content-draft',
      type: 'processNode',
      position: { x: 22 * X, y: 78 * X },
      data: {
        label: 'Content Drafting',
        icon: 'document',
        role: 'Content Editor',
        description: 'Editor writes form labels, help text, error messages, instructions. Ensures plain language standards, reading level, and bilingual (EN/FR) requirements are met.',
        duration: '3-7 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 7: Content Review ===
    {
      id: 'content-review',
      type: 'approvalNode',
      position: { x: 22 * X, y: 90 * X },
      data: {
        label: 'Content Review & Sign-off',
        icon: 'approval',
        role: 'Business Unit Lead',
        approver: 'Requestor + Subject Matter Expert',
        description: 'Business stakeholders review the content for accuracy, completeness, and alignment with business intent.',
        duration: '2-4 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 8: Design ===
    {
      id: 'design',
      type: 'processNode',
      position: { x: 22 * X, y: 108 * X },
      data: {
        label: 'UI/UX Design',
        icon: 'design',
        role: 'UX Designer',
        description: 'Designer creates wireframes/mockups. Considers: responsive layout, accessibility (WCAG 2.1 AA), design system compliance, multi-step form flow, conditional logic display.',
        duration: '3-7 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 9: Accessibility ===
    {
      id: 'accessibility',
      type: 'approvalNode',
      position: { x: 22 * X, y: 120 * X },
      data: {
        label: 'Accessibility Review',
        icon: 'approval',
        role: 'Accessibility Specialist',
        approver: 'A11y Team',
        description: 'Verifies WCAG 2.1 AA compliance: screen reader compatibility, keyboard navigation, color contrast, form labeling, error announcement.',
        duration: '2-3 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 10: Development ===
    {
      id: 'development',
      type: 'processNode',
      position: { x: 22 * X, y: 132 * X },
      data: {
        label: 'IT Development',
        icon: 'it',
        role: 'Development Team',
        description: 'Developers implement the form: front-end build, API integration, validation rules, data mapping to backend systems (claims DB, CRM, document management). Includes unit tests.',
        duration: '5-15 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 11: QA ===
    {
      id: 'qa',
      type: 'processNode',
      position: { x: 22 * X, y: 152 * X },
      data: {
        label: 'QA Testing',
        icon: 'process',
        role: 'QA Team',
        description: 'Functional testing, cross-browser testing, mobile testing, accessibility testing, security testing (XSS, injection), data validation, integration testing with backend.',
        duration: '3-7 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 12: Decision — QA Pass? ===
    {
      id: 'decision-qa',
      type: 'decisionNode',
      position: { x: 22 * X, y: 164 * X },
      data: {
        label: 'QA Passed?',
        icon: 'decision',
        condition: 'Pass?',
        description: 'QA team determines if the form meets all quality criteria. Failed items go back to development.',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === QA Fail loop (left column, same row as QA) ===
    {
      id: 'qa-fix',
      type: 'processNode',
      position: { x: -4 * X, y: 152 * X },
      data: {
        label: 'Bug Fixes',
        icon: 'it',
        role: 'Development Team',
        description: 'Developers fix identified issues and resubmit for QA.',
        duration: '1-5 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 13: UAT ===
    {
      id: 'uat',
      type: 'processNode',
      position: { x: 22 * X, y: 186 * X },
      data: {
        label: 'User Acceptance Testing',
        icon: 'users',
        role: 'Business Stakeholders',
        description: 'Business users test the form in a staging environment. Validate real-world scenarios, data flow, and user experience.',
        duration: '3-5 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 14: Final Approval ===
    {
      id: 'final-approval',
      type: 'approvalNode',
      position: { x: 22 * X, y: 198 * X },
      data: {
        label: 'Final Stakeholder Approval',
        icon: 'approval',
        role: 'Director / VP',
        approver: 'Business Owner + IT Lead + Compliance',
        description: 'Final sign-off from all key stakeholders: business owner, IT lead, compliance officer. Must all approve before deployment.',
        duration: '1-3 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 15: Deploy ===
    {
      id: 'deploy',
      type: 'processNode',
      position: { x: 22 * X, y: 210 * X },
      data: {
        label: 'Deploy to Production',
        icon: 'it',
        role: 'DevOps / Release Mgr',
        description: 'Form is deployed to production during approved change window. Includes: DB migration, CDN cache clear, monitoring setup, rollback plan.',
        duration: '1 day',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 16: Communication ===
    {
      id: 'communication',
      type: 'processNode',
      position: { x: 22 * X, y: 222 * X },
      data: {
        label: 'Training & Communication',
        icon: 'email',
        role: 'Communications Team',
        description: 'Notify affected teams and external users. Update help documentation, create training materials if needed. Announce via email / intranet / partner portal.',
        duration: '2-5 days',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === ROW 17: Post-launch ===
    {
      id: 'post-launch',
      type: 'processNode',
      position: { x: 22 * X, y: 234 * X },
      data: {
        label: 'Post-Launch Monitoring',
        icon: 'database',
        role: 'Product Owner + IT',
        description: 'Monitor form submissions, error rates, completion rates, user feedback. Address any issues found in the first 2 weeks.',
        duration: '2 weeks',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },

    // === End ===
    {
      id: 'end',
      type: 'startEndNode',
      position: { x: 24 * X, y: 246 * X },
      data: {
        label: 'Done',
        icon: 'end',
        variant: 'end',
        description: 'Form is live and in production. Enters maintenance cycle.',
        outlineColor: 'none',
        fillColor: 'none',
        collapsed: false,
      },
    },
  ],

  edges: [
    edge('start', 'request'),
    edge('request', 'po-triage'),
    edge('po-triage', 'decision-approved'),
    edge('decision-approved', 'rejected', 'No'),
    edge('decision-approved', 'requirements', 'Yes'),
    edge('requirements', 'compliance-review'),
    edge('compliance-review', 'content-draft'),
    edge('content-draft', 'content-review'),
    edge('content-review', 'design'),
    edge('design', 'accessibility'),
    edge('accessibility', 'development'),
    edge('development', 'qa'),
    edge('qa', 'decision-qa'),
    edge('decision-qa', 'qa-fix', 'Fail'),
    edge('qa-fix', 'qa', 'Retest'),
    edge('decision-qa', 'uat', 'Pass'),
    edge('uat', 'final-approval'),
    edge('final-approval', 'deploy'),
    edge('deploy', 'communication'),
    edge('communication', 'post-launch'),
    edge('post-launch', 'end'),
  ],
};

function edge(source, target, label = '', sourceHandle = 'bottom', targetHandle = 'top') {
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'smartStep',
    animated: false,
    markerEnd: { type: 'arrowclosed', width: 16, height: 16 },
    style: { strokeWidth: 2 },
    data: { label, thickness: 2 },
  };
}
