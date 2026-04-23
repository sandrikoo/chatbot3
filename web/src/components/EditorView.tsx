import { useEffect } from 'react'
import { useEditor } from '../store/editorStore'
import { TopBar } from './TopBar'
import { CanvasView } from './CanvasView'
import { Toolbar } from './Toolbar'
import { LayersPanel } from './LayersPanel'
import { AdjustmentsPanel } from './AdjustmentsPanel'
import { BottomNavigationBar } from './BottomNavigationBar'
import { Sheet } from './Sheet'
import { ImagePicker } from './ImagePicker'
import { TextEditorSheet } from './TextEditorSheet'
import { AddLayerSheet } from './AddLayerSheet'
import { ExportResultSheet } from './ExportResultSheet'

export function EditorView() {
  const seed = useEditor((s) => s.seed)
  const showAdjustments = useEditor((s) => s.showAdjustmentsPanel)
  const sheet = useEditor((s) => s.sheet)
  const setSheet = useEditor((s) => s.setSheet)
  const isExporting = useEditor((s) => s.isExporting)
  const layers = useEditor((s) => s.layers)

  useEffect(() => {
    if (layers.length === 0) seed()
  }, [seed, layers.length])

  return (
    <div className="h-full w-full flex flex-col bg-bg text-white">
      <TopBar />

      <div className="flex-1 relative">
        <CanvasView />
        <div className="absolute inset-0 pointer-events-none flex items-start justify-between p-3">
          <div className="pointer-events-auto">
            <Toolbar />
          </div>
          <div className="pointer-events-auto">
            <LayersPanel />
          </div>
        </div>
      </div>

      {showAdjustments && <AdjustmentsPanel />}
      <BottomNavigationBar />

      {isExporting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="bg-panel border border-divider rounded-xl px-6 py-4 text-white">
            Exporting…
          </div>
        </div>
      )}

      <Sheet open={sheet.kind !== 'none'} onClose={() => setSheet({ kind: 'none' })}>
        {sheet.kind === 'imagePicker' && <ImagePicker />}
        {sheet.kind === 'textEditor' && <TextEditorSheet layerId={sheet.layerId} />}
        {sheet.kind === 'addLayer' && <AddLayerSheet />}
        {sheet.kind === 'exportResult' && <ExportResultSheet message={sheet.message} />}
      </Sheet>
    </div>
  )
}
