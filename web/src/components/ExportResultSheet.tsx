import { CheckCircle2 } from 'lucide-react'
import { useEditor } from '../store/editorStore'

interface Props {
  message: string
}

export function ExportResultSheet({ message }: Props) {
  const setSheet = useEditor((s) => s.setSheet)
  return (
    <div className="p-8 flex flex-col items-center gap-3">
      <CheckCircle2 size={48} className="text-accent" />
      <p className="text-white font-semibold">{message}</p>
      <button
        onClick={() => setSheet({ kind: 'none' })}
        className="px-6 py-2 bg-accent text-white rounded-full font-semibold"
      >
        Done
      </button>
    </div>
  )
}
