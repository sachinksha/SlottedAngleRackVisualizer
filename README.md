# Slotted Angle Rack Visualizer

A **Vue 3 + TypeScript** interactive isometric 2D visualizer for **Slotted Angle Racks** — designed for sales, marketing, and rack configuration workflows.

## Features

- **Isometric 2D illustration** of the rack with 4 slotted angle pillars
- **Live dimension annotations** — total height, floor clearance, inter-shelf gaps, width & depth
- **Draggable shelves** — click and drag any shelf on the canvas to reposition it (1" snap)
- **Panel inputs** — also edit shelf positions via the side panel inputs
- **Auto-spacing** — shelves auto-distribute evenly when count changes; manual overrides are preserved
- **Inches / feet / cm toggle** — switch all labels with a single toggle
- **Export** — download as JSON config, PNG screenshot, or print/PDF
- **Reset** — one-click restore to default dimensions

## Defaults

| Property | Value |
|---|---|
| Height | 72" (6') |
| Width | 36" (3') |
| Depth | 18" (1.5') |
| Shelves | 3 |
| Floor gap | 4" |
| Shelf thickness | 1" |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  App.vue                  # Root component, export handlers
  main.ts                  # App entry point
  style.css                # Global styles
  stores/
    rack.ts                # Pinia store — dimensions, plate positions, unit toggle
  components/
    IsometricRack.vue      # Canvas renderer (isometric projection, drag logic)
    ControlPanel.vue       # Side panel — inputs, shelf list, export buttons
```

## How Shelf Placement Works

1. **Shelf 1 (bottom):** always at the `floorGap` (4") from ground
2. **Shelf N (top):** flush with rack top minus shelf thickness
3. **Middle shelves:** equal spacing between shelf 1 and shelf N
4. **Manual override:** dragging or editing a shelf marks it as `isManual: true`; it won't be moved by auto-spacing
5. **Reset:** clears all manual flags, restores equal spacing

## Stack

- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- Vite (build tool)
- HTML5 Canvas (isometric rendering)

## License

MIT
