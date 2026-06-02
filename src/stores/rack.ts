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
}

function computePlates(
  count: number,
  heightIn: number,
  floorGapIn: number,
  plateThicknessIn: number,
  existing: Plate[]
): Plate[] {
  if (count <= 0) return []
  if (count === 1) {
    const ex = existing.find(p => p.id === 'p0')
    return [ex?.isManual ? { ...ex } : { id: 'p0', positionIn: floorGapIn, isManual: false }]
  }
  const bottomPos = floorGapIn
  const topPos = heightIn - plateThicknessIn
  const plates: Plate[] = []
  for (let i = 0; i < count; i++) {
    const ex = existing.find(p => p.id === `p${i}`)
    if (ex?.isManual) { plates.push({ ...ex }); continue }
    let pos: number
    if (i === 0) pos = bottomPos
    else if (i === count - 1) pos = topPos
    else {
      const span = topPos - bottomPos
      pos = bottomPos + (span / (count - 1)) * i
    }
    plates.push({ id: `p${i}`, positionIn: Math.round(pos), isManual: false })
  }
  return plates
}

export const useRackStore = defineStore('rack', () => {
  const dimensions = ref<RackDimensions>({ ...DEFAULTS.dimensions })
  const plateCount = ref(DEFAULTS.plateCount)
  const plates = ref<Plate[]>(
    computePlates(DEFAULTS.plateCount, DEFAULTS.dimensions.heightIn, DEFAULTS.floorGapIn, DEFAULTS.plateThicknessIn, [])
  )
  const unit = ref<UnitType>(DEFAULTS.unit)
  const pillarThicknessIn = ref(DEFAULTS.pillarThicknessIn)
  const plateThicknessIn = ref(DEFAULTS.plateThicknessIn)
  const floorGapIn = ref(DEFAULTS.floorGapIn)

  const sortedPlates = computed(() => [...plates.value].sort((a, b) => a.positionIn - b.positionIn))

  function setDimensions(dims: Partial<RackDimensions>) {
    dimensions.value = { ...dimensions.value, ...dims }
    plates.value = computePlates(
      plateCount.value,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      plates.value.map(p => ({ ...p, isManual: false }))
    )
  }

  function setPlateCount(count: number) {
    plateCount.value = count
    plates.value = computePlates(
      count,
      dimensions.value.heightIn,
      floorGapIn.value,
      plateThicknessIn.value,
      plates.value
    )
  }

  function setPlatePosition(id: string, positionIn: number) {
    const clamped = Math.max(
      floorGapIn.value,
      Math.min(positionIn, dimensions.value.heightIn - plateThicknessIn.value)
    )
    const snapped = Math.round(clamped)
    const idx = plates.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      plates.value[idx] = { ...plates.value[idx], positionIn: snapped, isManual: true }
    }
  }

  function resetToDefaults() {
    dimensions.value = { ...DEFAULTS.dimensions }
    plateCount.value = DEFAULTS.plateCount
    plates.value = computePlates(DEFAULTS.plateCount, DEFAULTS.dimensions.heightIn, DEFAULTS.floorGapIn, DEFAULTS.plateThicknessIn, [])
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
