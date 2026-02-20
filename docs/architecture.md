# Architecture

## Tech Stack

- **Frontend**: React 19, Vite 7
- **Canvas**: @xyflow/react v12 (React Flow)
- **State**: Zustand 5
- **Rich Text**: Tiptap
- **Backend**: Express 5, better-sqlite3, JWT auth

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
    GroupNode.jsx        # Zone/swimlane container

  edges/
    SmartStepEdge.jsx    # Custom orthogonal edge with obstacle avoidance

  store/
    workflowStore.js     # Zustand store (nodes, edges, selection, actions)

server/
  index.js               # Express server, API routes
  db.js                  # SQLite database setup
  auth.js                # JWT authentication middleware
```

## State Management (`workflowStore.js`)

Single Zustand store with actions for:
- Node/edge CRUD and selection
- Drag-and-drop node addition
- Edge reconnection (`reconnectEdgeTo` — sets `manualHandles: true`) and direction swap
- Description expand/collapse with automatic node shifting
- Batch updates (global properties including `globalThickness`)
- Color theme application
- Workflow persistence (save/load via API)

## CSS Zoom Compatibility

The app supports UI scaling via CSS `zoom` on the root element (`document.documentElement.style.zoom`). This affects coordinate conversions.

**Rule**: When using `screenToFlowPosition`, divide client coordinates by the CSS zoom factor first:

```js
const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
const pos = screenToFlowPosition({ x: clientX / cssZoom, y: clientY / cssZoom });
```

For delta-based calculations (segment drag), multiply the total zoom (`rfZoom * cssZoom`) into the divisor:

```js
const rfZoom = getViewport().zoom;
const cssZoom = parseFloat(document.documentElement.style.zoom) || 1;
const totalZoom = rfZoom * cssZoom;
const offset = (clientDelta) / totalZoom;
```

## Global Stroke Thickness

`globalThickness` in the Zustand store controls both edge stroke width and node outline width. It is applied via the CSS custom property `--stroke-thickness` on the canvas container. Node borders use `border-width: var(--stroke-thickness, 2px)`. When edges update their thickness, the store syncs `globalThickness` automatically.
