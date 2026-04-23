import SwiftUI
import PencilKit

// PencilKit-backed overlay wired to the active layer's PKDrawing.
struct BrushOverlay: View {
    @EnvironmentObject var vm: EditorViewModel
    let layerId: UUID

    var body: some View {
        BrushCanvas(
            layerId: layerId,
            tool: vm.currentTool,
            color: UIColor(vm.brushColor),
            width: vm.brushWidth
        )
        .environmentObject(vm)
    }
}

struct BrushCanvas: UIViewRepresentable {
    @EnvironmentObject var vm: EditorViewModel
    let layerId: UUID
    let tool: ToolType
    let color: UIColor
    let width: CGFloat

    func makeUIView(context: Context) -> PKCanvasView {
        let canvas = PKCanvasView()
        canvas.backgroundColor = .clear
        canvas.isOpaque = false
        canvas.drawingPolicy = .anyInput
        canvas.delegate = context.coordinator
        canvas.tool = makeTool()
        if let layer = vm.layers.first(where: { $0.id == layerId }) {
            canvas.drawing = layer.drawing
        }
        return canvas
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        uiView.tool = makeTool()
        if let layer = vm.layers.first(where: { $0.id == layerId }),
           uiView.drawing != layer.drawing {
            uiView.drawing = layer.drawing
        }
    }

    private func makeTool() -> PKTool {
        switch tool {
        case .eraser: return PKEraserTool(.bitmap)
        default:      return PKInkingTool(.pen, color: color, width: width)
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, PKCanvasViewDelegate {
        let parent: BrushCanvas
        init(_ parent: BrushCanvas) { self.parent = parent }

        func canvasViewDrawingDidChange(_ canvasView: PKCanvasView) {
            parent.vm.updateLayerDrawing(id: parent.layerId, drawing: canvasView.drawing)
        }

        func canvasViewDidEndUsingTool(_ canvasView: PKCanvasView) {
            parent.vm.commitLayerTransform()
        }
    }
}
