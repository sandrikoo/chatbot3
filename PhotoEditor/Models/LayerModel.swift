import SwiftUI
import UIKit
import PencilKit

enum LayerType: String {
    case image
    case text
    case shape
    case background
}

struct LayerModel: Identifiable, Equatable {
    let id: UUID
    var type: LayerType
    var name: String
    var image: UIImage?
    var text: String?
    var shapeColor: Color?
    var isVisible: Bool
    var isLocked: Bool
    var opacity: Float
    var transform: CGAffineTransform
    var offset: CGSize
    var scale: CGFloat
    var rotation: Angle
    var zIndex: Int
    var adjustments: AdjustmentModel
    var thumbnail: UIImage?
    var drawing: PKDrawing

    init(
        id: UUID = UUID(),
        type: LayerType,
        name: String,
        image: UIImage? = nil,
        text: String? = nil,
        shapeColor: Color? = nil,
        isVisible: Bool = true,
        isLocked: Bool = false,
        opacity: Float = 1.0,
        transform: CGAffineTransform = .identity,
        offset: CGSize = .zero,
        scale: CGFloat = 1.0,
        rotation: Angle = .zero,
        zIndex: Int = 0,
        adjustments: AdjustmentModel = .identity,
        thumbnail: UIImage? = nil,
        drawing: PKDrawing = PKDrawing()
    ) {
        self.id = id
        self.type = type
        self.name = name
        self.image = image
        self.text = text
        self.shapeColor = shapeColor
        self.isVisible = isVisible
        self.isLocked = isLocked
        self.opacity = opacity
        self.transform = transform
        self.offset = offset
        self.scale = scale
        self.rotation = rotation
        self.zIndex = zIndex
        self.adjustments = adjustments
        self.thumbnail = thumbnail ?? image
        self.drawing = drawing
    }

    static func == (lhs: LayerModel, rhs: LayerModel) -> Bool {
        lhs.id == rhs.id &&
        lhs.isVisible == rhs.isVisible &&
        lhs.isLocked == rhs.isLocked &&
        lhs.opacity == rhs.opacity &&
        lhs.zIndex == rhs.zIndex &&
        lhs.adjustments == rhs.adjustments &&
        lhs.text == rhs.text &&
        lhs.offset == rhs.offset &&
        lhs.scale == rhs.scale &&
        lhs.rotation == rhs.rotation &&
        lhs.drawing.dataRepresentation() == rhs.drawing.dataRepresentation()
    }
}
