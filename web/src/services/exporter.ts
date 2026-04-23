import { flatten } from './imageProcessor'
import { Adjustments, CropRect, LayerModel } from '../types'

export async function exportBlob(
  layers: LayerModel[],
  width: number,
  height: number,
  adjustments: Adjustments,
  cropRect: CropRect | null,
): Promise<Blob> {
  const canvas = await flatten(layers, width, height, adjustments, cropRect)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/png',
      1.0,
    ),
  )
}

// Shares via the Web Share API if available (required for Save to Photos on iOS),
// otherwise falls back to a download.  Returns the user-facing message.
export async function shareOrDownload(blob: Blob, filename = 'photo-editor.png'): Promise<string> {
  const file = new File([blob], filename, { type: blob.type })

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  const canShareFile =
    typeof nav !== 'undefined' &&
    typeof nav.canShare === 'function' &&
    nav.canShare({ files: [file] })

  if (canShareFile && typeof navigator.share === 'function') {
    try {
      await navigator.share({ files: [file], title: 'Photo Editor Export' })
      return 'Shared'
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return 'Cancelled'
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'Downloaded'
}
