import SwiftUI
import Combine
import UIKit
import PencilKit

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

enum ActiveSheet: Identifiable {
    case imagePicker
    case textEditor(UUID)
    case exportResult(String)

    var id: String {
        switch self {
        case .imagePicker: return "picker"
        case .textEditor(let id): return "text-\(id)"
        case .exportResult(let msg): return "export-\(msg)"
        }
    }
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
    @Published var activeSheet: ActiveSheet?
    @Published var cropRect: CGRect? = nil
    @Published var isExporting: Bool = false
    @Published var brushColor: Color = .white
    @Published var brushWidth: CGFloat = 8

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

    func exportImage(canvasSize: CGSize = CGSize(width: 1200, height: 1600)) -> UIImage {
        let flattened = processor.mergeLayers(layers: layers, canvasSize: canvasSize)
        return processor.applyFilters(image: flattened, adjustments: adjustments.adjustments)
    }

    func exportToPhotos() {
        Task { @MainActor in
            isExporting = true
            defer { isExporting = false }
            let image = exportImage()
            do {
                try await PhotoExporter.shared.save(image)
                activeSheet = .exportResult("Saved to Photos")
            } catch {
                activeSheet = .exportResult(error.localizedDescription)
            }
        }
    }

    func applyAdjustment(type: AdjustmentType, value: Float) {
        adjustments.adjustments.set(value, for: type)
        guard let id = activeLayerId,
              let idx = layers.firstIndex(where: { $0.id == id }),
              !layers[idx].isLocked else { return }
        layers[idx].adjustments.set(value, for: type)
    }

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
        switch type {
        case .image:
            activeSheet = .imagePicker
            return
        case .text:
            saveStateToHistory()
            let zIndex = (layers.map(\.zIndex).max() ?? 0) + 1
            let layer = LayerModel(type: .text, name: "Text \(zIndex)",
                                   text: "Tap to edit", zIndex: zIndex)
            layers.append(layer)
            activeLayerId = layer.id
            activeSheet = .textEditor(layer.id)
        case .shape:
            saveStateToHistory()
            let zIndex = (layers.map(\.zIndex).max() ?? 0) + 1
            let placeholder = solidImage(color: .systemBlue, size: CGSize(width: 400, height: 400))
            let layer = LayerModel(type: .shape, name: "Shape \(zIndex)",
                                   image: placeholder, shapeColor: .blue, zIndex: zIndex,
                                   thumbnail: processor.generateThumbnail(from: placeholder))
            layers.append(layer)
            activeLayerId = layer.id
        case .background:
            return
        }
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

    func updateLayerText(id: UUID, text: String) {
        guard let idx = layers.firstIndex(where: { $0.id == id }) else { return }
        saveStateToHistory()
        layers[idx].text = text
        layers[idx].name = text.isEmpty ? "Text" : String(text.prefix(16))
    }

    func updateLayerOffset(id: UUID, offset: CGSize) {
        guard let idx = layers.firstIndex(where: { $0.id == id }), !layers[idx].isLocked else { return }
        layers[idx].offset = offset
    }

    func updateLayerScale(id: UUID, scale: CGFloat) {
        guard let idx = layers.firstIndex(where: { $0.id == id }), !layers[idx].isLocked else { return }
        layers[idx].scale = max(0.1, min(scale, 5.0))
    }

    func updateLayerRotation(id: UUID, angle: Angle) {
        guard let idx = layers.firstIndex(where: { $0.id == id }), !layers[idx].isLocked else { return }
        layers[idx].rotation = angle
    }

    func updateLayerDrawing(id: UUID, drawing: PKDrawing) {
        guard let idx = layers.firstIndex(where: { $0.id == id }), !layers[idx].isLocked else { return }
        layers[idx].drawing = drawing
    }

    func commitLayerTransform() {
        saveStateToHistory()
    }

    func applyCrop(rect: CGRect, containerSize: CGSize) {
        guard let id = activeLayerId,
              let idx = layers.firstIndex(where: { $0.id == id }),
              let img = layers[idx].image else { return }
        saveStateToHistory()
        let scaleX = img.size.width / containerSize.width
        let scaleY = img.size.height / containerSize.height
        let cropped = CGRect(
            x: rect.origin.x * scaleX,
            y: rect.origin.y * scaleY,
            width: rect.width * scaleX,
            height: rect.height * scaleY
        )
        if let cg = img.cgImage?.cropping(to: cropped) {
            let newImg = UIImage(cgImage: cg, scale: img.scale, orientation: img.imageOrientation)
            layers[idx].image = newImg
            layers[idx].thumbnail = processor.generateThumbnail(from: newImg)
        }
        cropRect = nil
        currentTool = .select
    }

    // MARK: Tools

    func selectTool(_ tool: ToolType) {
        currentTool = tool
        if tool == .crop, let img = activeLayer?.image {
            _ = img
            cropRect = CGRect(x: 0.1, y: 0.1, width: 0.8, height: 0.8)
        }
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
