import { useGesture } from '@use-gesture/react'
import { useRef } from 'react'
import { useEditor } from '../store/editorStore'
import { LayerItem } from './LayerItem'
import { BrushOverlay } from './BrushOverlay'
import { CropOverlay } from './CropOverlay'

export function CanvasView() {
  const canvasWidth = useEditor((s) => s.canvasWidth)
  const canvasHeight = useEditor((s) => s.canvasHeight)
  const zoom = useEditor((s) => s.canvasZoom)
  const ox = useEditor((s) => s.canvasOffsetX)
  const oy = useEditor((s) => s.canvasOffsetY)
  const setZoom = useEditor((s) => s.setCanvasZoom)
  const setOffset = useEditor((s) => s.setCanvasOffset)
  const reset = useEditor((s) => s.resetCanvasTransform)
  const layers = useEditor((s) => s.layers)
  const activeTool = useEditor((s) => s.activeTool)

  const origin = useRef({ z: 1, x: 0, y: 0 })

  const interactiveTool = activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'crop'

  const bind = useGesture(
    {
      onDragStart: () => {
        origin.current.x = ox
        origin.current.y = oy
      },
      onDrag: ({ movement: [mx, my], pinching, touches, event }) => {
        if (interactiveTool) return
        if (pinching) return
        // Only pan with 2+ fingers on touch devices, or any mouse drag.
        if ((event as PointerEvent).pointerType === 'touch' && touches < 2) return
        setOffset(origin.current.x + mx, origin.current.y + my)
      },
      onPinchStart: () => {
        origin.current.z = zoom
      },
      onPinch: ({ movement: [d] }) => {
        if (interactiveTool) return
        setZoom(origin.current.z * d)
      },
    },
    { drag: { filterTaps: true }, pinch: { scaleBounds: { min: 0.25, max: 6 } } },
  )

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex)

  // Fit canvas-at-native-size inside the visible area; scale everything by one
  // CSS scale applied via `transform` so we can use canvas-space numbers freely.
  const frameScale = 0.4 // displays the 1200x1600 canvas ~480x640 at zoom 1

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg" onDoubleClick={reset}>
      <div
        {...bind()}
        className="absolute inset-0 flex items-center justify-center touch-none"
      >
        <div
          className="relative shadow-2xl"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${ox}px, ${oy}px) scale(${frameScale * zoom})`,
            transformOrigin: 'center center',
            background: '#000',
          }}
        >
          {sorted.map((l) =>
            l.visible ? (
              <LayerItem
                key={l.id}
                layer={l}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            ) : null,
          )}

          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <BrushOverlay canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
          )}

          {activeTool === 'crop' && (
            <CropOverlay canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
          )}
        </div>
      </div>
    </div>
  )
}
