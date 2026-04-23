import Foundation

enum ToolType: String, CaseIterable, Identifiable {
    case select
    case marquee
    case brush
    case eraser
    case lasso
    case pen
    case stamp
    case pencil
    case text
    case shape
    case image
    case adjust
    case crop

    var id: String { rawValue }

    var systemIcon: String {
        switch self {
        case .select:   return "cursorarrow"
        case .marquee:  return "dashed.rectangle"
        case .brush:    return "paintbrush"
        case .eraser:   return "eraser"
        case .lasso:    return "lasso"
        case .pen:      return "pencil.tip"
        case .stamp:    return "circle.dashed"
        case .pencil:   return "pencil"
        case .text:     return "textformat"
        case .shape:    return "rectangle"
        case .image:    return "photo"
        case .adjust:   return "circle.lefthalf.filled"
        case .crop:     return "crop"
        }
    }
}
