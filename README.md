# Wowflow

A visual workflow editor built with React 19, @xyflow/react v12, and Zustand 5. Create, edit, and manage business process workflows with an intuitive drag-and-drop canvas.

## Tech Stack

- **Frontend**: React 19, Vite 7
- **Canvas**: @xyflow/react v12 (React Flow)
- **State**: Zustand 5
- **Rich Text**: Tiptap
- **Backend**: Express 5, better-sqlite3, JWT auth

## Getting Started

```bash
# Install dependencies
npm install

# Run development (client + server)
npm run dev

# Run client only
npm run dev:client

# Build for production
npm run build

# Preview production build
npm run preview

# Run server only
npm start
```

The dev server runs on `http://localhost:5173` (Vite default).

## Project Structure

```
src/
  App.jsx              # Root component, theme application
  App.css              # All application styles
  main.jsx             # Entry point
  theme.js             # Light/dark theme CSS variable definitions
  colorThemes.js       # BPMN-style color theme presets + CRUD
  icons.jsx            # SVG icon library
  exampleWorkflow.js   # Demo workflow data

  components/
    Canvas.jsx           # ReactFlow canvas with zoom, minimap, drag-drop
    TopBar.jsx           # Title bar with workflow name, settings, export
    Toolbar.jsx          # Left sidebar with draggable node types
    PropertiesPanel.jsx  # Right panel: node/edge/global properties
    DescriptionEditor.jsx # Tiptap rich text editor for descriptions
    ColorThemeManager.jsx # Color theme CRUD modal
    AppSettings.jsx      # UI scale, accent color, font settings
    ThemeToggle.jsx      # Light/dark mode toggle
    Logo.jsx             # App logo
    WorkflowEditor.jsx   # Main editor layout
    WorkflowManager.jsx  # Workflow list/CRUD (with auth)
    Login.jsx            # Login/register form

  nodes/
    BaseNode.jsx         # Shared node renderer (handles, label, description)
    index.js             # nodeTypes registry
    ProcessNode.jsx      # Process/task node
    DecisionNode.jsx     # Decision/gateway node
    ApprovalNode.jsx     # Approval node
    RoleNode.jsx         # Role/person node
    DocumentNode.jsx     # Document node
    HandoffNode.jsx      # Handoff/transition node
    StartEndNode.jsx     # Start/End event node
    NoteNode.jsx         # Annotation note
    PictureNode.jsx      # Image node
    GroupNode.jsx         # Zone/swimlane container

  edges/
    SmartStepEdge.jsx    # Custom orthogonal edge with obstacle avoidance

  store/
    workflowStore.js     # Zustand store (nodes, edges, selection, actions)

server/
  index.js               # Express server, API routes
  db.js                   # SQLite database setup
  auth.js                 # JWT authentication middleware
```

## Features

### Canvas
- Drag-and-drop node placement from the toolbar
- Snap-to-grid (16px)
- Pan (middle/right mouse button, scroll)
- Zoom (pinch, scroll wheel, zoom slider)
- Interactive minimap (pan and zoom)
- Multi-select with selection rectangle
- Delete nodes/edges with Backspace/Delete

### Nodes
- 10 node types: Process, Decision, Approval, Role, Document, Handoff, Start/End, Note, Picture, Group (zone/swimlane)
- Inline label editing (double-click)
- Outline and fill color per node
- Collapsible to icon-only view
- Rich text descriptions (bold, italic, underline, headings, lists)
- Click node to expand/collapse description; nearby nodes shift to avoid overlap

### Edges (Smart Step Edge)
- Orthogonal (90-degree) routing with clean stubs at entry/exit
- Obstacle avoidance: edges route around intermediate nodes
- Draggable mid-segments to adjust routing manually
- Segment drag handles appear on hover
- Edge labels with background
- Per-edge thickness control

### Edge Reconnection
- Select an edge to see start/end point handles (blue dots)
- Drag a handle toward another node's connector
- 5 screen-pixel snap radius: line snaps to the connector when close enough
- Original edge fades to 20% during drag; restores on cancel
- Release on a snapped connector to reconnect; release elsewhere to cancel
- When an edge is selected, node interactions are disabled so handles are easy to grab
- Swap direction button (reverses arrow) appears on selected edges

### Color Themes
- BPMN Industry Standard theme (colors by icon type)
- Custom themes with per-icon color mapping
- Apply, create, edit, delete themes
- Persisted to localStorage

### Global Properties
- When nothing is selected, the properties panel shows workflow-wide settings
- Set outline/fill color for all nodes at once
- Collapse/expand all nodes
- Set thickness for all edges

### UI Customization
- Light and dark mode
- UI scale (Small 0.85x, Medium 1x, Large 1.15x)
- Custom accent color
- Font family selection

### Persistence
- Optional Express + SQLite backend with JWT auth
- Save/load workflows
- Export as JSON

## Key Architecture Decisions

### Smart Step Edge (`SmartStepEdge.jsx`)
The custom edge component handles:
1. **Auto handle selection** (`computeAutoHandles`): picks the best connector pair (top/bottom/left/right) based on relative node positions, with a zone-header penalty to avoid routing through swimlane headers.
2. **Obstacle avoidance**: detects intersections with node bounding boxes and inserts detour waypoints.
3. **Stub enforcement**: always inserts 30px orthogonal stubs at entry/exit to guarantee clean 90-degree connections.
4. **Segment dragging**: mid-segments can be dragged perpendicular to their direction; adjustments are stored in `edge.data.segmentAdjustments`.
5. **Reconnect dragging**: delta-based coordinate tracking (avoids CSS zoom offset issues) with screen-pixel snap radius.

### State Management (`workflowStore.js`)
Single Zustand store with actions for:
- Node/edge CRUD and selection
- Drag-and-drop node addition
- Edge reconnection and direction swap
- Description expand/collapse with automatic node shifting
- Batch updates (global properties)
- Color theme application
- Workflow persistence (save/load via API)

### CSS Zoom Compatibility
The app supports UI scaling via CSS `zoom` on the root element. Interactive features (segment drag, edge reconnection) use delta-based coordinate calculations rather than `screenToFlowPosition` to avoid offset issues caused by CSS zoom.
