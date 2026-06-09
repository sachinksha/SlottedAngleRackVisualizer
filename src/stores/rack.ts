import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface RackDimensions {
  heightIn: number
  widthIn: number
  depthIn: number
}

export interface Plate {
  id: string
  positionIn: number
  isManual: boolean
}

export type UnitType = 'in' | 'ft' | 'cm'

const DEFAULTS = {
  dimensions: { heightIn: 72, widthIn: 36, depthIn: 18 },
  plateCount: 3,
  pillarThicknessIn: 2,
  plateThicknessIn: 1,
  floorGapIn: 4,
  unit: 'in' as UnitType,
  stepSizeIn: 1,
  rotationDeg: 0,
}

function computePlates(
  count: number,
  heightIn: number,
  floorGapIn: number,
  plateThicknessIn: number,
  stepSizeIn: number,
  existing: Plate[]
): Plate[] {
  if (count <= 0) return []
  if (count === 1) {
    const ex = existing.find(p => p.id === 'p0')
    if (ex?.isManual) {
      const clamped = Math.max(floorGapIn, Math.min(ex.positionIn, heightIn - plateThicknessIn))
      const n = Math.round((clamped - floorGapIn) / stepSizeIn)
      const snapped = Math.max(floorGapIn, Math.min(floorGapIn + n * stepSizeIn, heightIn - plateThicknessIn))
      return [{ ...ex, positionIn: Number(snapped.toFixed(3)) }]
    }
    return [{ id: 'p0', positionIn: Number(floorGapIn.toFixed(3)), isManual: false }]
  }
  const bottomPos = floorGapIn
  const topPos = heightIn - plateThicknessIn
  const plates: Plate[] = []
  const step = Math.max(stepSizeIn, plateThicknessIn)
  for (let i = 0; i < count; i++) {
    const ex = existing.find(p => p.id === `p${i}`)
    if (ex?.isManual) {
      const clamped = Math.max(bottomPos, Math.min(ex.positionIn, topPos))
      const n = Math.round((clamped - bottomPos) / step)
      const snapped = Math.max(bottomPos, Math.min(bottomPos + n * step, topPos))
      plates.push({ ...ex, positionIn: Number(snapped.toFixed(3)) })
      continue
    }
    let pos: number
    if (i === 0) pos = bottomPos
    else if (i === count - 1) pos = topPos
    else {
      const span = topPos - bottomPos
      pos = bottomPos + (span / (count - 1)) * i
    }
    // snap generated position to nearest slot based on stepSizeIn
    const n = Math.round((pos - bottomPos) / step)
    const snapped = Math.max(bottomPos, Math.min(bottomPos + n * step, topPos))
    plates.push({ id: `p${i}`, positionIn: Number(snapped.toFixed(3)), isManual: false })
  }
  return plates
}

export const useRackStore = defineStore('rack', () => {
  const dimensions = ref<RackDimensions>({ ...DEFAULTS.dimensions })
  const plateCount = ref(DEFAULTS.plateCount)
  const plates = ref<Plate[]>(
    computePlates(DEFAULTS.plateCount, DEFAULTS.dimensions.heightIn, DEFAULTS.floorGapIn, DEFAULTS.plateThicknessIn, DEFAULTS.stepSizeIn, [])
  )
  const unit = ref<UnitType>(DEFAULTS.unit)
  const pillarThicknessIn = ref(DEFAULTS.pillarThicknessIn)
  const plateThicknessIn = ref(DEFAULTS.plateThicknessIn)
  const floorGapIn = ref(DEFAULTS.floorGapIn)
  const stepSizeIn = ref(DEFAULTS.stepSizeIn)
  const rotationDeg = ref(DEFAULTS.rotationDeg)

  function setRotationDeg(value: number) {
    // snap to 15° increments to provide a few set increments
    const snapped = Math.round(value / 15) * 15
    const norm = ((snapped % 360) + 360) % 360
    rotationDeg.value = norm
  }

  const sortedPlates = computed(() => [...plates.value].sort((a, b) => a.positionIn - b.positionIn))

  function setDimensions(dims: Partial<RackDimensions>) {
    dimensions.value = { ...dimensions.value, ...dims }
    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      plates.value
    )
  }

  function setPlateCount(count: number) {
    plateCount.value = count
    plates.value = computePlates(
      count,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      plates.value
    )
  }

  function setFloorGapIn(value: number) {
    floorGapIn.value = Math.max(0, Number(value))
    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      plates.value
    )
  }

  function setPlateThicknessIn(value: number) {
    const snapped = Math.max(0.1, Math.round(value * 10) / 10)
    plateThicknessIn.value = snapped
    // recompute plates, preserving manual plates but snapping/clamping them to valid slots
    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      plates.value
    )
  }

  function setPlatePosition(id: string, positionIn: number) {
    const bottom = floorGapIn.value
    const top = dimensions.value.heightIn - plateThicknessIn.value
    const clamped = Math.max(bottom, Math.min(positionIn, top))
    const step = Math.max(stepSizeIn.value, plateThicknessIn.value)
    const n = Math.round((clamped - bottom) / step)
    const snapped = Math.max(bottom, Math.min(bottom + n * step, top))
    const idx = plates.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      plates.value[idx] = { ...plates.value[idx], positionIn: Number(snapped.toFixed(3)), isManual: true }
    }
  }

  function setStepSizeIn(value: number) {
    const snapped = Math.max(0.1, Math.round(value * 10) / 10)
    stepSizeIn.value = snapped
    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      plates.value
    )
  }

  function importFromJson(obj: any) {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid JSON')
    // support exported shape: { config: { ... } } or flat shape
    const cfg = (obj.config && typeof obj.config === 'object') ? obj.config : obj
    // dimensions
    if (obj.dimensions && typeof obj.dimensions === 'object') {
      dimensions.value = { ...dimensions.value, ...obj.dimensions }
    }
    if (typeof cfg.unit === 'string') unit.value = cfg.unit as UnitType
    if (typeof cfg.pillarThicknessIn === 'number') pillarThicknessIn.value = cfg.pillarThicknessIn
    if (typeof cfg.plateThicknessIn === 'number') plateThicknessIn.value = Math.max(0.1, Math.round(cfg.plateThicknessIn * 10) / 10)
    // floor gap: accept either root or config key, and coerce to number
    let importedFloor: number | undefined = undefined
    if (typeof obj.floorGapIn === 'number') importedFloor = obj.floorGapIn
    else if (typeof cfg.floorGapIn === 'number') importedFloor = cfg.floorGapIn
    else if (typeof cfg.floorGap === 'number') importedFloor = cfg.floorGap
    if (typeof importedFloor === 'number') floorGapIn.value = Math.max(0, Number(importedFloor))
    if (typeof cfg.stepSizeIn === 'number') stepSizeIn.value = Math.max(0.1, Math.round(cfg.stepSizeIn * 10) / 10)
    if (typeof cfg.rotationDeg === 'number') rotationDeg.value = ((Math.round(cfg.rotationDeg / 15) * 15) % 360 + 360) % 360
    if (typeof obj.plateCount === 'number') plateCount.value = Math.max(0, Math.round(obj.plateCount))

    if (Array.isArray(obj.plates) && obj.plates.length > 0) {
      // Treat imported plates as authoritative: apply positions (snapped & clamped) exactly as provided
      const imported = obj.plates.map((p: any, i: number) => {
        const id = p?.id != null ? String(p.id) : `p${i}`
        let pos = Number(p?.positionIn ?? 0)
        const bottom = floorGapIn.value
        const top = dimensions.value.heightIn - plateThicknessIn.value
        pos = Math.max(bottom, Math.min(pos, top))
        const step = Math.max(stepSizeIn.value, plateThicknessIn.value)
        const n = Math.round((pos - bottom) / step)
        const snapped = Math.max(bottom, Math.min(bottom + n * step, top))
        return { id, positionIn: Number(snapped.toFixed(3)), isManual: !!p?.isManual }
      })
      plates.value = imported
      // If plateCount present in file, use it; otherwise ensure plateCount matches imported plates
      if (typeof obj.plateCount === 'number') plateCount.value = Math.max(0, Math.round(obj.plateCount))
      else plateCount.value = plates.value.length
      return
    }

    const existing = plates.value

    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      stepSizeIn.value,
      existing
    )

    // Ensure bottom plate aligns with imported floor gap if provided and not manual
    if (typeof importedFloor === 'number') {
      const bottomIdx = plates.value.findIndex(p => p.id === 'p0')
      if (bottomIdx !== -1 && !plates.value[bottomIdx].isManual) {
        const bottomPos = Math.max(floorGapIn.value, Math.min(importedFloor, dimensions.value.heightIn - plateThicknessIn.value))
        plates.value[bottomIdx] = { ...plates.value[bottomIdx], positionIn: Number(bottomPos) }
      }
    }
  }

  function resetToDefaults() {
    dimensions.value = { ...DEFAULTS.dimensions }
    plateCount.value = DEFAULTS.plateCount
    pillarThicknessIn.value = DEFAULTS.pillarThicknessIn
    plateThicknessIn.value = DEFAULTS.plateThicknessIn
    floorGapIn.value = DEFAULTS.floorGapIn
    stepSizeIn.value = DEFAULTS.stepSizeIn
    plates.value = computePlates(
      DEFAULTS.plateCount,
      DEFAULTS.dimensions.heightIn,
      DEFAULTS.floorGapIn,
      DEFAULTS.plateThicknessIn,
      DEFAULTS.stepSizeIn,
      []
    )
    unit.value = DEFAULTS.unit
  }

  return {
    dimensions,
    plateCount,
    plates,
    sortedPlates,
    unit,
    pillarThicknessIn,
    plateThicknessIn,
    floorGapIn,
    stepSizeIn,
    setFloorGapIn,
    setPlateThicknessIn,
    setStepSizeIn,
    rotationDeg,
    setRotationDeg,
    importFromJson,
    setDimensions,
    setPlateCount,
    setPlatePosition,
    setUnit: (v: UnitType) => { unit.value = v },
    resetToDefaults,
  }
})

export function fmt(inches: number, unit: UnitType, decimals = 1): string {
  if (unit === 'ft') return `${(inches / 12).toFixed(decimals)}'`
  if (unit === 'cm') return `${(inches * 2.54).toFixed(decimals)} cm`
  return Number.isInteger(inches) ? `${inches}"` : `${inches.toFixed(decimals)}"`
}
