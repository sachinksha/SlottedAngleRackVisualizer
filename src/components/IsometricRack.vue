<template>
  <canvas
    ref="canvasEl"
    :width="canvasWidth"
    :height="canvasHeight"
    class="w-full h-auto rounded-lg border border-slate-200 shadow-md touch-none cursor-default block"
    aria-label="Isometric slotted angle rack visualization. Drag shelves vertically to reposition them."
    role="img"
    @mousemove="handleMouseMove"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRackStore, fmt } from '../stores/rack'

const ISO_ANGLE = Math.PI / 6
const COS = Math.cos(ISO_ANGLE)
const SIN = Math.sin(ISO_ANGLE)

// Canvas sizing constants
const BASE_CANVAS_W = 720
const BASE_CANVAS_H = 680
const PAD = 60
const MAX_CANVAS_W = 720

interface DragState {
  plateId: string
  startY: number
  startPosIn: number
}

interface TouchDragState extends DragState {
  startX: number
}

const emit = defineEmits<{ (e: 'canvasReady', el: HTMLCanvasElement | null): void }>()

const store = useRackStore()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const containerWidth = ref<number>(0)
const dragState = ref<DragState | null>(null)
const touchDragState = ref<TouchDragState | null>(null)
const hoveredPlate = ref<string | null>(null)

// Compute responsive canvas dimensions
const canvasWidth = computed(() => {
  const width = Math.min(MAX_CANVAS_W, containerWidth.value)
  return width > 0 ? width : BASE_CANVAS_W
})

const canvasHeight = computed(() => {
  return Math.round((canvasWidth.value * BASE_CANVAS_H) / BASE_CANVAS_W)
})

// ResizeObserver to track container width changes
let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (!canvasEl.value) return
  resizeObserver = new ResizeObserver(() => {
    const parent = canvasEl.value?.parentElement
    if (parent) containerWidth.value = parent.clientWidth
  })
  const parent = canvasEl.value.parentElement
  if (parent) {
    resizeObserver.observe(parent)
    containerWidth.value = parent.clientWidth
  }
}

function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

onMounted(() => {
  emit('canvasReady', canvasEl.value)
  setupResizeObserver()
  draw()
})

onUnmounted(() => {
  emit('canvasReady', null)
  cleanupResizeObserver()
})

// Recompute SC / OX / OY from store dims using dynamic canvas size
function getLayout() {
  const { heightIn, widthIn, depthIn } = store.dimensions
  const cw = canvasWidth.value
  const ch = canvasHeight.value
  const rot = ((store.rotationDeg ?? 0) * Math.PI) / 180
  // heuristic extra padding to avoid clipping when rotated
  const extraSpan = Math.abs(Math.sin(rot)) * (widthIn + depthIn)
  const effectivePAD = PAD + extraSpan * 0.5
  const approxHeightUnits = heightIn + (widthIn + depthIn) * SIN + extraSpan * 0.2
  const approxWidthUnits = (widthIn + depthIn) * COS + extraSpan * 0.2
  const scByH = (ch - effectivePAD * 2) / approxHeightUnits
  const scByW = (cw - effectivePAD * 2) / approxWidthUnits
  const SC = Math.max(0.2, Math.min(4.5, scByH, scByW))
  const OX = cw / 2
  const OY = ch - effectivePAD - (widthIn + depthIn) * SC * SIN
  return { SC, OX, OY }
}

function toCanvas(x: number, y: number, z: number, SC: number, OX: number, OY: number): [number, number] {
  try {
    const rot = ((store.rotationDeg ?? 0) * Math.PI) / 180
    const rx = x * Math.cos(rot) - y * Math.sin(rot)
    const ry = x * Math.sin(rot) + y * Math.cos(rot)
    const px = (rx - ry) * COS * SC
    const py = -(rx + ry) * SIN * SC + z * SC
    return [OX + px, OY - py]
  } catch (err) {
    // fallback to original isometric projection if rotation fails
    console.error('Rotation projection failed, falling back to default projection', err)
    const px = (x - y) * COS * SC
    const py = -(x + y) * SIN * SC + z * SC
    return [OX + px, OY - py]
  }
}

function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  // Improve crispness on high-DPI / mobile devices
  const dpr = Math.max(1, window.devicePixelRatio || 1)
  const cssW = canvasWidth.value
  const cssH = canvasHeight.value
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const { SC, OX, OY } = getLayout()
  const tc = (x: number, y: number, z: number) => toCanvas(x, y, z, SC, OX, OY)

  const { heightIn: h, widthIn: w, depthIn: d } = store.dimensions
  const pt = store.pillarThicknessIn
  const pth = store.plateThicknessIn
  const plates = store.sortedPlates
  const unit = store.unit
  const cw = canvasWidth.value
  const ch = canvasHeight.value

  ctx.clearRect(0, 0, cw, ch)
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, 0, cw, ch)

  // Grid
  ctx.save()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 0.5
  for (let gx = 0; gx < cw; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke() }
  for (let gy = 0; gy < ch; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke() }
  ctx.restore()

  function drawFace(pts: [number, number][], fill: string, stroke = '#111827', lw = 0.8) {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.fillStyle = fill; ctx.fill()
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke()
  }

  function drawPillar(bx: number, by: number) {
    drawFace([tc(bx,by,0), tc(bx+pt,by,0), tc(bx+pt,by,h), tc(bx,by,h)], '#4b5563', '#111827', 0.7)
    drawFace([tc(bx+pt,by,0), tc(bx+pt,by+pt,0), tc(bx+pt,by+pt,h), tc(bx+pt,by,h)], '#374151', '#111827', 0.7)
    drawFace([tc(bx,by,h), tc(bx+pt,by,h), tc(bx+pt,by+pt,h), tc(bx,by+pt,h)], '#d1d5db', '#111827', 0.7)
    for (let hz = 2; hz < h - 2; hz += 2) {
      const hx = bx + pt * 0.2
      drawFace([tc(hx,by,hz-0.6), tc(hx+0.5,by,hz-0.6), tc(hx+0.5,by,hz+0.6), tc(hx,by,hz+0.6)], '#1f2937', '#0d1117', 0.4)
    }
    for (let hz = 2; hz < h - 2; hz += 2) {
      const hy = by + pt * 0.2
      drawFace([tc(bx+pt,hy,hz-0.6), tc(bx+pt,hy+0.5,hz-0.6), tc(bx+pt,hy+0.5,hz+0.6), tc(bx+pt,hy,hz+0.6)], '#111827', '#0d1117', 0.3)
    }
  }

  function drawPlate(posIn: number, plateId: string) {
    const z = posIn, zt = z + pth
    const px0 = pt, px1 = w - pt, py0 = pt, py1 = d - pt
    const hov = hoveredPlate.value === plateId
    const TOP = hov ? '#fde68a' : '#bbf7d0'
    const FRONT = hov ? '#fbbf24' : '#4ade80'
    const SIDE = hov ? '#f59e0b' : '#22c55e'
    const GRID = hov ? '#b45309' : '#15803d'
    drawFace([tc(px0,py0,z), tc(px1,py0,z), tc(px1,py0,zt), tc(px0,py0,zt)], FRONT, '#111827', 0.8)
    drawFace([tc(px1,py0,z), tc(px1,py1,z), tc(px1,py1,zt), tc(px1,py0,zt)], SIDE, '#111827', 0.8)
    drawFace([tc(px0,py0,zt), tc(px1,py0,zt), tc(px1,py1,zt), tc(px0,py1,zt)], TOP, '#111827', 0.8)
    const nb = Math.max(1, Math.floor((px1-px0)/6))
    for (let b = 1; b < nb; b++) {
      const bx = px0 + ((px1-px0)/nb)*b
      ctx.beginPath(); const [ax,ay]=tc(bx,py0,zt); const [bx2,by2]=tc(bx,py1,zt)
      ctx.moveTo(ax,ay); ctx.lineTo(bx2,by2); ctx.strokeStyle=GRID; ctx.lineWidth=0.5; ctx.stroke()
    }
    const nbd = Math.max(1, Math.floor((py1-py0)/6))
    for (let b = 1; b < nbd; b++) {
      const by2 = py0 + ((py1-py0)/nbd)*b
      ctx.beginPath(); const [ax,ay]=tc(px0,by2,zt); const [bx2,by22]=tc(px1,by2,zt)
      ctx.moveTo(ax,ay); ctx.lineTo(bx2,by22); ctx.strokeStyle=GRID; ctx.lineWidth=0.5; ctx.stroke()
    }
    const [hcx,hcy] = tc((px0+px1)/2, py0, zt+0.3)
    ctx.beginPath(); ctx.arc(hcx,hcy,hov?6:4,0,Math.PI*2)
    ctx.fillStyle=hov?'#f59e0b':'#d1d5db'; ctx.fill()
    ctx.strokeStyle='#111827'; ctx.lineWidth=1; ctx.stroke()
  }

  function dimLine(x1:number,y1:number,x2:number,y2:number,label:string,offPx=16,side:1|-1=1) {
    const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy)
    if(len<5) return
    const nx=(-dy/len)*side,ny=(dx/len)*side
    const ox=nx*offPx,oy=ny*offPx
    ctx.save()
    ctx.strokeStyle='#3b82f6'; ctx.lineWidth=0.9; ctx.setLineDash([3,3])
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1+ox,y1+oy)
    ctx.moveTo(x2,y2); ctx.lineTo(x2+ox,y2+oy); ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath(); ctx.moveTo(x1+ox,y1+oy); ctx.lineTo(x2+ox,y2+oy); ctx.stroke()
    const ang=Math.atan2(dy,dx),as=5
    ;[[x1+ox,y1+oy,ang],[x2+ox,y2+oy,ang+Math.PI]].forEach(([ax,ay,a]) => {
      ctx.beginPath()
      ctx.moveTo(ax as number,ay as number)
      ctx.lineTo((ax as number)+Math.cos((a as number)+0.35)*as,(ay as number)+Math.sin((a as number)+0.35)*as)
      ctx.moveTo(ax as number,ay as number)
      ctx.lineTo((ax as number)+Math.cos((a as number)-0.35)*as,(ay as number)+Math.sin((a as number)-0.35)*as)
      ctx.stroke()
    })
    const mx=(x1+x2)/2+ox*1.4,my=(y1+y2)/2+oy*1.4
    ctx.font='bold 9.5px Inter,system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
    const tw=ctx.measureText(label).width+6
    ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(mx-tw/2,my-7,tw,14)
    ctx.fillStyle='#1e40af'; ctx.fillText(label,mx,my)
    ctx.restore()
  }

  // Ground shadow
  ctx.save(); ctx.globalAlpha=0.1; ctx.fillStyle='#1e293b'
  const sh=5,[s0x,s0y]=tc(0,0,0),[s1x,s1y]=tc(w,0,0),[s2x,s2y]=tc(w,d,0),[s3x,s3y]=tc(0,d,0)
  ctx.beginPath(); ctx.moveTo(s0x+sh,s0y+sh); ctx.lineTo(s1x+sh,s1y+sh)
  ctx.lineTo(s2x+sh,s2y+sh); ctx.lineTo(s3x+sh,s3y+sh); ctx.closePath(); ctx.fill()
  ctx.globalAlpha=0.07; ctx.fillStyle='#60a5fa'
  ctx.beginPath(); ctx.moveTo(s0x,s0y); ctx.lineTo(s1x,s1y); ctx.lineTo(s2x,s2y); ctx.lineTo(s3x,s3y)
  ctx.closePath(); ctx.fill(); ctx.globalAlpha=1; ctx.restore()

  // Back pillars → plates → front pillars
  drawPillar(0, d-pt); drawPillar(w-pt, d-pt)
  for (const pl of plates) drawPlate(pl.positionIn, pl.id)
  drawPillar(0, 0); drawPillar(w-pt, 0)

  // Dimension lines
  if (plates.length > 0) {
    const [gx,gy]=tc(0,0,0),[px,py]=tc(0,0,plates[0].positionIn)
    dimLine(gx,gy,px,py,fmt(plates[0].positionIn,unit),22,-1)
  }
  { const [bx,by]=tc(0,0,0),[tx,ty]=tc(0,0,h); dimLine(bx,by,tx,ty,fmt(h,unit),46,-1) }
  for (let i=0;i<plates.length-1;i++) {
    const gap=plates[i+1].positionIn-(plates[i].positionIn+pth)
    const [lx1,ly1]=tc(w,0,plates[i].positionIn+pth),[lx2,ly2]=tc(w,0,plates[i+1].positionIn)
    dimLine(lx1,ly1,lx2,ly2,fmt(gap,unit),16,1)
  }
  { const [ax,ay]=tc(0,0,0),[bx,by]=tc(w,0,0); dimLine(ax,ay,bx,by,fmt(w,unit),12,1) }
  { const [ax,ay]=tc(w,0,0),[bx,by]=tc(w,d,0); dimLine(ax,ay,bx,by,fmt(d,unit),12,1) }

  // Plate height labels
  for (const pl of plates) {
    const [px,py]=tc(w/2+pt,0,pl.positionIn+pth)
    const label=`${fmt(pl.positionIn,unit)}${pl.isManual?' ✱':''}`
    ctx.save(); ctx.font='bold 9px Inter,system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom'
    const tw=ctx.measureText(label).width+6
    ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(px-tw/2,py-13,tw,12)
    ctx.fillStyle=pl.isManual?'#b45309':'#1e3a8a'; ctx.fillText(label,px,py-2); ctx.restore()
  }

  // Title
  ctx.save(); ctx.fillStyle='#1e293b'; ctx.font='bold 12px Inter,system-ui,sans-serif'; ctx.textAlign='left'
  ctx.fillText(`${fmt(w,unit)} W × ${fmt(d,unit)} D × ${fmt(h,unit)} H · ${plates.length} shelf${plates.length!==1?'s':''}`,12,18)
  ctx.font='10px Inter,system-ui,sans-serif'; ctx.fillStyle='#64748b'
  ctx.fillText('4 slotted angle pillars · drag shelves to reposition · ✱ = manual',12,33)
  ctx.restore()
}

function getPlateAtPoint(cx: number, cy: number): string | null {
  const { SC, OX, OY } = getLayout()
  const tc = (x: number, y: number, z: number) => toCanvas(x, y, z, SC, OX, OY)
  const pt = store.pillarThicknessIn, pth = store.plateThicknessIn
  const { widthIn: w, depthIn: d } = store.dimensions

  for (let i = store.plates.length - 1; i >= 0; i--) {
    const pl = store.plates[i]
    const z = pl.positionIn, zt = z + pth
    const px0 = pt, px1 = w - pt, py0 = pt, py1 = d - pt
    if (pointInPoly(cx, cy, [tc(px0,py0,zt), tc(px1,py0,zt), tc(px1,py1,zt), tc(px0,py1,zt)])) return pl.id
    if (pointInPoly(cx, cy, [tc(px0,py0,z), tc(px1,py0,z), tc(px1,py0,zt), tc(px0,py0,zt)])) return pl.id
  }
  return null
}

function pointInPoly(px: number, py: number, poly: [number,number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function getCanvasPos(e: MouseEvent | Touch): [number, number] {
  const canvas = canvasEl.value!
  const rect = canvas.getBoundingClientRect()
  const clientX = e instanceof Touch ? e.clientX : e.clientX
  const clientY = e instanceof Touch ? e.clientY : e.clientY
  return [(clientX - rect.left) * (canvas.width / rect.width), (clientY - rect.top) * (canvas.height / rect.height)]
}

function handleMouseMove(e: MouseEvent) {
  const [cx, cy] = getCanvasPos(e)
  if (dragState.value) {
    const { SC } = getLayout()
    const { plateId, startY, startPosIn } = dragState.value
    const inchesPerPx = 1 / (SC * SIN * 2)
    store.setPlatePosition(plateId, startPosIn - (cy - startY) * inchesPerPx)
    e.preventDefault()
  } else {
    const id = getPlateAtPoint(cx, cy)
    hoveredPlate.value = id
    if (canvasEl.value) canvasEl.value.style.cursor = id ? 'ns-resize' : 'default'
  }
}

function handleMouseDown(e: MouseEvent) {
  const [cx, cy] = getCanvasPos(e)
  const id = getPlateAtPoint(cx, cy)
  if (id) {
    const pl = store.plates.find(p => p.id === id)
    if (pl) { dragState.value = { plateId: id, startY: cy, startPosIn: pl.positionIn }; e.preventDefault() }
  }
}

function handleMouseUp() { dragState.value = null }

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const touch = e.touches[0]
  const [cx, cy] = getCanvasPos(touch)
  const id = getPlateAtPoint(cx, cy)
  if (id) {
    const pl = store.plates.find(p => p.id === id)
    if (pl) {
      touchDragState.value = { plateId: id, startX: touch.clientX, startY: touch.clientY, startPosIn: pl.positionIn }
      e.preventDefault()
    }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!touchDragState.value || e.touches.length !== 1) return
  const touch = e.touches[0]
  const [, cy] = getCanvasPos(touch)
  const { SC } = getLayout()
  const { plateId, startY, startPosIn } = touchDragState.value
  const inchesPerPx = 1 / (SC * SIN * 2)
  store.setPlatePosition(plateId, startPosIn - (cy - startY) * inchesPerPx)
  e.preventDefault()
}

function handleTouchEnd() {
  touchDragState.value = null
}

watch(
  [() => store.dimensions, () => store.plates, () => store.unit, () => store.rotationDeg, hoveredPlate, canvasWidth, canvasHeight],
  () => draw(),
  { deep: true, immediate: false }
)
</script>
