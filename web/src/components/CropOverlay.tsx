import { PointerEvent, useRef } from 'react'
import { useEditor } from '../store/editorStore'

interface Props {
  canvasWidth: number
  canvasHeight: number
}

type Corner = 'tl' | 'tr' | 'bl' | 'br' | 'move'

export function CropOverlay({ canvasWidth, canvasHeight }: Props) {
  const cropRect = useEditor((s) => s.cropRect)
  const setCropRect = useEditor((s) => s.setCropRect)
  const applyCrop = useEditor((s) => s.applyCrop)
  const setTool = useEditor((s) => s.setActiveTool)

  const ref = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<{ rect: typeof cropRect; x: number; y: number } | null>(null)

  if (!cropRect) return null

  const onPointerDown = (corner: Corner) => (e: PointerEvent) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const r = ref.current!.getBoundingClientRect()
    dragOrigin.current = { rect: { ...cropRect }, x: e.clientX - r.left, y: e.clientY - r.top }
    ;(e.currentTarget as HTMLElement).dataset.dragging = corner
  }

  const onPointerMove = (e: PointerEvent) => {
    const dragging = (e.currentTarget as HTMLElement).dataset.dragging as Corner | undefined
    if (!dragging || !dragOrigin.current) return
    const r = ref.current!.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    const start = dragOrigin.current.rect!
    const sx = dragOrigin.current.x / r.width
    const sy = dragOrigin.current.y / r.height
    const dx = nx - sx
    const dy = ny - sy

    let rect = { ...start }
    if (dragging === 'move') {
      rect = { ...rect, x: start.x + dx, y: start.y + dy }
    } else {
      if (dragging.includes('l')) {
        const nxr = Math.min(start.x + dx, start.x + start.w - 0.05)
        rect.w = start.w - (nxr - start.x)
        rect.x = nxr
      }
      if (dragging.includes('r')) {
        rect.w = Math.max(0.05, start.w + dx)
      }
      if (dragging.includes('t')) {
        const nyt = Math.min(start.y + dy, start.y + start.h - 0.05)
        rect.h = start.h - (nyt - start.y)
        rect.y = nyt
      }
      if (dragging.includes('b')) {
        rect.h = Math.max(0.05, start.h + dy)
      }
    }
    setCropRect(rect)
  }

  const onPointerUp = (e: PointerEvent) => {
    delete (e.currentTarget as HTMLElement).dataset.dragging
    dragOrigin.current = null
  }

  const xPct = cropRect.x * 100
  const yPct = cropRect.y * 100
  const wPct = cropRect.w * 100
  const hPct = cropRect.h * 100

  return (
    <div
      ref={ref}
      className="absolute inset-0 touch-none z-50"
      style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* dim overlay */}
      <div
        className="absolute inset-0 bg-black/55"
        style={{
          clipPath: `polygon(
            0 0, 100% 0, 100% 100%, 0 100%, 0 ${yPct}%,
            ${xPct}% ${yPct}%, ${xPct}% ${yPct + hPct}%,
            ${xPct + wPct}% ${yPct + hPct}%, ${xPct + wPct}% ${yPct}%,
            0 ${yPct}%
          )`,
        }}
      />
      {/* frame */}
      <div
        className="absolute border border-white cursor-move"
        style={{ left: `${xPct}%`, top: `${yPct}%`, width: `${wPct}%`, height: `${hPct}%` }}
        onPointerDown={onPointerDown('move')}
      >
        {/* rule-of-thirds grid */}
        {[1, 2].map((i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0 border-l border-white/30"
            style={{ left: `${(i * 100) / 3}%` }}
          />
        ))}
        {[1, 2].map((i) => (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0 border-t border-white/30"
            style={{ top: `${(i * 100) / 3}%` }}
          />
        ))}

        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <Handle key={c} corner={c} onDown={onPointerDown(c)} />
        ))}
      </div>

      {/* action bar */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex items-center gap-3 bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm">
        <button
          className="text-white text-sm"
          onClick={() => {
            setCropRect(null)
            setTool('select')
          }}
        >
          Cancel
        </button>
        <div className="w-px h-4 bg-white/20" />
        <button className="text-accent text-sm font-semibold" onClick={() => applyCrop()}>
          Apply
        </button>
      </div>
    </div>
  )
}

function Handle({
  corner,
  onDown,
}: {
  corner: 'tl' | 'tr' | 'bl' | 'br'
  onDown: (e: PointerEvent) => void
}) {
  const pos: Record<string, string> = {
    tl: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
    tr: 'right-0 top-0 translate-x-1/2 -translate-y-1/2',
    bl: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2',
    br: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2',
  }
  return (
    <div
      onPointerDown={onDown}
      className={`absolute ${pos[corner]} w-5 h-5 rounded-full bg-white border-2 border-accent cursor-grab touch-none`}
    />
  )
}
