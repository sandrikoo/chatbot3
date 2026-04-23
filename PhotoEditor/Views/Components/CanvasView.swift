import SwiftUI

struct CanvasView: View {
    @EnvironmentObject var vm: EditorViewModel

    @GestureState private var pinchDelta: CGFloat = 1.0
    @GestureState private var panDelta: CGSize = .zero

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                Palette.background
                renderLayers(in: proxy.size)
                    .scaleEffect(vm.canvasZoom * pinchDelta)
                    .offset(
                        x: vm.canvasOffset.width + panDelta.width,
                        y: vm.canvasOffset.height + panDelta.height
                    )
                    .gesture(
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
                                        next, in: proxy.size, contentScale: vm.canvasZoom
                                    ))
                                }
                        )
                    )
                    .onTapGesture(count: 2) { vm.resetCanvasTransform() }
                    .onTapGesture { location in selectLayer(at: location, in: proxy.size) }
            }
            .clipped()
        }
    }

    // Composites all visible layers in zIndex order with global adjustments applied to the active layer live.
    @ViewBuilder
    private func renderLayers(in size: CGSize) -> some View {
        ZStack {
            ForEach(vm.layers.filter(\.isVisible).sorted(by: { $0.zIndex < $1.zIndex })) { layer in
                layerContent(layer, size: size)
                    .opacity(Double(layer.opacity))
            }
        }
    }

    @ViewBuilder
    private func layerContent(_ layer: LayerModel, size: CGSize) -> some View {
        switch layer.type {
        case .image, .background, .shape:
            if let image = layer.image {
                Image(uiImage: applyAdjustmentPreview(image: image, layer: layer))
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: size.width, height: size.height)
            }
        case .text:
            Text(layer.text ?? "")
                .font(.system(size: 36, weight: .semibold))
                .foregroundStyle(.white)
                .shadow(radius: 4)
        }
    }

    // Applies live CoreImage filters using the current adjustment state without mutating the layer.
    private func applyAdjustmentPreview(image: UIImage, layer: LayerModel) -> UIImage {
        let adj = (layer.id == vm.activeLayerId) ? vm.adjustments.adjustments : layer.adjustments
        if adj == .identity { return image }
        return ImageProcessingService.shared.applyFilters(image: image, adjustments: adj)
    }

    // Hit-tests layers by reverse zIndex to select the topmost one under the tap.
    private func selectLayer(at point: CGPoint, in size: CGSize) {
        guard let top = vm.layers
            .filter({ $0.isVisible })
            .sorted(by: { $0.zIndex > $1.zIndex })
            .first else { return }
        vm.selectLayer(layerId: top.id)
    }
}
