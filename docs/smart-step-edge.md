# Smart Step Edge

`src/edges/SmartStepEdge.jsx` is the custom edge component that handles all edge routing and interaction.

## Routing Pipeline

### 1. Handle Selection

Two modes controlled by `edge.data.manualHandles`:

- **Auto mode** (default): `computeAutoHandles` picks the best connector pair (top/bottom/left/right) based on relative node positions. Applies a zone-header penalty to avoid routing through swimlane headers when the source is beside the zone (not above it — top entry is natural when source is directly above).
- **Manual mode** (`manualHandles: true`): Uses React Flow's provided positions (`sourceX/Y/Position`, `targetX/Y/Position`) which respect the stored `sourceHandle`/`targetHandle` values. Set automatically when an edge is reconnected via drag.

### 2. Basic Path Computation (`computeBasicStepPath`)
Generates an orthogonal step path based on handle positions (sPos/tPos). Handles 16 direction combinations with smart routing — e.g., `bottom→left` routes the vertical segment to the left of the target node (40px past the handle) to avoid crossing through the node body.

### 3. Obstacle Avoidance
Each segment is checked for intersection with node bounding boxes (padded by 36px) and zone headers. When an intersection is found, detour waypoints are inserted to route around the obstacle. Zone headers of zones containing the source or target node are excluded from obstacles (edges need to cross them to reach connected nodes).

### 4. Stub Enforcement (`enforceStubs`)
Inserts 30px orthogonal stubs at entry and exit points. Stubs at indices 1 and length-2 are protected from `cleanWaypoints` removal, guaranteeing visible 30px straight segments at each handle.

### 5. Segment Dragging
Mid-segments can be dragged perpendicular to their direction. Adjustments are stored in `edge.data.segmentAdjustments` and reapplied on each render. Uses delta-based coordinates with combined RF + CSS zoom for accuracy. Segments adjacent to stubs (same-direction neighbors) are excluded from draggable segments to prevent diagonal artifacts.

### 6. Segment Collapse
When dragging a segment to align with an adjacent parallel segment, the perpendicular connector between them shrinks to zero length (< 8px) and is automatically hidden. This makes redundant segments dissolve naturally. The user can pull segments apart again by dragging either sub-segment's handle.

## Edge Reconnection

### Interaction Flow
1. **Select edge** — blue dot handles appear at start and end points; node connector handles are hidden on the source/target nodes to avoid confusion
2. **Drag handle** — original edge fades to 20% opacity; a dashed preview line follows the cursor from the fixed endpoint
3. **Snap** — when cursor is within 80 screen pixels of a connector, the preview line snaps to that connector and it highlights
4. **Release on connector** — edge is reconnected to the new node/handle; `manualHandles: true` is set on the edge data so the stored handles are respected
5. **Release elsewhere** — drag is cancelled, original edge restores

### Same-Node Handle Change
When reconnecting, only the exact handle being dragged from is excluded from snap targets. All other handles on the same node (and all handles on every other node) are valid targets. This allows rewiring an edge from one side of a node to another (e.g., moving from the top handle to the left handle of the same node).

### Auto-Panning
During reconnect drag, when the cursor moves within 60px of the React Flow container edge, the viewport auto-pans at 12px per 30ms tick. Snap detection updates continuously during panning so targets remain accurate even as new nodes scroll into view.

### Technical Details

- **`screenToFlowPosition` with CSS zoom compensation**: `screenToFlowPosition({ x: clientX / cssZoom, y: clientY / cssZoom })` handles viewport transform + CSS zoom correctly
- **`handleBounds`** from `getInternalNode()` provides exact DOM handle positions for snap targets; these are in the same coordinate space as `screenToFlowPosition` output
- **`lastSnapRef`**: stores the last known snap handle so `pointerup` always uses the visual state the user sees, avoiding race conditions between the last `pointermove` and `pointerup`
- **`LABEL_OFFSET = 22`**: accounts for `.wf-node` margin-top when calculating handle positions in auto mode
- **`getAbsPos`**: uses `getInternalNode().internals.positionAbsolute` for absolute coordinates (handles nodes inside groups)
- **Node pointer events disabled**: when an edge is selected, `wf-canvas--edge-mode` class sets `pointer-events: none` on all nodes so reconnect handles in the SVG layer can be grabbed

## Swap Direction

Selected edges show a swap button (arrow icon) at the nearest bend/corner to the path center. Clicking it swaps `source`/`target` and `sourceHandle`/`targetHandle`, and clears `segmentAdjustments`.
