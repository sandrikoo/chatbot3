import { ReactNode, useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full bg-panel rounded-t-2xl safe-bottom max-h-[85vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mt-2" />
        {children}
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
