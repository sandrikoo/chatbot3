import Foundation

struct AdjustmentModel: Equatable {
    var exposure: Float = 0
    var contrast: Float = 0
    var highlights: Float = 0
    var shadows: Float = 0
    var saturation: Float = 0
    var temperature: Float = 0
    var tint: Float = 0
    var sharpness: Float = 0
    var vibrance: Float = 0

    static let identity = AdjustmentModel()

    func value(for type: AdjustmentType) -> Float {
        switch type {
        case .exposure:    return exposure
        case .contrast:    return contrast
        case .highlights:  return highlights
        case .shadows:     return shadows
        case .saturation:  return saturation
        case .temperature: return temperature
        case .tint:        return tint
        case .sharpness:   return sharpness
        case .vibrance:    return vibrance
        }
    }

    mutating func set(_ value: Float, for type: AdjustmentType) {
        switch type {
        case .exposure:    exposure = value
        case .contrast:    contrast = value
        case .highlights:  highlights = value
        case .shadows:     shadows = value
        case .saturation:  saturation = value
        case .temperature: temperature = value
        case .tint:        tint = value
        case .sharpness:   sharpness = value
        case .vibrance:    vibrance = value
        }
    }
}

struct AdjustmentState: Equatable {
    var adjustments: AdjustmentModel = .identity
    var activeTab: AdjustmentTab = .light

    static let identity = AdjustmentState()
}
