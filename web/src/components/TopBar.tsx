import {
  Home,
  Cloud,
  MoreHorizontal,
  Undo2,
  Redo2,
  Wand2,
  Crop,
  Share2,
  Layers,
} from 'lucide-react'
import { useEditor } from '../store/editorStore'
import { exportBlob, shareOrDownload } from '../services/exporter'

export function TopBar() {
  const newProject = useEditor((s) => s.newProject)
  const undo = useEditor((s) => s.undo)
  const redo = useEditor((s) => s.redoAction)
  const canUndo = useEditor((s) => s.canUndo())
  const canRedo = useEditor((s) => s.canRedo())
  const applyAuto = useEditor((s) => s.applyAuto)
  const setTool = useEditor((s) => s.setActiveTool)
  const toggleAdjustments = useEditor((s) => s.toggleAdjustmentsPanel)
  const isExporting = useEditor((s) => s.isExporting)
  const setExporting = useEditor((s) => s.setExporting)
  const setSheet = useEditor((s) => s.setSheet)

  const handleExport = async () => {
    const s = useEditor.getState()
    try {
      setExporting(true)
      const blob = await exportBlob(
        s.layers,
        s.canvasWidth,
        s.canvasHeight,
        s.adjustments,
        s.cropRect,
      )
      const message = await shareOrDownload(blob)
      setSheet({ kind: 'exportResult', message })
    } catch (err) {
      setSheet({
        kind: 'exportResult',
        message: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="safe-top bg-bg">
      <div className="flex items-center justify-between px-4 pt-2">
        <button onClick={newProject} className="text-white/90 p-2">
          <Home size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-white font-semibold">
          <span className="text-[17px]">Photo Editor</span>
          <Cloud size={14} className="text-white/60" />
        </div>
        <button className="text-white/90 p-2">
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 py-2">
        <IconButton onClick={undo} disabled={!canUndo}>
          <Undo2 size={18} />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo}>
          <Redo2 size={18} />
        </IconButton>
        <div className="w-px h-4 bg-divider" />
        <IconButton onClick={applyAuto}>
          <Wand2 size={18} />
        </IconButton>
        <IconButton onClick={() => setTool('crop')}>
          <Crop size={18} />
        </IconButton>
        <IconButton onClick={handleExport} disabled={isExporting}>
          <Share2 size={18} />
        </IconButton>
        <IconButton onClick={toggleAdjustments}>
          <Layers size={18} />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-white p-1.5 ${disabled ? 'opacity-30' : 'hover:text-white'}`}
    >
      {children}
    </button>
  )
}
