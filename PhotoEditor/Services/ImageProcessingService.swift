import UIKit
import CoreImage
import CoreImage.CIFilterBuiltins

final class ImageProcessingService {
    static let shared = ImageProcessingService()

    private let context: CIContext

    private init() {
        self.context = CIContext(options: [.useSoftwareRenderer: false])
    }

    // Chains CoreImage filters based on the adjustment model.
    // Non-destructive: caller retains the original image.
    func applyFilters(image: UIImage, adjustments: AdjustmentModel) -> UIImage {
        guard let cgInput = image.cgImage else { return image }
        var ciImage = CIImage(cgImage: cgInput)

        if adjustments.exposure != 0 {
            let f = CIFilter.exposureAdjust()
            f.inputImage = ciImage
            f.ev = adjustments.exposure
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.contrast != 0 || adjustments.saturation != 0 {
            let f = CIFilter.colorControls()
            f.inputImage = ciImage
            f.contrast = 1.0 + (adjustments.contrast / 100.0)
            f.saturation = 1.0 + (adjustments.saturation / 100.0)
            f.brightness = 0
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.highlights != 0 || adjustments.shadows != 0 {
            let f = CIFilter.highlightShadowAdjust()
            f.inputImage = ciImage
            f.highlightAmount = 1.0 - (adjustments.highlights / 200.0)
            f.shadowAmount = adjustments.shadows / 100.0
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.temperature != 0 || adjustments.tint != 0 {
            let f = CIFilter.temperatureAndTint()
            f.inputImage = ciImage
            let neutralK: CGFloat = 6500
            let deltaK = CGFloat(adjustments.temperature) * 30
            f.neutral = CIVector(x: neutralK + deltaK, y: CGFloat(adjustments.tint))
            f.targetNeutral = CIVector(x: neutralK, y: 0)
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.sharpness > 0 {
            let f = CIFilter.sharpenLuminance()
            f.inputImage = ciImage
            f.sharpness = adjustments.sharpness / 100.0
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.vibrance != 0 {
            let f = CIFilter.vibrance()
            f.inputImage = ciImage
            f.amount = adjustments.vibrance / 100.0
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.vignette != 0 {
            let f = CIFilter.vignette()
            f.inputImage = ciImage
            f.intensity = adjustments.vignette / 50.0
            f.radius = 2.0
            if let out = f.outputImage { ciImage = out }
        }

        if adjustments.grain > 0 {
            let noise = CIFilter.randomGenerator()
            if let noiseImg = noise.outputImage {
                let grayscale = CIFilter.colorMatrix()
                grayscale.inputImage = noiseImg.cropped(to: ciImage.extent)
                let amt = CGFloat(adjustments.grain / 100.0)
                grayscale.rVector = CIVector(x: amt, y: 0, z: 0, w: 0)
                grayscale.gVector = CIVector(x: 0, y: amt, z: 0, w: 0)
                grayscale.bVector = CIVector(x: 0, y: 0, z: amt, w: 0)
                grayscale.aVector = CIVector(x: 0, y: 0, z: 0, w: amt * 0.6)
                if let grain = grayscale.outputImage {
                    let composite = CIFilter.sourceOverCompositing()
                    composite.inputImage = grain
                    composite.backgroundImage = ciImage
                    if let out = composite.outputImage {
                        ciImage = out.cropped(to: ciImage.extent)
                    }
                }
            }
        }

        let totalRotation = adjustments.rotation + adjustments.straighten
        if totalRotation != 0 {
            let radians = CGFloat(totalRotation) * .pi / 180
            let transform = CGAffineTransform(rotationAngle: radians)
            ciImage = ciImage.transformed(by: transform)
        }

        guard let cgOutput = context.createCGImage(ciImage, from: ciImage.extent) else {
            return image
        }
        return UIImage(cgImage: cgOutput, scale: image.scale, orientation: image.imageOrientation)
    }

    // Renders visible layers in zIndex order into a single flattened image.
    func mergeLayers(layers: [LayerModel], canvasSize: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: canvasSize)
        return renderer.image { ctx in
            UIColor.black.setFill()
            ctx.fill(CGRect(origin: .zero, size: canvasSize))

            for layer in layers.filter(\.isVisible).sorted(by: { $0.zIndex < $1.zIndex }) {
                ctx.cgContext.saveGState()
                ctx.cgContext.setAlpha(CGFloat(layer.opacity))

                let center = CGPoint(x: canvasSize.width / 2, y: canvasSize.height / 2)
                ctx.cgContext.translateBy(x: center.x + layer.offset.width,
                                          y: center.y + layer.offset.height)
                ctx.cgContext.rotate(by: CGFloat(layer.rotation.radians))
                ctx.cgContext.scaleBy(x: layer.scale, y: layer.scale)
                ctx.cgContext.translateBy(x: -center.x, y: -center.y)
                ctx.cgContext.concatenate(layer.transform)

                if let img = layer.image {
                    let processed = applyFilters(image: img, adjustments: layer.adjustments)
                    let target = aspectFit(imageSize: processed.size, in: canvasSize)
                    processed.draw(in: target)
                }

                if let text = layer.text, !text.isEmpty, layer.type == .text {
                    let attrs: [NSAttributedString.Key: Any] = [
                        .font: UIFont.systemFont(ofSize: 72, weight: .semibold),
                        .foregroundColor: UIColor.white
                    ]
                    let string = NSAttributedString(string: text, attributes: attrs)
                    let size = string.size()
                    let origin = CGPoint(x: (canvasSize.width - size.width) / 2,
                                         y: (canvasSize.height - size.height) / 2)
                    string.draw(at: origin)
                }

                if !layer.drawing.bounds.isEmpty {
                    let bounds = CGRect(origin: .zero, size: canvasSize)
                    let drawingImage = layer.drawing.image(from: bounds, scale: 1.0)
                    drawingImage.draw(in: bounds)
                }

                ctx.cgContext.restoreGState()
            }
        }
    }

    func generateThumbnail(from image: UIImage, maxSize: CGFloat = 128) -> UIImage {
        let ratio = min(maxSize / image.size.width, maxSize / image.size.height, 1)
        let size = CGSize(width: image.size.width * ratio, height: image.size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    private func aspectFit(imageSize: CGSize, in canvas: CGSize) -> CGRect {
        let scale = min(canvas.width / imageSize.width, canvas.height / imageSize.height)
        let size = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        let origin = CGPoint(
            x: (canvas.width - size.width) / 2,
            y: (canvas.height - size.height) / 2
        )
        return CGRect(origin: origin, size: size)
    }
}
