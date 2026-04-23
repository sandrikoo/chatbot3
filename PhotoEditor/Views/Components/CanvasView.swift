import SwiftUI
import PencilKit

struct CanvasView: View {
    @EnvironmentObject var vm: EditorViewModel

    @GestureState private var pinchDelta: CGFloat = 1.0
    @GestureState private var panDelta: CGSize = .zero

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                Palette.background

                ZStack {
                    renderLayers(in: proxy.size)
                    if vm.currentTool == .brush || vm.currentTool == .eraser,
                       let id = vm.activeLayerId {
                        BrushOverlay(layerId: id)
                            .allowsHitTesting(true)
                    }
                    if vm.currentTool == .crop, vm.cropRect != nil {
                        CropOverlay(containerSize: proxy.size)
                    }
                }
                .scaleEffect(vm.canvasZoom * pinchDelta)
                .offset(
                    x: vm.canvasOffset.width + panDelta.width,
                    y: vm.canvasOffset.height + panDelta.height
                )
                .gesture(canvasGesture(size: proxy.size), including: canvasGestureMask)
                .onTapGesture(count: 2) { vm.resetCanvasTransform() }
            }
            .clipped()
        }
    }

    private var canvasGestureMask: GestureMask {
        switch vm.currentTool {
        case .brush, .eraser, .crop: return .subviews
        default: return .all
        }
    }

    private func canvasGesture(size: CGSize) -> some Gesture {
        SimultaneousGesture(
            MagnificationGesture()
                .updating($pinchDelta) { value, state, _ in state = value }
                .onEnded { value in vm.handlePinch(scale: value) },
            DragGesture()
                .updating($panDelta) { value, state, _ in state = value.translation }
                .onEnded { value in
                    let next = GestureService.calculatePan(
                        current: vm.canvasOffset,
                        delta: value.translation
                    )
                    vm.handlePan(offset: GestureService.clampPan(
                        next, in: size, contentScale: vm.canvasZoom
                    ))
                }
        )
    }

    @ViewBuilder
    private func renderLayers(in size: CGSize) -> some View {
        ZStack {
            ForEach(vm.layers.filter(\.isVisible).sorted(by: { $0.zIndex < $1.zIndex })) { layer in
                layerContent(layer, size: size)
                    .opacity(Double(layer.opacity))
                    .scaleEffect(layer.scale)
                    .rotationEffect(layer.rotation)
                    .offset(layer.offset)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        vm.selectLayer(layerId: layer.id)
                        if layer.type == .text, vm.activeLayerId == layer.id {
                            vm.activeSheet = .textEditor(layer.id)
                        }
                    }
                    .gesture(layerGesture(layer), including: layer.isLocked ? .none : .all)
            }
        }
    }

    private func layerGesture(_ layer: LayerModel) -> some Gesture {
        let drag = DragGesture()
            .onChanged { value in
                let new = CGSize(
                    width: layer.offset.width + value.translation.width / vm.canvasZoom,
                    height: layer.offset.height + value.translation.height / vm.canvasZoom
                )
                vm.updateLayerOffset(id: layer.id, offset: new)
            }
            .onEnded { _ in vm.commitLayerTransform() }

        let magnify = MagnificationGesture()
            .onChanged { value in
                vm.updateLayerScale(id: layer.id, scale: layer.scale * value)
            }
            .onEnded { _ in vm.commitLayerTransform() }

        let rotate = RotationGesture()
            .onChanged { angle in
                vm.updateLayerRotation(id: layer.id, angle: layer.rotation + angle)
            }
            .onEnded { _ in vm.commitLayerTransform() }

        return drag.simultaneously(with: magnify.simultaneously(with: rotate))
    }

    @ViewBuilder
    private func layerContent(_ layer: LayerModel, size: CGSize) -> some View {
        switch layer.type {
        case .image, .background, .shape:
            if let image = layer.image {
                ZStack {
                    Image(uiImage: applyAdjustmentPreview(image: image, layer: layer))
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: size.width, height: size.height)
                    if !layer.drawing.bounds.isEmpty {
                        DrawingPreview(drawing: layer.drawing)
                            .frame(width: size.width, height: size.height)
                            .allowsHitTesting(false)
                    }
                }
            }
        case .text:
            Text(layer.text ?? "")
                .font(.system(size: 36, weight: .semibold))
                .foregroundStyle(.white)
                .shadow(radius: 4)
        }
    }

    private func applyAdjustmentPreview(image: UIImage, layer: LayerModel) -> UIImage {
        let adj = (layer.id == vm.activeLayerId) ? vm.adjustments.adjustments : layer.adjustments
        if adj == .identity { return image }
        return ImageProcessingService.shared.applyFilters(image: image, adjustments: adj)
    }
}

// Renders a read-only PKDrawing into the canvas stack.
private struct DrawingPreview: UIViewRepresentable {
    let drawing: PKDrawing

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.isUserInteractionEnabled = false
        canvas.drawingPolicy = .anyInput
        canvas.drawing = drawing
        return canvas
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        if uiView.drawing != drawing { uiView.drawing = drawing }
    }
}
