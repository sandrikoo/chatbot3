import SwiftUI
import Combine
import UIKit

struct EditorState: Equatable {
    var layers: [LayerModel]
    var activeLayerId: UUID?
    var adjustments: AdjustmentState
}

enum AppTab: String, CaseIterable, Identifiable {
    case discover, learn, files, more
    var id: String { rawValue }

    var icon: String {
        switch self {
        case .discover: return "globe"
        case .learn:    return "lightbulb"
        case .files:    return "folder"
        case .more:     return "line.3.horizontal"
        }
    }

    var title: String { rawValue.capitalized }
}

@MainActor
final class EditorViewModel: ObservableObject {
    @Published var layers: [LayerModel] = []
    @Published var activeLayerId: UUID?
    @Published var adjustments: AdjustmentState = .identity
    @Published var currentTool: ToolType = .select
    @Published var currentAppTab: AppTab = .files
    @Published var canvasZoom: CGFloat = 1.0
    @Published var canvasOffset: CGSize = .zero
    @Published var showAddLayerMenu: Bool = false
    @Published var showAdjustmentsPanel: Bool = true

    private(set) var historyStack: [EditorState] = []
    private(set) var redoStack: [EditorState] = []

    private let processor = ImageProcessingService.shared
    private var isRestoring = false

    init() {
        seedDemoProject()
    }

    var activeLayer: LayerModel? {
        guard let id = activeLayerId else { return nil }
        return layers.first { $0.id == id }
    }

    // Builds a demo layer stack so the UI has something to render on launch.
    private func seedDemoProject() {
        let size = CGSize(width: 1200, height: 1600)
        let background = solidImage(color: .black, size: size)
        let layer = LayerModel(
            type: .background,
            name: "Background",
            image: background,
            isLocked: true,
            zIndex: 0,
            thumbnail: processor.generateThumbnail(from: background)
        )
        layers = [layer]
        activeLayerId = layer.id
        saveStateToHistory()
    }

    // Creates a new layer from a UIImage and makes it active.
    func importImage(image: UIImage, name: String = "Image") {
        saveStateToHistory()
        let zIndex = (layers.map(\.zIndex).max() ?? 0) + 1
        let layer = LayerModel(
            type: .image,
            name: name,
            image: image,
            zIndex: zIndex,
            thumbnail: processor.generateThumbnail(from: image)
        )
        layers.append(layer)
        activeLayerId = layer.id
    }

    // Flattens all visible layers and applies global adjustments.
    func exportImage(canvasSize: CGSize = CGSize(width: 1200, height: 1600)) -> UIImage {
        let flattened = processor.mergeLayers(layers: layers, canvasSize: canvasSize)
        return processor.applyFilters(image: flattened, adjustments: adjustments.adjustments)
    }

    // Updates the adjustment state and forwards to the active layer for live preview.
    func applyAdjustment(type: AdjustmentType, value: Float) {
        adjustments.adjustments.set(value, for: type)
        guard let id = activeLayerId,
              let idx = layers.firstIndex(where: { $0.id == id }),
              !layers[idx].isLocked else { return }
        layers[idx].adjustments.set(value, for: type)
    }

    // Persists the current adjustment slider values into history.
    func commitAdjustment() {
        saveStateToHistory()
    }

    func resetAdjustment(type: AdjustmentType) {
        applyAdjustment(type: type, value: type.defaultValue)
    }

    func applyAutoAdjustments() {
        saveStateToHistory()
        adjustments.adjustments.exposure = 0.35
        adjustments.adjustments.contrast = 12
        adjustments.adjustments.highlights = -28
        adjustments.adjustments.shadows = 18
        adjustments.adjustments.vibrance = 15
        if let id = activeLayerId,
           let idx = layers.firstIndex(where: { $0.id == id }),
           !layers[idx].isLocked {
            layers[idx].adjustments = adjustments.adjustments
        }
    }

    func switchTab(_ tab: AdjustmentTab) {
        adjustments.activeTab = tab
    }

    // MARK: Layers

    func addLayer(type: LayerType) {
        saveStateToHistory()
        let zIndex = (layers.map(\.zIndex).max() ?? 0) + 1
        let layer: LayerModel
        switch type {
        case .image:
            let placeholder = solidImage(color: .gray, size: CGSize(width: 600, height: 600))
            layer = LayerModel(type: .image, name: "Image \(zIndex)",
                               image: placeholder, zIndex: zIndex,
                               thumbnail: processor.generateThumbnail(from: placeholder))
        case .text:
            layer = LayerModel(type: .text, name: "Text \(zIndex)",
                               text: "Double tap to edit", zIndex: zIndex)
        case .shape:
            let placeholder = solidImage(color: .systemBlue, size: CGSize(width: 400, height: 400))
            layer = LayerModel(type: .shape, name: "Shape \(zIndex)",
                               image: placeholder, shapeColor: .blue, zIndex: zIndex,
                               thumbnail: processor.generateThumbnail(from: placeholder))
        case .background:
            return
        }
        layers.append(layer)
        activeLayerId = layer.id
    }

    func deleteLayer(layerId: UUID) {
        guard let layer = layers.first(where: { $0.id == layerId }), !layer.isLocked else { return }
        saveStateToHistory()
        layers.removeAll { $0.id == layerId }
        if activeLayerId == layerId {
            activeLayerId = layers.last?.id
        }
    }

    func toggleVisibility(layerId: UUID) {
        guard let idx = layers.firstIndex(where: { $0.id == layerId }) else { return }
        layers[idx].isVisible.toggle()
    }

    func lockLayer(layerId: UUID) {
        guard let idx = layers.firstIndex(where: { $0.id == layerId }) else { return }
        layers[idx].isLocked.toggle()
    }

    func reorderLayers(from source: Int, to destination: Int) {
        guard layers.indices.contains(source) else { return }
        saveStateToHistory()
        let layer = layers.remove(at: source)
        let clamped = min(max(destination, 0), layers.count)
        layers.insert(layer, at: clamped)
        for (i, _) in layers.enumerated() { layers[i].zIndex = i }
    }

    func selectLayer(layerId: UUID) {
        activeLayerId = layerId
        if let layer = layers.first(where: { $0.id == layerId }) {
            adjustments.adjustments = layer.adjustments
        }
    }

    func duplicateActiveLayer() {
        guard let layer = activeLayer else { return }
        saveStateToHistory()
        let copy = LayerModel(
            type: layer.type,
            name: "\(layer.name) copy",
            image: layer.image,
            text: layer.text,
            shapeColor: layer.shapeColor,
            isVisible: layer.isVisible,
            isLocked: false,
            opacity: layer.opacity,
            transform: layer.transform,
            zIndex: (layers.map(\.zIndex).max() ?? 0) + 1,
            adjustments: layer.adjustments,
            thumbnail: layer.thumbnail
        )
        layers.append(copy)
        activeLayerId = copy.id
    }

    // MARK: Tools

    func selectTool(_ tool: ToolType) {
        currentTool = tool
    }

    // MARK: History

    func saveStateToHistory() {
        guard !isRestoring else { return }
        let snapshot = EditorState(layers: layers, activeLayerId: activeLayerId, adjustments: adjustments)
        historyStack.append(snapshot)
        if historyStack.count > 50 { historyStack.removeFirst() }
        redoStack.removeAll()
    }

    func undo() {
        guard let previous = historyStack.popLast() else { return }
        let current = EditorState(layers: layers, activeLayerId: activeLayerId, adjustments: adjustments)
        redoStack.append(current)
        restore(previous)
    }

    func redo() {
        guard let next = redoStack.popLast() else { return }
        let current = EditorState(layers: layers, activeLayerId: activeLayerId, adjustments: adjustments)
        historyStack.append(current)
        restore(next)
    }

    var canUndo: Bool { !historyStack.isEmpty }
    var canRedo: Bool { !redoStack.isEmpty }

    private func restore(_ state: EditorState) {
        isRestoring = true
        layers = state.layers
        activeLayerId = state.activeLayerId
        adjustments = state.adjustments
        isRestoring = false
    }

    // MARK: Canvas gestures

    func handlePinch(scale: CGFloat) {
        canvasZoom = GestureService.calculateZoom(current: canvasZoom, delta: scale)
    }

    func handlePan(offset: CGSize) {
        canvasOffset = offset
    }

    func resetCanvasTransform() {
        withAnimation(.easeInOut(duration: 0.2)) {
            canvasZoom = 1.0
            canvasOffset = .zero
        }
    }

    // MARK: Navigation

    func navigateTo(_ tab: AppTab) {
        currentAppTab = tab
    }

    func openNewProject() {
        historyStack.removeAll()
        redoStack.removeAll()
        layers.removeAll()
        adjustments = .identity
        canvasZoom = 1.0
        canvasOffset = .zero
        seedDemoProject()
    }

    // MARK: Helpers

    private func solidImage(color: UIColor, size: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            color.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
        }
    }
}
