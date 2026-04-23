import Foundation

enum AdjustmentTab: String, CaseIterable, Identifiable {
    case light
    case color
    case effects
    case detail
    case optics
    case geometry

    var id: String { rawValue }

    var title: String { rawValue.capitalized }

    var systemIcon: String {
        switch self {
        case .light:    return "sun.max"
        case .color:    return "circle.lefthalf.filled"
        case .effects:  return "f.cursive"
        case .detail:   return "triangle"
        case .optics:   return "camera.aperture"
        case .geometry: return "square.grid.3x3"
        }
    }
}

enum AdjustmentType: String, CaseIterable, Identifiable {
    case exposure
    case contrast
    case highlights
    case shadows
    case saturation
    case temperature
    case tint
    case sharpness
    case vibrance

    var id: String { rawValue }

    var title: String { rawValue.capitalized }

    var range: ClosedRange<Float> {
        switch self {
        case .exposure:    return -2.0...2.0
        case .contrast:    return -100...100
        case .highlights:  return -100...100
        case .shadows:     return -100...100
        case .saturation:  return -100...100
        case .temperature: return -100...100
        case .tint:        return -100...100
        case .sharpness:   return 0...100
        case .vibrance:    return -100...100
        }
    }

    var defaultValue: Float { 0 }
}
