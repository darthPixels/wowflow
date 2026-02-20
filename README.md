# Wowflow

A visual workflow editor for creating, editing, and managing business process workflows with an intuitive drag-and-drop canvas.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Features

### Canvas
- Drag-and-drop node placement from the left toolbar
- Pan with middle/right mouse button or scroll
- Zoom with pinch, scroll wheel, or the zoom slider
- Interactive minimap for quick navigation
- Multi-select with selection rectangle
- Delete nodes/edges with Backspace/Delete
- Snap-to-grid alignment

### Nodes
- 10 node types: Process, Decision, Approval, Role, Document, Handoff, Start/End, Note, Picture, Group (zone/swimlane)
- Double-click a node label to edit it inline
- Click a node to expand/collapse its description; nearby nodes shift automatically to avoid overlap
- Rich text descriptions with bold, italic, underline, headings, and lists
- Customize outline and fill color per node
- Collapse nodes to icon-only view

### Edges
- Smart orthogonal routing that avoids crossing through nodes
- Drag mid-segments to adjust routing manually
- Select an edge to see reconnect handles (blue dots) at start/end — drag to rewire to any connector, including a different handle on the same node
- Canvas auto-pans when dragging a reconnect handle near the screen edge
- Connectors snap within range for easy targeting
- Swap edge direction with the arrow button
- Stroke thickness controls both edge lines and node outlines
- Edge labels with background

### Color Themes
- Apply the built-in BPMN Industry Standard theme to color nodes by type
- Create, edit, and delete custom color themes
- Themes are saved to your browser

### Global Properties
- When nothing is selected, the right panel shows workflow-wide controls
- Set outline/fill color for all nodes at once
- Collapse or expand all nodes
- Set stroke thickness for all edges and node outlines

### UI Customization
- Light and dark mode
- Three UI scale options (Small, Medium, Large)
- Custom accent color
- Font family selection

### Save & Export
- Save and load workflows with the optional backend server
- Export workflows as JSON

## Other Commands

```bash
npm run dev:client   # Client only (no server)
npm run build        # Production build
npm run preview      # Preview production build
npm start            # Server only
```

## Developer Documentation

See the [docs/](docs/) folder for architecture and technical details.
