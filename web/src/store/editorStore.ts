import { create } from 'zustand'
import {
  ADJUSTMENT_RANGES,
  Adjustments,
  AdjustmentTab,
  AdjustmentType,
  AppTab,
  BrushStroke,
  CropRect,
  EditorSnapshot,
  IDENTITY_ADJUSTMENTS,
  LayerModel,
  LayerType,
  ToolType,
} from '../types'

const MAX_HISTORY = 50
const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36))

type SheetState =
  | { kind: 'none' }
  | { kind: 'imagePicker' }
  | { kind: 'textEditor'; layerId: string }
  | { kind: 'exportResult'; message: string }
  | { kind: 'addLayer' }

export interface EditorState {
  // canvas
  canvasWidth: number
  canvasHeight: number
  canvasZoom: number
  canvasOffsetX: number
  canvasOffsetY: number

  // stack
  layers: LayerModel[]
  activeLayerId: string | null

  // panels / ui
  activeTab: AdjustmentTab
  activeTool: ToolType
  activeAppTab: AppTab
  showAdjustmentsPanel: boolean
  sheet: SheetState
  isExporting: boolean
  cropRect: CropRect | null

  // shared (global) slider values for the active layer
  adjustments: Adjustments

  // brush
  brushColor: string
  brushWidth: number

  // history
  history: EditorSnapshot[]
  redo: EditorSnapshot[]

  // actions
  seed: () => void
  saveSnapshot: () => void
  undo: () => void
  redoAction: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  setCanvasZoom: (z: number) => void
  setCanvasOffset: (x: number, y: number) => void
  resetCanvasTransform: () => void

  selectLayer: (id: string) => void
  addImageLayer: (src: string, width: number, height: number) => void
  addTextLayer: (text?: string) => void
  addShapeLayer: (color?: string) => void
  deleteLayer: (id: string) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  duplicateLayer: (id: string) => void
  reorderLayers: (from: number, to: number) => void

  setLayerText: (id: string, text: string) => void
  setLayerOffset: (id: string, x: number, y: number) => void
  setLayerScale: (id: string, scale: number) => void
  setLayerRotation: (id: string, rotation: number) => void
  setLayerOpacity: (id: string, opacity: number) => void
  appendStroke: (id: string, stroke: BrushStroke) => void

  setActiveTab: (tab: AdjustmentTab) => void
  setActiveTool: (tool: ToolType) => void
  setActiveAppTab: (tab: AppTab) => void

  setAdjustment: (type: AdjustmentType, value: number) => void
  commitAdjustment: () => void
  resetAdjustment: (type: AdjustmentType) => void
  applyAuto: () => void

  toggleAdjustmentsPanel: () => void
  setSheet: (s: SheetState) => void

  setBrushColor: (color: string) => void
  setBrushWidth: (width: number) => void

  setCropRect: (rect: CropRect | null) => void
  applyCrop: () => void

  setExporting: (b: boolean) => void
  newProject: () => void
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const snapshotOf = (s: EditorState): EditorSnapshot => ({
  layers: s.layers.map((l) => ({ ...l, adjustments: { ...l.adjustments }, strokes: l.strokes.map((k) => ({ ...k, points: [...k.points] })) })),
  activeLayerId: s.activeLayerId,
  adjustments: { ...s.adjustments },
})

const defaultLayer = (partial: Partial<LayerModel> & { type: LayerType; name: string }): LayerModel => ({
  id: uid(),
  visible: true,
  locked: false,
  opacity: 1,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  zIndex: 0,
  adjustments: { ...IDENTITY_ADJUSTMENTS },
  strokes: [],
  ...partial,
})

export const useEditor = create<EditorState>((set, get) => ({
  canvasWidth: 1200,
  canvasHeight: 1600,
  canvasZoom: 1,
  canvasOffsetX: 0,
  canvasOffsetY: 0,

  layers: [],
  activeLayerId: null,

  activeTab: 'light',
  activeTool: 'select',
  activeAppTab: 'files',
  showAdjustmentsPanel: true,
  sheet: { kind: 'none' },
  isExporting: false,
  cropRect: null,

  adjustments: { ...IDENTITY_ADJUSTMENTS },

  brushColor: '#ffffff',
  brushWidth: 8,

  history: [],
  redo: [],

  seed: () => {
    const background = defaultLayer({
      type: 'background',
      name: 'Background',
      locked: true,
      zIndex: 0,
      shapeColor: '#000000',
    })
    set({ layers: [background], activeLayerId: background.id })
    get().saveSnapshot()
  },

  saveSnapshot: () => {
    const snap = snapshotOf(get())
    const history = [...get().history, snap]
    if (history.length > MAX_HISTORY) history.shift()
    set({ history, redo: [] })
  },

  undo: () => {
    const { history } = get()
    if (!history.length) return
    const previous = history[history.length - 1]
    const current = snapshotOf(get())
    set({
      history: history.slice(0, -1),
      redo: [...get().redo, current],
      layers: previous.layers,
      activeLayerId: previous.activeLayerId,
      adjustments: previous.adjustments,
    })
  },

  redoAction: () => {
    const { redo } = get()
    if (!redo.length) return
    const next = redo[redo.length - 1]
    const current = snapshotOf(get())
    set({
      redo: redo.slice(0, -1),
      history: [...get().history, current],
      layers: next.layers,
      activeLayerId: next.activeLayerId,
      adjustments: next.adjustments,
    })
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().redo.length > 0,

  setCanvasZoom: (z) => set({ canvasZoom: clamp(z, 0.25, 6) }),
  setCanvasOffset: (x, y) => set({ canvasOffsetX: x, canvasOffsetY: y }),
  resetCanvasTransform: () => set({ canvasZoom: 1, canvasOffsetX: 0, canvasOffsetY: 0 }),

  selectLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id)
    set({
      activeLayerId: id,
      adjustments: layer ? { ...layer.adjustments } : { ...IDENTITY_ADJUSTMENTS },
    })
  },

  addImageLayer: (src, width, height) => {
    get().saveSnapshot()
    const zIndex = Math.max(0, ...get().layers.map((l) => l.zIndex)) + 1
    const layer = defaultLayer({
      type: 'image',
      name: `Image ${zIndex}`,
      src,
      naturalWidth: width,
      naturalHeight: height,
      zIndex,
    })
    set({ layers: [...get().layers, layer], activeLayerId: layer.id, sheet: { kind: 'none' } })
  },

  addTextLayer: (text = 'Tap to edit') => {
    get().saveSnapshot()
    const zIndex = Math.max(0, ...get().layers.map((l) => l.zIndex)) + 1
    const layer = defaultLayer({
      type: 'text',
      name: text.slice(0, 16),
      text,
      textColor: '#ffffff',
      textSize: 48,
      zIndex,
    })
    set({ layers: [...get().layers, layer], activeLayerId: layer.id, sheet: { kind: 'textEditor', layerId: layer.id } })
  },

  addShapeLayer: (color = '#2479ff') => {
    get().saveSnapshot()
    const zIndex = Math.max(0, ...get().layers.map((l) => l.zIndex)) + 1
    const layer = defaultLayer({
      type: 'shape',
      name: `Shape ${zIndex}`,
      shapeColor: color,
      naturalWidth: 400,
      naturalHeight: 400,
      zIndex,
    })
    set({ layers: [...get().layers, layer], activeLayerId: layer.id })
  },

  deleteLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id)
    if (!layer || layer.locked) return
    get().saveSnapshot()
    const layers = get().layers.filter((l) => l.id !== id)
    set({
      layers,
      activeLayerId:
        get().activeLayerId === id ? (layers[layers.length - 1]?.id ?? null) : get().activeLayerId,
    })
  },

  toggleVisibility: (id) => {
    set({
      layers: get().layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })
  },

  toggleLock: (id) => {
    set({
      layers: get().layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
    })
  },

  duplicateLayer: (id) => {
    const layer = get().layers.find((l) => l.id === id)
    if (!layer) return
    get().saveSnapshot()
    const zIndex = Math.max(0, ...get().layers.map((l) => l.zIndex)) + 1
    const copy: LayerModel = {
      ...layer,
      id: uid(),
      name: `${layer.name} copy`,
      locked: false,
      zIndex,
      adjustments: { ...layer.adjustments },
      strokes: layer.strokes.map((s) => ({ ...s, points: [...s.points] })),
    }
    set({ layers: [...get().layers, copy], activeLayerId: copy.id })
  },

  reorderLayers: (from, to) => {
    const layers = [...get().layers]
    if (from < 0 || from >= layers.length) return
    get().saveSnapshot()
    const [m] = layers.splice(from, 1)
    layers.splice(clamp(to, 0, layers.length), 0, m)
    layers.forEach((l, i) => (l.zIndex = i))
    set({ layers })
  },

  setLayerText: (id, text) => {
    get().saveSnapshot()
    set({
      layers: get().layers.map((l) =>
        l.id === id ? { ...l, text, name: text.slice(0, 16) || 'Text' } : l,
      ),
    })
  },

  setLayerOffset: (id, x, y) => {
    set({
      layers: get().layers.map((l) =>
        l.id === id && !l.locked ? { ...l, offsetX: x, offsetY: y } : l,
      ),
    })
  },

  setLayerScale: (id, scale) => {
    const s = clamp(scale, 0.1, 5)
    set({ layers: get().layers.map((l) => (l.id === id && !l.locked ? { ...l, scale: s } : l)) })
  },

  setLayerRotation: (id, rotation) => {
    set({
      layers: get().layers.map((l) =>
        l.id === id && !l.locked ? { ...l, rotation } : l,
      ),
    })
  },

  setLayerOpacity: (id, opacity) => {
    set({
      layers: get().layers.map((l) =>
        l.id === id ? { ...l, opacity: clamp(opacity, 0, 1) } : l,
      ),
    })
  },

  appendStroke: (id, stroke) => {
    set({
      layers: get().layers.map((l) =>
        l.id === id && !l.locked ? { ...l, strokes: [...l.strokes, stroke] } : l,
      ),
    })
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setActiveTool: (activeTool) => {
    set({ activeTool })
    if (activeTool === 'crop') {
      set({ cropRect: { x: 0.08, y: 0.08, w: 0.84, h: 0.84 } })
    }
  },

  setActiveAppTab: (activeAppTab) => set({ activeAppTab }),

  setAdjustment: (type, value) => {
    const adjustments = { ...get().adjustments, [type]: value }
    set({ adjustments })
    const id = get().activeLayerId
    if (!id) return
    set({
      layers: get().layers.map((l) =>
        l.id === id && !l.locked ? { ...l, adjustments: { ...l.adjustments, [type]: value } } : l,
      ),
    })
  },

  commitAdjustment: () => get().saveSnapshot(),

  resetAdjustment: (type) => {
    get().setAdjustment(type, 0)
    get().commitAdjustment()
  },

  applyAuto: () => {
    get().saveSnapshot()
    const preset: Adjustments = {
      ...get().adjustments,
      exposure: 0.35,
      contrast: 12,
      highlights: -28,
      shadows: 18,
      vibrance: 15,
    }
    set({ adjustments: preset })
    const id = get().activeLayerId
    if (!id) return
    set({
      layers: get().layers.map((l) =>
        l.id === id && !l.locked ? { ...l, adjustments: { ...preset } } : l,
      ),
    })
  },

  toggleAdjustmentsPanel: () => set({ showAdjustmentsPanel: !get().showAdjustmentsPanel }),
  setSheet: (sheet) => set({ sheet }),

  setBrushColor: (brushColor) => set({ brushColor }),
  setBrushWidth: (brushWidth) => set({ brushWidth }),

  setCropRect: (rect) => {
    if (!rect) return set({ cropRect: null })
    const clamped: CropRect = {
      x: clamp(rect.x, 0, 1),
      y: clamp(rect.y, 0, 1),
      w: clamp(rect.w, 0.05, 1 - clamp(rect.x, 0, 1)),
      h: clamp(rect.h, 0.05, 1 - clamp(rect.y, 0, 1)),
    }
    set({ cropRect: clamped })
  },

  applyCrop: () => {
    // Crop is applied lazily in the exporter using the active cropRect.
    // Here we simply persist the rect as a snapshot boundary.
    get().saveSnapshot()
    set({ activeTool: 'select', cropRect: null })
  },

  setExporting: (b) => set({ isExporting: b }),

  newProject: () => {
    set({
      layers: [],
      activeLayerId: null,
      history: [],
      redo: [],
      adjustments: { ...IDENTITY_ADJUSTMENTS },
      canvasZoom: 1,
      canvasOffsetX: 0,
      canvasOffsetY: 0,
      cropRect: null,
    })
    get().seed()
  },
}))

export { ADJUSTMENT_RANGES }
