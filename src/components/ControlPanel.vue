<template>
  <div class="panel">
    <!-- Header -->
    <div class="panel-header">
      <h2>Rack Configuration</h2>
      <button class="btn-reset" @click="store.resetToDefaults()" title="Reset all to defaults">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Reset
      </button>
    </div>

    <!-- Unit selector -->
    <div class="section toggle-section">
      <span class="toggle-label">Display units</span>
      <div class="toggle-row">
        <select v-model="store.unit" class="unit-select" aria-label="Display units">
          <option value="in">in</option>
          <option value="ft">ft</option>
          <option value="cm">cm</option>
        </select>
      </div>
    </div>

    <!-- Dimensions -->
    <section class="section">
      <h3 class="section-title">Rack Dimensions</h3>
      <div class="dims-grid">
        <div class="input-group">
          <label>Height</label>
          <div class="input-row">
            <input type="number" :value="store.dimensions.heightIn" min="24" max="144" step="1"
              @change="e => store.setDimensions({ heightIn: +((e.target as HTMLInputElement).value) })" />
            <span class="unit">in</span>
          </div>
        </div>
        <div class="input-group">
          <label>Width</label>
          <div class="input-row">
            <input type="number" :value="store.dimensions.widthIn" min="12" max="96" step="1"
              @change="e => store.setDimensions({ widthIn: +((e.target as HTMLInputElement).value) })" />
            <span class="unit">in</span>
          </div>
        </div>
        <div class="input-group">
          <label>Depth</label>
          <div class="input-row">
            <input type="number" :value="store.dimensions.depthIn" min="12" max="60" step="1"
              @change="e => store.setDimensions({ depthIn: +((e.target as HTMLInputElement).value) })" />
            <span class="unit">in</span>
          </div>
        </div>
        <div class="input-group">
          <label>Converted ({{ store.unit }})</label>
          <div class="converted">
            {{ fmt(store.dimensions.widthIn, store.unit) }} × {{ fmt(store.dimensions.depthIn, store.unit) }} × {{ fmt(store.dimensions.heightIn, store.unit) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Shelf count -->
    <section class="section">
      <h3 class="section-title">Shelves</h3>
      <div class="card">
        <div class="shelf-count-row">
          <div class="input-group">
            <label>Number of shelves</label>
            <div class="input-row">
              <input type="number" :value="store.plateCount" min="1" max="20" step="1"
                @change="e => store.setPlateCount(Math.max(1, Math.round(+((e.target as HTMLInputElement).value))))" />
              <span class="unit">shelves</span>
            </div>
          </div>
          <div class="slider-wrap">
            <input type="range" min="1" max="12" :value="store.plateCount"
              @input="e => store.setPlateCount(+((e.target as HTMLInputElement).value))" />
            <div class="slider-labels"><span>1</span><span>12</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Shelf positions -->
    <section v-if="store.sortedPlates.length" class="section">
      <h3 class="section-title">
        Shelf Positions
        <span class="hint">drag on canvas or edit</span>
      </h3>
      <div class="shelf-list">
        <div v-for="(pl, idx) in store.sortedPlates" :key="pl.id" class="shelf-item">
          <div class="shelf-num">{{ idx + 1 }}</div>
          <div class="shelf-details">
            <div class="shelf-input-row">
              <input type="number" :value="pl.positionIn"
                :min="store.floorGapIn"
                :max="store.dimensions.heightIn - store.plateThicknessIn"
                step="1"
                @change="e => store.setPlatePosition(pl.id, +((e.target as HTMLInputElement).value))"
              />
              <span class="unit">{{ store.unit === 'in' ? 'in' : store.unit }} from floor</span>
              <span v-if="pl.isManual" class="manual-tag">manual</span>
            </div>
            <div v-if="idx > 0" class="gap-hint">
              gap above prev: {{ fmt(pl.positionIn - (store.sortedPlates[idx-1].positionIn + store.plateThicknessIn), store.unit) }}
            </div>
          </div>
          <div class="shelf-pos">
            <div>{{ fmt(pl.positionIn, store.unit) }}</div>
            <div class="from-floor">from floor</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Summary -->
    <section class="section">
      <h3 class="section-title">Dimension Summary</h3>
      <div class="summary">
        <div class="summary-row"><span>Total height</span><strong>{{ fmt(store.dimensions.heightIn, store.unit) }}</strong></div>
        <div class="summary-row"><span>Width</span><strong>{{ fmt(store.dimensions.widthIn, store.unit) }}</strong></div>
        <div class="summary-row"><span>Depth</span><strong>{{ fmt(store.dimensions.depthIn, store.unit) }}</strong></div>
        <div class="summary-row highlight">
          <span>Floor clearance</span>
          <strong>{{ fmt(store.sortedPlates[0]?.positionIn ?? store.floorGapIn, store.unit) }}</strong>
        </div>
        <div class="summary-row"><span>Shelf thickness</span><strong>{{ fmt(store.plateThicknessIn, store.unit) }}</strong></div>
        <template v-for="(pl, idx) in store.sortedPlates" :key="pl.id">
          <div v-if="idx < store.sortedPlates.length - 1" class="summary-row">
            <span>Gap: shelf {{ idx+1 }}→{{ idx+2 }}</span>
            <strong>{{ fmt(store.sortedPlates[idx+1].positionIn - (pl.positionIn + store.plateThicknessIn), store.unit) }}</strong>
          </div>
        </template>
      </div>
    </section>

    <!-- Export -->
    <section class="section">
      <h3 class="section-title">Export</h3>
      <div class="export-grid">
        <button class="export-btn" @click="$emit('exportJson')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          <span>JSON</span>
        </button>
        <button class="export-btn" @click="$emit('exportPng')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span>PNG</span>
        </button>
        <button class="export-btn" @click="$emit('exportPdf')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          <span>PDF</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRackStore, fmt } from '../stores/rack'

defineEmits<{
  (e: 'exportJson'): void
  (e: 'exportPng'): void
  (e: 'exportPdf'): void
}>()

const store = useRackStore()
</script>

<style scoped>
.panel { display:flex; flex-direction:column; gap:16px; }
.unit-select {
  min-width:120px;
  padding:8px 10px;
  border:1px solid #cbd5e1;
  border-radius:8px;
  background:#fff;
  color:#1e293b;
  font:inherit;
}
.unit-select:focus {
  outline:none;
  border-color:#3b82f6;
  box-shadow:0 0 0 2px rgba(59,130,246,0.15);
}

.panel-header { display:flex; align-items:center; justify-content:space-between; }
.panel-header h2 { font-size:15px; font-weight:700; color:#1e293b; }

.btn-reset {
  display:flex; align-items:center; gap:4px; padding:4px 8px;
  font-size:12px; font-weight:500; color:#475569; background:#f1f5f9;
  border:1px solid #e2e8f0; border-radius:6px; cursor:pointer; font-family:inherit;
}
.btn-reset:hover { background:#e2e8f0; }

.section { display:flex; flex-direction:column; gap:8px; }
.section-title { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
.section-title .hint { font-size:10px; font-weight:400; color:#94a3b8; text-transform:none; letter-spacing:0; margin-left:6px; }

.card { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px; }

.toggle-section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; flex-direction:row; align-items:center; justify-content:space-between; }
.toggle-label { font-size:14px; font-weight:500; color:#374151; }
.toggle-row { display:flex; align-items:center; gap:8px; }
.unit-label { font-size:13px; font-weight:500; color:#94a3b8; }
.unit-label.active { color:#2563eb; }

.toggle-switch {
  position:relative; width:36px; height:20px; border-radius:999px;
  background:#cbd5e1; border:none; cursor:pointer; transition:background 0.2s; padding:0;
}
.toggle-switch.on { background:#2563eb; }
.toggle-thumb {
  position:absolute; top:2px; left:2px; width:16px; height:16px;
  border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.2);
  transition:transform 0.2s;
}
.toggle-switch.on .toggle-thumb { transform:translateX(16px); }

.dims-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px; }
.input-group { display:flex; flex-direction:column; gap:3px; }
.input-group label { font-size:11px; font-weight:500; color:#64748b; text-transform:uppercase; letter-spacing:0.04em; }
.input-row { display:flex; align-items:center; gap:4px; }
.input-row input { width:60px; padding:4px 6px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; background:#fff; color:#1e293b; font-family:inherit; }
.input-row input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,0.15); }
.unit { font-size:11px; color:#94a3b8; }
.converted { font-size:13px; font-weight:600; color:#374151; padding-top:4px; }

.shelf-count-row { display:flex; flex-direction:column; gap:8px; }
.slider-wrap { display:flex; flex-direction:column; gap:2px; }
.slider-wrap input[type="range"] { width:100%; accent-color:#2563eb; }
.slider-labels { display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; }

.shelf-list { background:#fff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; }
.shelf-item { display:flex; align-items:center; gap:10px; padding:8px 12px; border-bottom:1px solid #f1f5f9; }
.shelf-item:last-child { border-bottom:none; }
.shelf-num { width:24px; height:24px; border-radius:50%; background:#dcfce7; color:#166534; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.shelf-details { flex:1; display:flex; flex-direction:column; gap:2px; }
.shelf-input-row { display:flex; align-items:center; gap:4px; }
.shelf-input-row input { width:56px; padding:2px 6px; font-size:13px; border:1px solid #cbd5e1; border-radius:6px; background:#fff; color:#1e293b; font-family:inherit; }
.shelf-input-row input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,0.15); }
.manual-tag { font-size:11px; color:#c2410c; font-weight:500; }
.gap-hint { font-size:11px; color:#94a3b8; }
.shelf-pos { text-align:right; font-size:12px; color:#475569; font-weight:500; line-height:1.3; }
.from-floor { font-size:10px; color:#94a3b8; }

.summary { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:6px; }
.summary-row { display:flex; justify-content:space-between; align-items:center; }
.summary-row span { font-size:11px; color:#64748b; }
.summary-row strong { font-size:13px; font-weight:600; color:#374151; }
.summary-row.highlight span { color:#1d4ed8; font-weight:600; }
.summary-row.highlight strong { color:#1d4ed8; }

.export-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.export-btn {
  display:flex; flex-direction:column; align-items:center; gap:4px;
  padding:10px 8px; background:#fff; border:1px solid #e2e8f0; border-radius:10px;
  cursor:pointer; font-size:12px; font-weight:500; color:#374151; font-family:inherit;
  transition:all 0.15s;
}
.export-btn:hover { border-color:#93c5fd; background:#eff6ff; }
</style>
