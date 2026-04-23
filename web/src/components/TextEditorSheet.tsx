import { useState, useEffect } from 'react'
import { useEditor } from '../store/editorStore'

interface Props {
  layerId: string
}

export function TextEditorSheet({ layerId }: Props) {
  const layer = useEditor((s) => s.layers.find((l) => l.id === layerId))
  const setLayerText = useEditor((s) => s.setLayerText)
  const setSheet = useEditor((s) => s.setSheet)

  const [draft, setDraft] = useState(layer?.text ?? '')

  useEffect(() => {
    setDraft(layer?.text ?? '')
  }, [layer?.text])

  if (!layer) return null

  const onSave = () => {
    setLayerText(layerId, draft)
    setSheet({ kind: 'none' })
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setSheet({ kind: 'none' })} className="text-white/70">
          Cancel
        </button>
        <h3 className="text-white font-semibold">Edit Text</h3>
        <button onClick={onSave} className="text-accent font-semibold">
          Save
        </button>
      </div>
      <textarea
        className="bg-panelHi rounded-lg p-3 text-white text-base min-h-[80px] outline-none"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter text"
        autoFocus
      />
      <div
        className="bg-bg rounded-lg p-4 min-h-[100px] text-center text-white flex items-center justify-center"
        style={{ fontSize: 36, fontWeight: 600 }}
      >
        {draft || <span className="text-white/30">Preview</span>}
      </div>
    </div>
  )
}
