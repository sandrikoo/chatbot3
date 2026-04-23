import { useGesture } from '@use-gesture/react'
import { useRef } from 'react'
import { useEditor } from '../store/editorStore'
import { LayerModel } from '../types'
import { cssFilter } from '../services/imageProcessor'

interface Props {
  layer: LayerModel
  canvasWidth: number
  canvasHeight: number
}

export function LayerItem({ layer, canvasWidth, canvasHeight }: Props) {
  const setLayerOffset = useEditor((s) => s.setLayerOffset)
  const setLayerScale = useEditor((s) => s.setLayerScale)
  const setLayerRotation = useEditor((s) => s.setLayerRotation)
  const selectLayer = useEditor((s) => s.selectLayer)
  const commit = useEditor((s) => s.commitAdjustment)
  const activeId = useEditor((s) => s.activeLayerId)
  const setSheet = useEditor((s) => s.setSheet)
  const activeTool = useEditor((s) => s.activeTool)

  const origin = useRef({ x: 0, y: 0, s: 1, r: 0 })

  const bind = useGesture(
    {
      onDragStart: () => {
        origin.current.x = layer.offsetX
        origin.current.y = layer.offsetY
      },
      onDrag: ({ movement: [mx, my], pinching }) => {
        if (layer.locked || pinching || activeTool === 'brush' || activeTool === 'eraser') return
        setLayerOffset(layer.id, origin.current.x + mx, origin.current.y + my)
      },
      onDragEnd: () => {
        if (layer.locked) return
        commit()
      },
      onPinchStart: () => {
        origin.current.s = layer.scale
        origin.current.r = layer.rotation
      },
      onPinch: ({ movement: [d, a] }) => {
        if (layer.locked) return
        setLayerScale(layer.id, origin.current.s * d)
        setLayerRotation(layer.id, origin.current.r + (a * Math.PI) / 180)
      },
      onPinchEnd: () => {
        if (layer.locked) return
        commit()
      },
    },
    { drag: { filterTaps: true }, pinch: { scaleBounds: { min: 0.1, max: 5 } } },
  )

  const onTap = () => {
    selectLayer(layer.id)
    if (layer.type === 'text' && activeId === layer.id) {
      setSheet({ kind: 'textEditor', layerId: layer.id })
    }
  }

  const transform = `translate(-50%, -50%) translate(${layer.offsetX}px, ${layer.offsetY}px) rotate(${layer.rotation}rad) scale(${layer.scale})`
  const filter = cssFilter(layer.adjustments)
  const isActive = layer.id === activeId

  return (
    <div
      {...bind()}
      onClick={onTap}
      className="absolute left-1/2 top-1/2 touch-none select-none"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        transform,
        opacity: layer.opacity,
        zIndex: layer.zIndex,
        outline: isActive && !layer.locked ? '1.5px dashed rgba(36,121,255,0.9)' : 'none',
        outlineOffset: -2,
        cursor: layer.locked ? 'default' : 'move',
      }}
    >
      {layer.type === 'background' && (
        <div
          className="w-full h-full"
          style={{ background: layer.shapeColor ?? '#000' }}
        />
      )}
      {layer.type === 'image' && layer.src && (
        <img
          src={layer.src}
          alt=""
          draggable={false}
          className="w-full h-full object-contain pointer-events-none"
          style={{ filter }}
        />
      )}
      {layer.type === 'shape' && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '40%',
            aspectRatio: '1 / 1',
            background: layer.shapeColor ?? '#2479ff',
            filter,
          }}
        />
      )}
      {layer.type === 'text' && (
        <div
          className="w-full h-full flex items-center justify-center text-center"
          style={{
            color: layer.textColor ?? '#fff',
            fontSize: layer.textSize ?? 48,
            fontWeight: 600,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            padding: '0 16px',
            filter,
          }}
        >
          {layer.text}
        </div>
      )}

      {/* strokes */}
      <StrokesLayer layer={layer} canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
    </div>
  )
}

function StrokesLayer({
  layer,
  canvasWidth,
  canvasHeight,
}: {
  layer: LayerModel
  canvasWidth: number
  canvasHeight: number
}) {
  if (!layer.strokes.length) return null
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="none"
    >
      {layer.strokes.map((s, i) => {
        const d = s.points
          .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`)
          .join(' ')
        return (
          <path
            key={i}
            d={d}
            stroke={s.mode === 'erase' ? '#000' : s.color}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ mixBlendMode: s.mode === 'erase' ? 'destination-out' as never : undefined }}
          />
        )
      })}
    </svg>
  )
}
