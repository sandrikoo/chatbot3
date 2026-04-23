export type ToolType =
  | 'select'
  | 'marquee'
  | 'brush'
  | 'eraser'
  | 'lasso'
  | 'pen'
  | 'stamp'
  | 'pencil'
  | 'text'
  | 'shape'
  | 'image'
  | 'adjust'
  | 'crop'

export type LayerType = 'image' | 'text' | 'shape' | 'background'

export type AdjustmentTab =
  | 'light'
  | 'color'
  | 'effects'
  | 'detail'
  | 'optics'
  | 'geometry'

export type AdjustmentType =
  | 'exposure'
  | 'contrast'
  | 'highlights'
  | 'shadows'
  | 'saturation'
  | 'temperature'
  | 'tint'
  | 'sharpness'
  | 'vibrance'
  | 'vignette'
  | 'grain'
  | 'rotation'
  | 'straighten'

export interface Adjustments {
  exposure: number
  contrast: number
  highlights: number
  shadows: number
  saturation: number
  temperature: number
  tint: number
  sharpness: number
  vibrance: number
  vignette: number
  grain: number
  rotation: number
  straighten: number
}

export const IDENTITY_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  vibrance: 0,
  vignette: 0,
  grain: 0,
  rotation: 0,
  straighten: 0,
}

export const ADJUSTMENT_RANGES: Record<AdjustmentType, [number, number]> = {
  exposure: [-2, 2],
  contrast: [-100, 100],
  highlights: [-100, 100],
  shadows: [-100, 100],
  saturation: [-100, 100],
  temperature: [-100, 100],
  tint: [-100, 100],
  sharpness: [0, 100],
  vibrance: [-100, 100],
  vignette: [-100, 100],
  grain: [0, 100],
  rotation: [-180, 180],
  straighten: [-45, 45],
}

export interface BrushStroke {
  points: Array<{ x: number; y: number }>
  color: string
  width: number
  mode: 'draw' | 'erase'
}

export interface LayerModel {
  id: string
  type: LayerType
  name: string
  /** Object URL for image/shape layers */
  src?: string
  /** Natural size of the source (used for export) */
  naturalWidth?: number
  naturalHeight?: number
  text?: string
  textColor?: string
  textSize?: number
  shapeColor?: string
  visible: boolean
  locked: boolean
  opacity: number
  offsetX: number
  offsetY: number
  scale: number
  rotation: number // radians
  zIndex: number
  adjustments: Adjustments
  strokes: BrushStroke[]
}

export interface EditorSnapshot {
  layers: LayerModel[]
  activeLayerId: string | null
  adjustments: Adjustments
}

export type AppTab = 'discover' | 'learn' | 'files' | 'more'

export interface CropRect {
  /** 0..1 normalised to canvas size */
  x: number
  y: number
  w: number
  h: number
}
