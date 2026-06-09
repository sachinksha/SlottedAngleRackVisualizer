<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-bold text-slate-800">Rack Configuration</h2>
      <button class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition" @click="store.resetToDefaults()" title="Reset all to defaults" aria-label="Reset configuration to defaults">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Reset
      </button>
    </div>

    <!-- Unit selector -->
    <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
      <span class="text-sm font-medium text-slate-700">Display units</span>
      <select v-model="store.unit" class="min-w-max px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 font-inherit focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" aria-label="Select display units">
        <option value="in">Inches (in)</option>
        <option value="ft">Feet (ft)</option>
        <option value="cm">Centimeters (cm)</option>
      </select>
    </div>

    <!-- Rotation -->
    <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
      <span class="text-sm font-medium text-slate-700">View rotation</span>
      <div class="flex items-center gap-2 min-w-0">
        <input type="range" min="0" max="360" :step="15" :value="store.rotationDeg" @input="e => store.setRotationDeg(+((e.target as HTMLInputElement).value))" class="flex-1 min-w-0" aria-label="Rotate view" />
        <input type="number" :value="store.rotationDeg" min="0" max="360" :step="15" @change="e => store.setRotationDeg(+((e.target as HTMLInputElement).value))" class="w-14 px-2 py-1 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 flex-shrink-0" />
        <span class="text-xs text-slate-500">deg</span>
      </div>
    </div>

    <!-- Dimensions -->
    <section class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rack Dimensions</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-slate-600 uppercase tracking-tight">Height</label>
          <div class="flex items-center gap-2">
            <input type="number" :value="store.dimensions.heightIn" min="24" max="144" step="1" @change="e => store.setDimensions({ heightIn: +((e.target as HTMLInputElement).value) })" class="w-20 px-2 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
            <span class="text-xs text-slate-500">in</span>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-slate-600 uppercase tracking-tight">Width</label>
          <div class="flex items-center gap-2">
            <input type="number" :value="store.dimensions.widthIn" min="12" max="96" step="1" @change="e => store.setDimensions({ widthIn: +((e.target as HTMLInputElement).value) })" class="w-20 px-2 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
            <span class="text-xs text-slate-500">in</span>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-slate-600 uppercase tracking-tight">Depth</label>
          <div class="flex items-center gap-2">
            <input type="number" :value="store.dimensions.depthIn" min="12" max="60" step="1" @change="e => store.setDimensions({ depthIn: +((e.target as HTMLInputElement).value) })" class="w-20 px-2 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
            <span class="text-xs text-slate-500">in</span>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-slate-600 uppercase tracking-tight">Converted ({{ store.unit }})</label>
          <div class="text-sm font-semibold text-slate-800 py-2">
            {{ fmt(store.dimensions.widthIn, store.unit) }} × {{ fmt(store.dimensions.depthIn, store.unit) }} × {{ fmt(store.dimensions.heightIn, store.unit) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Shelf count -->
    <section class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shelves</h3>
      <div class="bg-white border border-slate-200 rounded-lg p-3">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-slate-600 uppercase tracking-tight">Number of shelves</label>
            <div class="flex items-center gap-2">
              <input type="number" :value="store.plateCount" min="1" max="20" step="1" @change="e => store.setPlateCount(Math.max(1, Math.round(+((e.target as HTMLInputElement).value))))" class="w-20 px-2 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
              <span class="text-xs text-slate-500">shelves</span>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <input type="range" min="1" max="12" :value="store.plateCount" @input="e => store.setPlateCount(+((e.target as HTMLInputElement).value))" class="w-full accent-blue-600" aria-label="Adjust shelf count" />
            <div class="flex justify-between text-xs text-slate-400">
              <span>1</span>
              <span>12</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Shelf positions -->
    <section v-if="store.sortedPlates.length" class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Shelf Positions
        <span class="text-xs font-normal text-slate-400">(drag on canvas or edit)</span>
      </h3>
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div v-for="(pl, idx) in store.sortedPlates" :key="pl.id" class="flex items-start gap-3 px-3 py-2 border-b border-slate-100 last:border-b-0">
          <div class="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{{ idx + 1 }}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <input type="number" :value="pl.positionIn" :min="store.floorGapIn" :max="store.dimensions.heightIn - store.plateThicknessIn" :step="store.stepSizeIn" @change="e => store.setPlatePosition(pl.id, +((e.target as HTMLInputElement).value))" class="w-16 px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition" />
              <span class="text-xs text-slate-500">{{ store.unit === 'in' ? 'in' : store.unit }} from floor</span>
              <span v-if="pl.isManual" class="inline-block px-2 py-0.5 text-xs font-semibold text-orange-700 bg-orange-50 rounded">manual</span>
            </div>
            <div v-if="idx > 0" class="text-xs text-slate-400 mt-1">
              gap above prev: {{ fmt(pl.positionIn - (store.sortedPlates[idx-1].positionIn + store.plateThicknessIn), store.unit) }}
            </div>
          </div>
          <div class="flex-shrink-0 text-right">
            <div class="text-sm font-semibold text-slate-800">{{ fmt(pl.positionIn, store.unit) }}</div>
            <div class="text-xs text-slate-400">from floor</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Summary -->
    <section class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dimension Summary</h3>
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-600">Total height</span>
          <strong class="text-sm text-slate-800">{{ fmt(store.dimensions.heightIn, store.unit) }}</strong>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-600">Width</span>
          <strong class="text-sm text-slate-800">{{ fmt(store.dimensions.widthIn, store.unit) }}</strong>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-600">Depth</span>
          <strong class="text-sm text-slate-800">{{ fmt(store.dimensions.depthIn, store.unit) }}</strong>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-slate-200">
          <span class="text-xs font-medium text-blue-700">Floor clearance</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="store.floorGapIn"
              :min="0"
              :max="store.dimensions.heightIn - store.plateThicknessIn"
              :step="store.stepSizeIn"
              @change="e => store.setFloorGapIn(+((e.target as HTMLInputElement).value))"
              class="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg bg-white text-blue-700 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <span class="text-sm text-blue-700">{{ fmt(store.floorGapIn, store.unit) }}</span>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-600">Shelf thickness</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="store.plateThicknessIn"
              :min="0.1"
              step="0.1"
              @change="e => store.setPlateThicknessIn(+((e.target as HTMLInputElement).value))"
              class="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <strong class="text-sm text-slate-800">{{ fmt(store.plateThicknessIn, store.unit) }}</strong>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-600">Step size (slot increment)</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="store.stepSizeIn"
              :min="0.1"
              step="0.1"
              @change="e => store.setStepSizeIn(+((e.target as HTMLInputElement).value))"
              class="w-20 px-2 py-1 text-sm border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
            <strong class="text-sm text-slate-800">{{ fmt(store.stepSizeIn, store.unit) }}</strong>
          </div>
        </div>
        <template v-for="(pl, idx) in store.sortedPlates" :key="pl.id">
          <div v-if="idx < store.sortedPlates.length - 1" class="flex justify-between items-center">
            <span class="text-xs text-slate-600">Gap: shelf {{ idx+1 }}→{{ idx+2 }}</span>
            <strong class="text-sm text-slate-800">{{ fmt(store.sortedPlates[idx+1].positionIn - (pl.positionIn + store.plateThicknessIn), store.unit) }}</strong>
          </div>
        </template>
      </div>
    </section>

    <!-- Export -->
    <section class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button class="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition active:scale-95" @click="$emit('exportJson')" title="Download JSON config" aria-label="Export configuration as JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          <span class="text-xs font-medium text-slate-700">JSON</span>
        </button>
        <input ref="fileInput" type="file" accept="application/json" @change="handleImportFile" class="hidden" />
        <button class="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition active:scale-95" @click="openFileChooser" title="Import JSON config" aria-label="Import configuration from JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" x2="12" y1="5" y2="15"/></svg>
          <span class="text-xs font-medium text-slate-700">Import</span>
        </button>
        <button class="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition active:scale-95" @click="$emit('exportPng')" title="Download PNG image" aria-label="Export visualization as PNG image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span class="text-xs font-medium text-slate-700">PNG</span>
        </button>
        <button class="flex flex-col items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition active:scale-95" @click="$emit('exportPdf')" title="Open in print preview" aria-label="Export visualization to PDF (via print dialog)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
          <span class="text-xs font-medium text-slate-700">PDF</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRackStore, fmt } from '../stores/rack'
import { ref } from 'vue'

defineEmits<{
  (e: 'exportJson'): void
  (e: 'exportPng'): void
  (e: 'exportPdf'): void
}>()

const store = useRackStore()
const fileInput = ref<HTMLInputElement | null>(null)

function handleImportFile(e: Event) {
  const el = e.target as HTMLInputElement
  const f = el.files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result))
      store.importFromJson(obj)
      // eslint-disable-next-line no-alert
      alert('Import successful')
    } catch (err: any) {
      // minimal user feedback
      // eslint-disable-next-line no-alert
      alert('Import failed: ' + (err?.message ?? String(err)))
    }
  }
  reader.readAsText(f)
  // reset so same file can be re-selected later
  el.value = ''
}
function openFileChooser() {
  fileInput.value?.click()
}
</script>
