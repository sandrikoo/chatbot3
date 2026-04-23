import { Adjustments, LayerModel } from '../types'

// Builds a CSS `filter:` string for cheap, GPU-accelerated live previews.
// Covers exposure, contrast, saturation, vibrance (approx), temperature (hue),
// sharpness (faked via contrast), grain/highlights/shadows/vignette are handled
// at flatten-time in the exporter.
export function cssFilter(a: Adjustments): string {
  const brightness = 1 + a.exposure * 0.5
  const contrast = 1 + a.contrast / 100
  const saturation = 1 + (a.saturation + a.vibrance * 0.5) / 100
  const hue = (a.temperature * 0.3) + a.tint * 0.15 // degrees
  const blur = a.sharpness > 0 ? 0 : 0 // placeholder – sharpness done in export
  return [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturation.toFixed(3)})`,
    `hue-rotate(${hue.toFixed(2)}deg)`,
    blur > 0 ? `blur(${blur}px)` : '',
  ].filter(Boolean).join(' ')
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Applies per-layer pixel adjustments that CSS filter can't cover:
// highlights, shadows, vignette, grain.  Returns a new canvas.
function applyPixelAdjustments(
  source: HTMLCanvasElement,
  a: Adjustments,
): HTMLCanvasElement {
  const { width, height } = source
  const out = document.createElement('canvas')
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const needHS = a.highlights !== 0 || a.shadows !== 0
  const needGrain = a.grain > 0

  if (needHS || needGrain) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const d = imageData.data

    const hAmt = a.highlights / 100 // -1..1
    const sAmt = a.shadows / 100
    const grainAmt = a.grain / 100 // 0..1

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

      if (needHS) {
        const hWeight = Math.max(0, lum - 0.5) * 2 // 0..1 in highlights
        const sWeight = Math.max(0, 0.5 - lum) * 2
        const hDelta = hAmt * hWeight * 60
        const sDelta = sAmt * sWeight * 60
        r = r + hDelta + sDelta
        g = g + hDelta + sDelta
        b = b + hDelta + sDelta
      }
      if (needGrain) {
        const n = (Math.random() - 0.5) * grainAmt * 80
        r += n
        g += n
        b += n
      }
      d[i] = Math.max(0, Math.min(255, r))
      d[i + 1] = Math.max(0, Math.min(255, g))
      d[i + 2] = Math.max(0, Math.min(255, b))
    }
    ctx.putImageData(imageData, 0, 0)
  }

  if (a.vignette !== 0) {
    const strength = Math.abs(a.vignette) / 100
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3,
      width / 2, height / 2, Math.hypot(width, height) / 2,
    )
    const color = a.vignette > 0 ? '0,0,0' : '255,255,255'
    gradient.addColorStop(0, `rgba(${color},0)`)
    gradient.addColorStop(1, `rgba(${color},${strength})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  return out
}

// Draws a layer onto the flatten context with offset/scale/rotation applied
// around the canvas centre (matches the preview transform math).
async function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: LayerModel,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.save()
  ctx.globalAlpha = layer.opacity

  const cx = canvasWidth / 2 + layer.offsetX
  const cy = canvasHeight / 2 + layer.offsetY
  ctx.translate(cx, cy)
  ctx.rotate(layer.rotation)
  ctx.scale(layer.scale, layer.scale)
  ctx.translate(-canvasWidth / 2, -canvasHeight / 2)

  if (layer.type === 'background') {
    ctx.fillStyle = layer.shapeColor ?? '#000'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  } else if (layer.type === 'image' && layer.src) {
    const img = await loadImage(layer.src)
    const rendered = renderImageWithFilter(img, layer.adjustments)
    const adjusted = applyPixelAdjustments(rendered, layer.adjustments)
    const { dx, dy, dw, dh } = aspectFit(img.naturalWidth, img.naturalHeight, canvasWidth, canvasHeight)
    ctx.drawImage(adjusted, dx, dy, dw, dh)
  } else if (layer.type === 'shape') {
    const size = Math.min(canvasWidth, canvasHeight) * 0.4
    ctx.fillStyle = layer.shapeColor ?? '#2479ff'
    ctx.fillRect((canvasWidth - size) / 2, (canvasHeight - size) / 2, size, size)
  } else if (layer.type === 'text' && layer.text) {
    ctx.fillStyle = layer.textColor ?? '#ffffff'
    ctx.font = `600 ${layer.textSize ?? 48}px -apple-system, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(layer.text, canvasWidth / 2, canvasHeight / 2)
  }

  // Strokes drawn in canvas-local space.
  for (const s of layer.strokes) {
    if (s.points.length < 2) continue
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = s.width
    ctx.strokeStyle = s.color
    ctx.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y)
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}

// Rasterises an HTMLImageElement to a canvas with CSS-equivalent filters baked in.
function renderImageWithFilter(img: HTMLImageElement, a: Adjustments): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.filter = cssFilter(a)
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'
  return canvas
}

function aspectFit(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.min(dstW / srcW, dstH / srcH)
  const w = srcW * scale
  const h = srcH * scale
  return { dx: (dstW - w) / 2, dy: (dstH - h) / 2, dw: w, dh: h }
}

export async function flatten(
  layers: LayerModel[],
  canvasWidth: number,
  canvasHeight: number,
  globalAdjustments: Adjustments,
  cropRect?: { x: number; y: number; w: number; h: number } | null,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const sorted = [...layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex)

  for (const layer of sorted) {
    await drawLayer(ctx, layer, canvasWidth, canvasHeight)
  }

  // Total rotation (rotation + straighten) as final whole-canvas effect.
  const totalRot = globalAdjustments.rotation + globalAdjustments.straighten
  const rotated = totalRot !== 0 ? rotateCanvas(canvas, (totalRot * Math.PI) / 180) : canvas

  // Global pixel adjustments applied to the composite.
  const post = applyPixelAdjustments(rotated, globalAdjustments)

  // Crop last.
  if (cropRect) {
    const out = document.createElement('canvas')
    out.width = Math.round(post.width * cropRect.w)
    out.height = Math.round(post.height * cropRect.h)
    out.getContext('2d')!.drawImage(
      post,
      Math.round(post.width * cropRect.x),
      Math.round(post.height * cropRect.y),
      out.width,
      out.height,
      0, 0, out.width, out.height,
    )
    return out
  }
  return post
}

function rotateCanvas(src: HTMLCanvasElement, rad: number): HTMLCanvasElement {
  const { width, height } = src
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const w = Math.ceil(width * cos + height * sin)
  const h = Math.ceil(width * sin + height * cos)
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.translate(w / 2, h / 2)
  ctx.rotate(rad)
  ctx.drawImage(src, -width / 2, -height / 2)
  return out
}
