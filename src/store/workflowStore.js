import { create } from 'zustand';
import { applyEdgeChanges, applyNodeChanges, MarkerType, reconnectEdge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

// Track which nodes belong to each actively dragged group.
// Populated once at drag start, cleared on drag end.
// Module-level to avoid polluting the store.
const _groupDragMembers = {};

// Estimate how much vertical space a description will add to a node
function estimateDescHeight(description) {
  if (!description) return 0;
  const plain = description.replace(/<[^>]*>/g, '').trim();
  if (!plain) return 0;
  const charsPerLine = 28;
  const lineHeight = 18;
  const lines = Math.max(1, Math.ceil(plain.length / charsPerLine));
  return lines * lineHeight + 50; // padding + border + margin
}

const useWorkflowStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('wowflow_token') || null,

  // Theme
  theme: localStorage.getItem('wowflow_theme') || 'dark',

  // Workflow
  workflowId: null,
  workflowName: 'Untitled Workflow',
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,

  // Internal: tracks open descriptions for shift management
  _openDescs: {}, // { [nodeId]: { height, nodeY } }

  // UI
  sidebarOpen: true,
  propertiesPanelOpen: false,
  isDirty: false,
  globalThickness: 2, // Shared thickness for edges AND node outlines

  // Auth actions
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('wowflow_token', token);
    } else {
      localStorage.removeItem('wowflow_token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('wowflow_token');
    set({ user: null, token: null });
  },

  // Theme actions
  setTheme: (theme) => {
    localStorage.setItem('wowflow_theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('wowflow_theme', next);
    set({ theme: next });
  },

  // Workflow actions
  setWorkflow: ({ id, name, nodes, edges }) => {
    // Infer global thickness from first edge (all edges share the same thickness)
    const loadedEdges = edges || [];
    const thickness = loadedEdges.length > 0 ? (loadedEdges[0].data?.thickness || 2) : 2;
    set({
      workflowId: id,
      workflowName: name || 'Untitled Workflow',
      nodes: nodes || [],
      edges: loadedEdges,
      globalThickness: thickness,
      isDirty: false,
      _openDescs: {},
    });
  },

  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),

  // Node actions — also handles zone/group drag-to-move-contained-nodes
  onNodesChange: (changes) => {
    const prevNodes = get().nodes;
    let updatedNodes = applyNodeChanges(changes, prevNodes);

    // When a group node is dragged, move only the nodes that were
    // inside it when the drag STARTED (not whatever happens to be
    // under it mid-drag). Membership is recorded once in
    // _groupDragMembers and cleared on drag end.
    const posChanges = changes.filter(
      (c) => c.type === 'position' && c.dragging && c.position
    );

    for (const change of posChanges) {
      const prevGroup = prevNodes.find((n) => n.id === change.id);
      if (!prevGroup || prevGroup.type !== 'groupNode') continue;

      const dx = change.position.x - prevGroup.position.x;
      const dy = change.position.y - prevGroup.position.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) continue;

      // First drag frame: record which nodes are inside this group
      if (!_groupDragMembers[change.id]) {
        const gw = prevGroup.style?.width || 400;
        const gh = prevGroup.style?.height || 300;
        const members = new Set();
        for (const n of prevNodes) {
          if (n.type === 'groupNode') continue;
          if (n.id === change.id) continue;
          const inside =
            n.position.x >= prevGroup.position.x &&
            n.position.y >= prevGroup.position.y &&
            n.position.x < prevGroup.position.x + gw &&
            n.position.y < prevGroup.position.y + gh;
          if (inside) members.add(n.id);
        }
        _groupDragMembers[change.id] = members;
      }

      // Move only recorded members
      const members = _groupDragMembers[change.id];
      updatedNodes = updatedNodes.map((n) => {
        if (members.has(n.id)) {
          return {
            ...n,
            position: { x: n.position.x + dx, y: n.position.y + dy },
          };
        }
        return n;
      });
    }

    // Clean up membership when drag ends (position change without dragging)
    for (const change of changes) {
      if (change.type === 'position' && !change.dragging) {
        delete _groupDragMembers[change.id];
      }
    }

    set({ nodes: updatedNodes, isDirty: true });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    const edge = {
      ...connection,
      id: `e-${uuidv4()}`,
      type: 'smartStep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { strokeWidth: 2 },
      data: { label: '', thickness: 2 },
    };
    set({
      edges: [...get().edges, edge],
      isDirty: true,
    });
  },

  onReconnect: (oldEdge, newConnection) => {
    set({
      edges: reconnectEdge(oldEdge, newConnection, get().edges),
      isDirty: true,
    });
  },

  reconnectEdgeTo: (edgeId, updates) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              source: updates.source ?? e.source,
              sourceHandle: updates.sourceHandle ?? e.sourceHandle,
              target: updates.target ?? e.target,
              targetHandle: updates.targetHandle ?? e.targetHandle,
              data: { ...e.data, segmentAdjustments: undefined, manualHandles: true },
            }
          : e
      ),
      isDirty: true,
    });
  },

  swapEdgeDirection: (edgeId) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId
          ? {
              ...e,
              source: e.target,
              target: e.source,
              sourceHandle: e.targetHandle,
              targetHandle: e.sourceHandle,
              data: { ...e.data, segmentAdjustments: undefined },
            }
          : e
      ),
      isDirty: true,
    });
  },

  addNode: (type, position, data = {}) => {
    const id = `node-${uuidv4()}`;
    const defaults = getNodeDefaults(type);
    const newNode = {
      id,
      type,
      position,
      data: { ...defaults, ...data },
    };
    if (type === 'groupNode') {
      newNode.style = { width: 400, height: 300 };
      newNode.zIndex = -1;
    }
    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
      selectedNode: id,
      propertiesPanelOpen: true,
    });
    return id;
  },

  addNodeAndConnect: (type, position, sourceNodeId, data = {}) => {
    const id = `node-${uuidv4()}`;
    const defaults = getNodeDefaults(type);
    const newNode = {
      id,
      type,
      position,
      data: { ...defaults, ...data },
    };
    const edge = {
      id: `e-${uuidv4()}`,
      source: sourceNodeId,
      target: id,
      type: 'smartStep',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { strokeWidth: 2 },
      data: { label: '' },
    };
    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, edge],
      isDirty: true,
      selectedNode: id,
      propertiesPanelOpen: true,
    });
    return id;
  },

  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      isDirty: true,
    });
  },

  applyColorTheme: (themeMapping) => {
    const updatedNodes = get().nodes.map((node) => {
      if (node.type === 'groupNode') return node;
      const iconName = node.data?.icon;
      const colors = themeMapping[iconName];
      return {
        ...node,
        data: {
          ...node.data,
          outlineColor: colors?.outlineColor || 'none',
          fillColor: colors?.fillColor || 'none',
        },
      };
    });
    set({ nodes: updatedNodes, isDirty: true });
  },

  toggleNodeDescription: (nodeId) => {
    const nodes = get().nodes;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const opening = !node.data.showDesc;
    const openDescs = { ...get()._openDescs };
    let updatedNodes = [...nodes];

    if (opening) {
      // Opening — shift nodes below down by description height
      const descHeight = estimateDescHeight(node.data.description);
      const nodeY = node.position.y;
      openDescs[nodeId] = { height: descHeight, nodeY };

      updatedNodes = updatedNodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, zIndex: 1000, data: { ...n.data, showDesc: true } };
        }
        // Zones that CONTAIN the expanded node: grow taller (don't shift)
        if (n.type === 'groupNode') {
          const zoneTop = n.position.y;
          const zoneBot = zoneTop + (n.style?.height || 300);
          if (zoneTop <= nodeY && zoneBot > nodeY) {
            return { ...n, style: { ...n.style, height: (n.style?.height || 300) + descHeight } };
          }
          // Zone fully below: shift down
          if (zoneTop > nodeY) {
            return { ...n, position: { ...n.position, y: n.position.y + descHeight } };
          }
          return n;
        }
        // Regular nodes below: shift down
        if (n.position.y > nodeY) {
          return { ...n, position: { ...n.position, y: n.position.y + descHeight } };
        }
        return n;
      });
    } else {
      // Closing — shift nodes below back up
      const info = openDescs[nodeId];
      if (info) {
        const nodeY = node.position.y;
        updatedNodes = updatedNodes.map((n) => {
          if (n.id === nodeId) {
            return { ...n, zIndex: undefined, data: { ...n.data, showDesc: false } };
          }
          // Zones that contain the node: shrink back
          if (n.type === 'groupNode') {
            const zoneTop = n.position.y;
            const zoneBot = zoneTop + (n.style?.height || 300);
            if (zoneTop <= nodeY && zoneBot > nodeY) {
              return { ...n, style: { ...n.style, height: (n.style?.height || 300) - info.height } };
            }
            if (zoneTop > nodeY) {
              return { ...n, position: { ...n.position, y: n.position.y - info.height } };
            }
            return n;
          }
          // Regular nodes below: shift back up
          if (n.position.y > nodeY) {
            return { ...n, position: { ...n.position, y: n.position.y - info.height } };
          }
          return n;
        });
        delete openDescs[nodeId];
      } else {
        // Fallback: just toggle showDesc
        updatedNodes = updatedNodes.map((n) =>
          n.id === nodeId ? { ...n, zIndex: undefined, data: { ...n.data, showDesc: false } } : n
        );
      }
    }

    set({
      nodes: updatedNodes,
      _openDescs: openDescs,
      isDirty: true,
    });
  },

  deleteNode: (nodeId) => {
    const openDescs = { ...get()._openDescs };
    delete openDescs[nodeId];
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNode: null,
      propertiesPanelOpen: false,
      isDirty: true,
      _openDescs: openDescs,
    });
  },

  updateEdgeData: (edgeId, data) => {
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      ),
      isDirty: true,
    });
  },

  // Global batch updates — apply to all nodes/edges at once
  setAllNodesData: (dataUpdate) => {
    set({
      nodes: get().nodes.map((n) =>
        n.type !== 'groupNode' && n.type !== 'pictureNode'
          ? { ...n, data: { ...n.data, ...dataUpdate } }
          : n
      ),
      isDirty: true,
    });
  },

  setAllEdgesData: (dataUpdate) => {
    const update = {
      edges: get().edges.map((e) => ({
        ...e,
        data: { ...e.data, ...dataUpdate },
      })),
      isDirty: true,
    };
    // Sync global thickness (controls both edges and node outlines)
    if (dataUpdate.thickness != null) {
      update.globalThickness = dataUpdate.thickness;
    }
    set(update);
  },

  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
      selectedEdge: null,
      isDirty: true,
    });
  },

  // Selection
  setSelectedNode: (nodeId) =>
    set({
      selectedNode: nodeId,
      selectedEdge: null,
      propertiesPanelOpen: !!nodeId,
    }),

  setSelectedEdge: (edgeId) =>
    set({
      selectedEdge: edgeId,
      selectedNode: null,
      propertiesPanelOpen: !!edgeId,
    }),

  clearSelection: () =>
    set({
      selectedNode: null,
      selectedEdge: null,
      propertiesPanelOpen: false,
    }),

  // Zone collapse/expand
  collapseZone: (zoneId) => {
    const nodes = get().nodes;
    const zone = nodes.find((n) => n.id === zoneId);
    if (!zone || zone.type !== 'groupNode') return;

    const zoneW = zone.style?.width || 400;
    const zoneH = zone.style?.height || 300;
    const zoneCenterX = zone.position.x + zoneW / 2;
    const zoneCenterY = zone.position.y + 25; // center of header

    // Find nodes inside the zone
    const savedPositions = {};
    const updatedNodes = nodes.map((n) => {
      if (n.id === zoneId) {
        return {
          ...n,
          data: { ...n.data, zoneCollapsed: true, _savedHeight: zoneH, _savedPositions: {} },
          style: { ...n.style, height: 50 },
        };
      }
      if (n.type === 'groupNode') return n;

      const isInside =
        n.position.x >= zone.position.x &&
        n.position.y >= zone.position.y &&
        n.position.x < zone.position.x + zoneW &&
        n.position.y < zone.position.y + zoneH;

      if (isInside) {
        savedPositions[n.id] = { x: n.position.x, y: n.position.y };
        return {
          ...n,
          position: { x: zoneCenterX - 10, y: zoneCenterY - 10 },
          data: { ...n.data, _hiddenInZone: zoneId },
        };
      }
      return n;
    });

    // Store saved positions in zone data
    const finalNodes = updatedNodes.map((n) =>
      n.id === zoneId
        ? { ...n, data: { ...n.data, _savedPositions: savedPositions } }
        : n
    );

    set({ nodes: finalNodes, isDirty: true });
  },

  expandZone: (zoneId) => {
    const nodes = get().nodes;
    const zone = nodes.find((n) => n.id === zoneId);
    if (!zone || zone.type !== 'groupNode') return;

    const savedPositions = zone.data._savedPositions || {};
    const savedHeight = zone.data._savedHeight || 300;

    const updatedNodes = nodes.map((n) => {
      if (n.id === zoneId) {
        const { zoneCollapsed, _savedHeight, _savedPositions, ...restData } = n.data;
        return {
          ...n,
          data: restData,
          style: { ...n.style, height: savedHeight },
        };
      }
      if (n.data?._hiddenInZone === zoneId) {
        const saved = savedPositions[n.id];
        const { _hiddenInZone, ...restData } = n.data;
        return {
          ...n,
          position: saved || n.position,
          data: restData,
        };
      }
      return n;
    });

    set({ nodes: updatedNodes, isDirty: true });
  },

  // Dissolve zone — remove zone container, keep contained nodes
  dissolveZone: (zoneId) => {
    const nodes = get().nodes;
    const zone = nodes.find((n) => n.id === zoneId);
    if (!zone) return;

    // If zone was collapsed, restore node positions first
    const savedPositions = zone.data?._savedPositions || {};

    const updatedNodes = nodes
      .filter((n) => n.id !== zoneId)
      .map((n) => {
        if (n.data?._hiddenInZone === zoneId) {
          const saved = savedPositions[n.id];
          const { _hiddenInZone, ...restData } = n.data;
          return {
            ...n,
            position: saved || n.position,
            data: restData,
          };
        }
        return n;
      });

    set({
      nodes: updatedNodes,
      selectedNode: null,
      isDirty: true,
    });
  },

  // UI
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
}));

function getNodeDefaults(type) {
  const base = {
    description: '',
    icon: 'process',
    outlineColor: 'none',
    fillColor: 'none',
    collapsed: false,
  };
  const defaults = {
    processNode: { ...base, label: 'Process Step', role: '', duration: '' },
    decisionNode: { ...base, label: 'Decision', role: '', condition: '', icon: 'decision' },
    startEndNode: { ...base, label: 'Start', variant: 'start', icon: 'start' },
    roleNode: { ...base, label: 'Role', role: '', department: '', icon: 'user' },
    approvalNode: { ...base, label: 'Approval', role: '', approver: '', icon: 'approval' },
    handoffNode: { ...base, label: 'Handoff', fromRole: '', toRole: '', icon: 'handoff' },
    noteNode: { ...base, label: 'Note', icon: 'note' },
    documentNode: { ...base, label: 'Document', docType: '', icon: 'document' },
    pictureNode: { ...base, label: 'Picture', icon: 'image', imageData: '' },
    groupNode: { label: 'Zone', color: 'blue', subtitle: '' },
  };
  return defaults[type] || { ...base, label: 'Node' };
}

export default useWorkflowStore;
