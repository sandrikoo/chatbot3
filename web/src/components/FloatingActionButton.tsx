import { Plus } from 'lucide-react'
import { useEditor } from '../store/editorStore'

export function FloatingActionButton() {
  const setSheet = useEditor((s) => s.setSheet)
  return (
    <button
      onClick={() => setSheet({ kind: 'addLayer' })}
      className="w-14 h-14 rounded-full bg-accent text-white grid place-items-center shadow-[0_6px_16px_rgba(36,121,255,0.5)] -translate-y-2"
      aria-label="Add layer"
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  )
}
