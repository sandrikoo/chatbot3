import { useRef, useState, PointerEvent } from 'react'
import { useEditor } from '../store/editorStore'
import { BrushStroke } from '../types'

interface Props {
  canvasWidth: number
  canvasHeight: number
}

export function BrushOverlay({ canvasWidth, canvasHeight }: Props) {
  const activeLayerId = useEditor((s) => s.activeLayerId)
  const tool = useEditor((s) => s.activeTool)
  const color = useEditor((s) => s.brushColor)
  const width = useEditor((s) => s.brushWidth)
  const appendStroke = useEditor((s) => s.appendStroke)
  const commit = useEditor((s) => s.commitAdjustment)

  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([])
  const drawing = useRef(false)
  const ref = useRef<SVGSVGElement>(null)

  const mode: 'draw' | 'erase' = tool === 'eraser' ? 'erase' : 'draw'

  const toLocal = (e: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasWidth,
      y: ((e.clientY - rect.top) / rect.height) * canvasHeight,
    }
  }

  const start = (e: PointerEvent) => {
    if (!activeLayerId) return
    drawing.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
    setPoints([toLocal(e)])
  }

  const move = (e: PointerEvent) => {
    if (!drawing.current) return
    setPoints((p) => [...p, toLocal(e)])
  }

  const end = () => {
    if (!drawing.current || !activeLayerId) return
    drawing.current = false
    if (points.length >= 2) {
      const stroke: BrushStroke = { points, color, width, mode }
      appendStroke(activeLayerId, stroke)
      commit()
    }
    setPoints([])
  }

  return (
    <svg
      ref={ref}
      className="absolute inset-0 w-full h-full touch-none"
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      preserveAspectRatio="none"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      style={{ cursor: mode === 'erase' ? 'crosshair' : 'crosshair' }}
    >
      {points.length >= 2 && (
        <path
          d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')}
          stroke={mode === 'erase' ? '#ffffff88' : color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
    </svg>
  )
}
