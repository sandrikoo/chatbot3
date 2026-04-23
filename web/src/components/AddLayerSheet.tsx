import { Image as ImageIcon, Type, Square } from 'lucide-react'
import { useEditor } from '../store/editorStore'

export function AddLayerSheet() {
  const setSheet = useEditor((s) => s.setSheet)
  const addTextLayer = useEditor((s) => s.addTextLayer)
  const addShapeLayer = useEditor((s) => s.addShapeLayer)

  const items = [
    {
      label: 'Image',
      desc: 'Import a photo from your device',
      Icon: ImageIcon,
      onClick: () => setSheet({ kind: 'imagePicker' }),
    },
    {
      label: 'Text',
      desc: 'Add a text layer',
      Icon: Type,
      onClick: () => addTextLayer(),
    },
    {
      label: 'Shape',
      desc: 'Add a filled shape',
      Icon: Square,
      onClick: () => {
        addShapeLayer()
        setSheet({ kind: 'none' })
      },
    },
  ]

  return (
    <div className="p-5 flex flex-col gap-2">
      <h3 className="text-white font-semibold text-center mb-2">Add Layer</h3>
      {items.map(({ label, desc, Icon, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className="flex items-center gap-3 bg-panelHi rounded-xl p-4 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/20 grid place-items-center text-accent">
            <Icon size={18} />
          </div>
          <div>
            <div className="text-white font-semibold">{label}</div>
            <div className="text-white/60 text-xs">{desc}</div>
          </div>
        </button>
      ))}
      <button
        onClick={() => setSheet({ kind: 'none' })}
        className="text-white/60 text-sm py-3 mt-1"
      >
        Cancel
      </button>
    </div>
  )
}
