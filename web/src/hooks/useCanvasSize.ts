import { useEffect, useState } from 'react'

export function useElementSize<T extends HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setSize({ width: cr.width, height: cr.height })
    })
    ro.observe(ref)
    return () => ro.disconnect()
  }, [ref])

  return { ref: setRef, size }
}
