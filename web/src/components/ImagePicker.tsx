import { ChangeEvent, useRef, useEffect } from 'react'
import { useEditor } from '../store/editorStore'

export function ImagePicker() {
  const addImageLayer = useEditor((s) => s.addImageLayer)
  const setSheet = useEditor((s) => s.setSheet)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.click()
  }, [])

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSheet({ kind: 'none' })
      return
    }
    const url = URL.createObjectURL(file)
    const { width, height } = await readImageSize(url)
    addImageLayer(url, width, height)
  }

  const onCancel = () => setSheet({ kind: 'none' })

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <p className="text-white/70 text-sm">Opening picker…</p>
      <button
        onClick={() => input.current?.click()}
        className="px-6 py-2 bg-accent text-white rounded-full font-semibold"
      >
        Choose Image
      </button>
      <button onClick={onCancel} className="text-white/60 text-sm">
        Cancel
      </button>
    </div>
  )
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = url
  })
}
