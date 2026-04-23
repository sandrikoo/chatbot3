import SwiftUI

struct EditorView: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        ZStack(alignment: .bottom) {
            Palette.background.ignoresSafeArea()

            VStack(spacing: 0) {
                TopBar()

                ZStack {
                    CanvasView()

                    HStack {
                        ToolbarView()
                            .padding(.leading, 8)
                        Spacer()
                        LayersPanel()
                            .padding(.trailing, 8)
                    }
                    .padding(.vertical, 12)
                }
                .frame(maxHeight: .infinity)

                if vm.showAdjustmentsPanel {
                    AdjustmentsPanel()
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }

                BottomNavigationBar()
            }

            if vm.isExporting {
                ProgressView("Exporting…")
                    .padding(24)
                    .background(Palette.panel, in: RoundedRectangle(cornerRadius: 14))
                    .foregroundStyle(.white)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: vm.showAdjustmentsPanel)
        .sheet(item: $vm.activeSheet) { sheet in
            switch sheet {
            case .imagePicker:
                ImagePickerView { image in
                    vm.importImage(image: image)
                    vm.activeSheet = nil
                }
            case .textEditor(let id):
                TextEditorSheet(layerId: id)
            case .exportResult(let message):
                ExportResultSheet(message: message)
            }
        }
    }
}

private struct ExportResultSheet: View {
    @Environment(\.dismiss) private var dismiss
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Palette.accent)
            Text(message)
                .font(.headline)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Button("Done") { dismiss() }
                .buttonStyle(.borderedProminent)
                .tint(Palette.accent)
        }
        .padding(32)
        .frame(maxWidth: .infinity)
        .background(Palette.background.ignoresSafeArea())
        .presentationDetents([.height(240)])
    }
}

#Preview {
    EditorView()
        .environmentObject(EditorViewModel())
        .preferredColorScheme(.dark)
}
