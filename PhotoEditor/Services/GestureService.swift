import CoreGraphics

enum GestureService {
    static let minZoom: CGFloat = 0.25
    static let maxZoom: CGFloat = 6.0

    // Multiplies the last committed zoom by the gesture delta, clamped.
    static func calculateZoom(current: CGFloat, delta: CGFloat) -> CGFloat {
        let next = current * delta
        return min(max(next, minZoom), maxZoom)
    }

    // Adds the gesture translation to the last committed offset.
    static func calculatePan(current: CGSize, delta: CGSize) -> CGSize {
        CGSize(width: current.width + delta.width, height: current.height + delta.height)
    }

    // Keeps the canvas from being dragged completely off-screen.
    static func clampPan(_ offset: CGSize, in container: CGSize, contentScale: CGFloat) -> CGSize {
        let maxX = (container.width * contentScale) / 2
        let maxY = (container.height * contentScale) / 2
        return CGSize(
            width: min(max(offset.width, -maxX), maxX),
            height: min(max(offset.height, -maxY), maxY)
        )
    }
}
