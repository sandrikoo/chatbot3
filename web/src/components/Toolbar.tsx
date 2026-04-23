import {
  MousePointer2,
  SquareDashed,
  Paintbrush,
  Eraser,
  Lasso,
  PenTool,
  Stamp,
  Pencil,
  Type,
  Square,
  Image as ImageIcon,
  Contrast,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { ToolType } from '../types'

const TOOLS: Array<{ id: ToolType; Icon: LucideIcon }> = [
  { id: 'select', Icon: MousePointer2 },
  { id: 'marquee', Icon: SquareDashed },
  { id: 'brush', Icon: Paintbrush },
  { id: 'eraser', Icon: Eraser },
  { id: 'lasso', Icon: Lasso },
  { id: 'pen', Icon: PenTool },
  { id: 'stamp', Icon: Stamp },
  { id: 'pencil', Icon: Pencil },
  { id: 'text', Icon: Type },
  { id: 'shape', Icon: Square },
  { id: 'image', Icon: ImageIcon },
  { id: 'adjust', Icon: Contrast },
]

export function Toolbar() {
  const activeTool = useEditor((s) => s.activeTool)
  const setTool = useEditor((s) => s.setActiveTool)
  const setSheet = useEditor((s) => s.setSheet)
  const addTextLayer = useEditor((s) => s.addTextLayer)
  const addShapeLayer = useEditor((s) => s.addShapeLayer)

  const onSelect = (t: ToolType) => {
    setTool(t)
    if (t === 'image') setSheet({ kind: 'imagePicker' })
    if (t === 'text') addTextLayer()
    if (t === 'shape') addShapeLayer()
  }

  return (
    <div className="w-[52px] bg-panel/90 backdrop-blur rounded-2xl border border-divider flex flex-col items-center gap-3 py-3 shadow-lg">
      {TOOLS.map(({ id, Icon }) => {
        const isActive = activeTool === id
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`w-9 h-9 rounded-lg grid place-items-center transition-colors ${
              isActive ? 'bg-accent text-white' : 'text-white/70 hover:text-white'
            }`}
            aria-label={id}
          >
            <Icon size={16} />
          </button>
        )
      })}
      <MoreHorizontal size={14} className="text-white/70 mt-1" />
      <div className="flex-1" />
      <div className="relative w-8 h-8">
        <div className="absolute right-0 bottom-0 w-5 h-5 rounded bg-white" />
        <div className="absolute left-0 top-0 w-5 h-5 rounded bg-black border border-white/50" />
      </div>
    </div>
  )
}
