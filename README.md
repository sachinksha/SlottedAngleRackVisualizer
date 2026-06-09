# Slotted Angle Rack Visualizer

A **Vue 3 + TypeScript** interactive isometric 2D visualizer for **Slotted Angle Racks** — designed as a **learning project for Vue.js developers** and practical tool for sales/engineering workflows.

**🎓 This project is structured to teach Vue.js concepts from beginner to intermediate level.** Each section below highlights key Vue patterns used.

## Features

- **Isometric 2D illustration** of the rack with 4 slotted angle pillars
- **Live dimension annotations** — total height, floor clearance, inter-shelf gaps, width & depth
- **Draggable shelves** — click and drag any shelf on the canvas to reposition it (1" snap); full touch support on mobile
- **Panel inputs** — also edit shelf positions via the side panel inputs
- **Auto-spacing** — shelves auto-distribute evenly when count changes; manual overrides are preserved
- **Inches / feet / cm toggle** — switch all labels with a single toggle
- **Export** — download as JSON config, PNG screenshot, or print/PDF
- **Reset** — one-click restore to default dimensions
- **Responsive Design** — mobile-first, works on phone, tablet, and desktop with Tailwind CSS

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

## Import / Export

The app can export your current configuration as JSON (Export → JSON). You can re-import that JSON later to resume work via the `Import` button in the Export panel.

- The importer validates keys like `dimensions`, `plateCount`, `plates`, `plateThicknessIn`, `floorGapIn`, `stepSizeIn`, and `rotationDeg`.
- Manual plate positions in the imported file are preserved but will be clamped and snapped to valid slots according to the current `stepSizeIn`.

## Slot Step Size and Shelf Thickness

- `Step size` controls the increments (in inches) used when placing shelves — both in the UI number inputs and when dragging on the canvas. Default `1"`, minimum `0.1"`.
- If `shelf thickness` is smaller than `step size`, the app treats the thickness as part of the effective step for placement and snapping.

## View Rotation

- The control panel provides a `View rotation` slider (15° increments). Rotation rotates the rack around the vertical axis before projection. If rotation would cause clipping, the canvas layout increases padding heuristically.

## High-DPI / Mobile Rendering

- The canvas now respects `window.devicePixelRatio` and renders at a higher internal resolution for crisp visuals on mobile and high-DPI displays.


**Mobile-first Responsive Design:** The layout automatically adapts from vertical stacking on mobile (<768px) to side-by-side on desktop. Open DevTools and test with phone emulator to see responsive breakpoints in action.

---

## 📚 Vue.js Learning Guide

### **Beginner Level: Vue 3 Fundamentals**

#### What is Vue?
Vue is a **JavaScript framework** for building interactive user interfaces. This project demonstrates the core concepts:

#### 1. **Components** (`src/App.vue`, `src/components/`)
Vue apps are built from **reusable components**. Each `.vue` file is a single-file component (SFC):

```vue
<template><!-- UI markup --></template>
<script setup lang="ts"><!-- Logic --></script>
<style scoped><!-- Styles (scoped to this component) --></style>
```

- **[App.vue](src/App.vue)** — Root component, orchestrates layout and exports
- **[IsometricRack.vue](src/components/IsometricRack.vue)** — Canvas renderer
- **[ControlPanel.vue](src/components/ControlPanel.vue)** — Configuration UI

#### 2. **Reactive State** (`src/stores/rack.ts`)
Vue uses **reactivity** to auto-update the UI when data changes. This project uses **Pinia**, Vue's state management library:

```typescript
// store: computed properties auto-update when dependencies change
const sortedPlates = computed(() => plates.value.sort(...))

// any component using sortedPlates sees updates automatically
```

**Why Pinia?** Centralizes state (dimensions, shelves, unit) so multiple components can react to changes without passing props through 10 levels of components.

#### 3. **Reactive Canvas Sizing** (`IsometricRack.vue`)
Modern Vue uses **`computed` properties** for derived data:

```typescript
// Responsive canvas width
const canvasWidth = computed(() => {
  const width = Math.min(MAX_CANVAS_W, containerWidth.value)
  return width > 0 ? width : BASE_CANVAS_W
})

// Whenever containerWidth changes, canvasWidth auto-recalculates
```

The canvas redraw is **watched** for changes:
```typescript
watch([canvasWidth, canvasHeight, store.dimensions], () => draw())
// Redraw whenever these dependencies change
```

#### 4. **Event Handling**
Vue binds DOM events with `@event` syntax:

```vue
<input @change="e => store.setDimensions({ widthIn: +e.target.value })" />
<button @click="handleExportJson">Export JSON</button>
<canvas @mousemove="handleMouseMove" @touchstart="handleTouchStart" />
```

#### 5. **v-if, v-for, v-model**
Vue's template directives:

```vue
<!-- Conditional rendering -->
<section v-if="store.sortedPlates.length">Shelf Positions</section>

<!-- List rendering -->
<div v-for="(pl, idx) in store.sortedPlates" :key="pl.id">
  Shelf {{ idx + 1 }}: {{ pl.positionIn }}"
</div>

<!-- Two-way binding (unit selector) -->
<select v-model="store.unit">
  <option value="in">Inches</option>
</select>
```

#### 6. **TypeScript in Vue**
This project uses TypeScript for **type safety**:

```typescript
interface DragState {
  plateId: string
  startY: number
  startPosIn: number
}

const dragState = ref<DragState | null>(null) // Type-safe ref
```

---

### **Intermediate Level: Patterns & Advanced Concepts**

#### 1. **Pinia Store Architecture** (`src/stores/rack.ts`)
State management decouples data from components:

```typescript
// Define state
const dimensions = ref({ heightIn: 72, widthIn: 36, depthIn: 18 })
const plates = ref<Plate[]>([...])

// Define mutations
function setDimensions(partial: Partial<Dimensions>) {
  dimensions.value = { ...dimensions.value, ...partial }
}

// Define computed properties
const sortedPlates = computed(() => plates.value.sort(...))

// Data flows: Component → Action → State → Computed → UI
```

**Benefits:**
- Single source of truth
- Decoupled from component hierarchy
- Easy to test
- Time-travel debugging

#### 2. **Composition API with `<script setup>`**
Modern Vue uses the Composition API:

```typescript
// Old: options API (data, methods, computed as separate objects)
// New: Composition API (all logic in one place, functions)

const store = useRackStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)

// Computed properties
const canvasWidth = computed(() => {...})

// Lifecycle hooks
onMounted(() => { setupResizeObserver() })
onUnmounted(() => { cleanupResizeObserver() })

// Watchers for reactive updates
watch([dependency1, dependency2], () => { /* react */ })
```

#### 3. **Responsive Design in Vue** (`App.vue`)
Vue + Tailwind CSS = powerful responsive components:

```vue
<!-- Tailwind's responsive classes: flex-col (mobile) → lg:flex-row (desktop) -->
<main class="flex flex-col lg:flex-row">
  <div class="flex-1">Canvas</div>
  <aside class="w-full lg:w-72">Sidebar</aside>
</main>
```

Vue automatically rerenders when screen size changes (no JavaScript needed).

#### 4. **Touch Event Handling & Device Pixel Ratio**
Full touch support with coordinate conversion:

```typescript
function getCanvasPos(e: MouseEvent | Touch): [number, number] {
  const rect = canvas.getBoundingClientRect()
  // Account for CSS scaling vs. internal resolution
  return [
    (e.clientX - rect.left) * (canvas.width / rect.width),
    (e.clientY - rect.top) * (canvas.height / rect.height)
  ]
}

// Works on mouse AND touch (uses same hit-testing logic)
```

#### 5. **ResizeObserver for Responsive Canvas**
Detects container size changes without polling:

```typescript
const resizeObserver = new ResizeObserver(() => {
  containerWidth.value = parent.clientWidth
})
resizeObserver.observe(parent)
```

When container resizes, `containerWidth` updates → `canvasWidth` computed updates → canvas redraw triggered by watcher.

#### 6. **Hit Testing & Geometry**
Canvas rendering math with isometric projection:

```typescript
// Isometric transformation: (x, y, z) → screen (px, py)
function toCanvas(x: number, y: number, z: number, SC: number, OX: number, OY: number) {
  const px = (x - y) * COS * SC
  const py = -(x + y) * SIN * SC + z * SC
  return [OX + px, OY - py]
}

// Point-in-polygon hit detection
function pointInPoly(px: number, py: number, poly: [number, number][]): boolean {
  // Ray casting algorithm
}

// Allows dragging plates on canvas
```

#### 7. **Unit Conversion Pattern**
Reusable `fmt()` helper for unit display:

```typescript
// Converts inches to ft/cm
export const fmt = (inches: number, unit: 'in' | 'ft' | 'cm'): string => {
  switch (unit) {
    case 'in': return Math.round(inches * 100) / 100 + '"'
    case 'ft': return Math.round(inches / 12 * 100) / 100 + "'"
    case 'cm': return Math.round(inches * 2.54 * 10) / 10 + ' cm'
  }
}
```

Used in 20+ places. Update once → updates everywhere.

---

### **Architecture Overview**

```
User Interaction
      ↓
  Components
   ├─ App.vue (layout, export handlers)
   ├─ IsometricRack.vue (canvas, drag, touch)
   └─ ControlPanel.vue (inputs, shelf list)
      ↓
  Pinia Store (rack.ts)
   ├─ dimensions (reactive state)
   ├─ plates (shelf positions)
   └─ unit (inches/ft/cm)
      ↓
  Computed Properties
   ├─ sortedPlates (auto-sort)
   └─ canvasWidth (responsive)
      ↓
  Reactive Updates
   └─ All components auto-rerender
```

**Data Flow:**
1. User drags plate on canvas or edits input
2. Event handler calls `store.setPlatePosition(id, position)`
3. Store state updates → reactivity triggers
4. Computed properties recalculate
5. Components watching these values trigger rerender
6. Canvas draw() function called
7. UI updates on screen

---

### **Key Vue Patterns Used**

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Single-File Components (SFC)** | `.vue` files | Template + Script + Styles in one file |
| **Composition API** | `<script setup>` | Modern, function-based logic |
| **Reactive State** | `ref()`, `computed()` | Auto-update UI |
| **Store Pattern** | `src/stores/rack.ts` | Centralized state management |
| **Watchers** | `watch()` | React to data changes |
| **Lifecycle Hooks** | `onMounted()`, `onUnmounted()` | Setup/cleanup |
| **Computed Properties** | `computed()` | Derived, auto-memoized data |
| **Event Binding** | `@click`, `@mousemove` | DOM events |
| **v-for, v-if** | Templates | Loops, conditionals |
| **v-model** | `<select>`, `<input>` | Two-way binding |
| **Responsive Design** | Tailwind classes | CSS breakpoints |

---

## Project Structure

```
src/
  App.vue                  # Root layout, export logic
  main.ts                  # Pinia + Vue initialization
  style.css                # Global Tailwind + custom utilities
  stores/
    rack.ts                # Pinia store — state, computed, mutations
  components/
    IsometricRack.vue      # Canvas, drag, touch, responsive sizing
    ControlPanel.vue       # Inputs, shelf list, export UI

index.html                 # Entry HTML
package.json              # Dependencies (Vue, Pinia, Tailwind, Vite)
tailwind.config.ts        # Tailwind design tokens (colors, spacing)
postcss.config.js         # PostCSS + Tailwind pipeline
```

---

## How Shelf Placement Works

**Understanding the Auto-Distribution Algorithm:**

1. **Shelf 1 (bottom):** always at the `floorGap` (4") from ground
2. **Shelf N (top):** flush with rack top minus shelf thickness
3. **Middle shelves:** equal spacing between shelf 1 and shelf N
   ```
   spacing = (topHeight - bottomHeight - plateThickness) / (plateCount - 1)
   ```
4. **Manual override:** dragging/editing a shelf marks `isManual: true`; won't be auto-repositioned
5. **Reset:** clears all manual flags, restores equal spacing

**Example (72" height, 3 shelves, 4" floor gap, 1" thick shelf):**
```
Top (72"):     ← Shelf 3 (topHeight)
               | 23"
Middle (49"):  ← Shelf 2 (middle position)
               | 23"
Bottom (26"):  ← Shelf 1 (4" floor gap)
Ground (0"):   ___________
```

---

## Stack

- **Vue 3.5** (Composition API, `<script setup>`)
- **TypeScript** (strict mode)
- **Pinia 2.2** (state management)
- **Vite 6** (build tool, HMR dev server)
- **Tailwind CSS 4** (utility-first styling, mobile-first responsive)
- **HTML5 Canvas 2D** (isometric rendering)

---

## Responsive Design & Mobile-First Approach

This project follows **mobile-first principles**:

- **Default layout:** Vertical stacking (mobile, <768px)
- **Large screens (lg):** Side-by-side layout (desktop, ≥1024px)
- **Touch support:** Full drag-and-drop on mobile/tablet
- **Responsive canvas:** Scales with viewport while maintaining 720:680 aspect ratio
- **Tailwind utilities:** `flex-col lg:flex-row`, `w-full lg:w-72`, `grid-cols-1 md:grid-cols-3`

Test with DevTools → Toggle Device Toolbar → Try different screen sizes.

---

## Useful Resources

### Vue.js
- [Vue 3 Official Docs](https://vuejs.org/) — Authoritative guide, interactive playground
- [Composition API Guide](https://vuejs.org/guide/extras/composition-api-faq.html) — Deep dive into Composition vs. Options API
- [Vue Mastery](https://www.vuemastery.com/) — Video courses (beginner to advanced)

### Pinia
- [Pinia Docs](https://pinia.vuejs.org/) — State management best practices
- Example: [Counter Store](https://pinia.vuejs.org/cookbook/composables.html#using-stores-with-composables)

### Responsive Design
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Utility-first CSS, responsive breakpoints
- [Mobile-First Web Design](https://www.mobileapproximation.com/) — Principles and patterns
- [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — Detect element size changes

### Canvas & Geometry
- [MDN Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Drawing, transformations
- [Isometric Projection Math](https://en.wikipedia.org/wiki/Isometric_projection) — 3D to 2D mapping
- [Point-in-Polygon Algorithm](https://en.wikipedia.org/wiki/Point_in_polygon) — Hit testing

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) — Type system basics
- [Vue + TypeScript](https://vuejs.org/guide/typescript/overview.html) — Type-safe Vue development

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — Web accessibility standard
- [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) — Semantic HTML + ARIA labels

---

## License

GPL 3
