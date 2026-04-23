import SwiftUI
import UIKit

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
    var zIndex: Int
    var adjustments: AdjustmentModel
    var thumbnail: UIImage?

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
        zIndex: Int = 0,
        adjustments: AdjustmentModel = .identity,
        thumbnail: UIImage? = nil
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
        self.zIndex = zIndex
        self.adjustments = adjustments
        self.thumbnail = thumbnail ?? image
    }

    static func == (lhs: LayerModel, rhs: LayerModel) -> Bool {
        lhs.id == rhs.id &&
        lhs.isVisible == rhs.isVisible &&
        lhs.isLocked == rhs.isLocked &&
        lhs.opacity == rhs.opacity &&
        lhs.zIndex == rhs.zIndex &&
        lhs.adjustments == rhs.adjustments &&
        lhs.text == rhs.text
    }
}
