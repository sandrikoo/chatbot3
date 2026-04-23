import { Copy, Eye, EyeOff, Lock, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { LayerModel } from '../types'

export function LayersPanel() {
  const layers = useEditor((s) => s.layers)
  const activeId = useEditor((s) => s.activeLayerId)
  const selectLayer = useEditor((s) => s.selectLayer)
  const toggleVisibility = useEditor((s) => s.toggleVisibility)
  const toggleLock = useEditor((s) => s.toggleLock)
  const deleteLayer = useEditor((s) => s.deleteLayer)
  const duplicateLayer = useEditor((s) => s.duplicateLayer)
  const setSheet = useEditor((s) => s.setSheet)

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="w-[108px] bg-panel/90 backdrop-blur rounded-2xl border border-divider flex flex-col gap-2 p-2 shadow-lg">
      <button
        onClick={() => setSheet({ kind: 'addLayer' })}
        className="w-9 h-9 mx-auto rounded-lg bg-panelHi grid place-items-center text-white"
      >
        <Plus size={14} />
      </button>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2">
        {sorted.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeId}
            onSelect={() => selectLayer(layer.id)}
            onToggleVis={() => toggleVisibility(layer.id)}
            onToggleLock={() => toggleLock(layer.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-around pt-1 border-t border-divider">
        <button
          onClick={() => activeId && duplicateLayer(activeId)}
          className="text-white/70 hover:text-white w-9 h-9 grid place-items-center rounded-md bg-panelHi"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => activeId && deleteLayer(activeId)}
          className="text-white/70 hover:text-red-400 w-9 h-9 grid place-items-center rounded-md bg-panelHi"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

interface RowProps {
  layer: LayerModel
  isActive: boolean
  onSelect: () => void
  onToggleVis: () => void
  onToggleLock: () => void
}

function LayerRow({ layer, isActive, onSelect, onToggleVis, onToggleLock }: RowProps) {
  return (
    <div
      className="flex items-center gap-1.5 cursor-pointer"
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          layer.locked ? onToggleLock() : onToggleVis()
        }}
        className="text-white/70 w-4 grid place-items-center"
      >
        {layer.locked ? <Lock size={12} /> : layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
      <div
        className="w-12 h-12 rounded-md overflow-hidden shrink-0 grid place-items-center relative"
        style={{
          outline: isActive ? '2px solid #2479ff' : 'none',
          background: layer.type === 'text' ? '#262a31' : layer.shapeColor ?? '#262a31',
        }}
      >
        {layer.type === 'image' && layer.src && (
          <img src={layer.src} alt="" className="w-full h-full object-cover" />
        )}
        {layer.type === 'text' && (
          <span className="text-white font-bold">T</span>
        )}
        {layer.type === 'shape' && (
          <div className="w-full h-full" style={{ background: layer.shapeColor }} />
        )}
      </div>
      <MoreHorizontal size={11} className="text-white/70" />
    </div>
  )
}
