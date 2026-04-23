import SwiftUI

struct FloatingActionButton: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        Button {
            showAddLayerMenu()
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(
                    Circle().fill(Palette.accent)
                )
                .shadow(color: Palette.accent.opacity(0.5), radius: 10, x: 0, y: 4)
        }
        .buttonStyle(.plain)
        .confirmationDialog(
            "Add Layer",
            isPresented: $vm.showAddLayerMenu,
            titleVisibility: .visible
        ) {
            Button("Image")  { handleAddImage() }
            Button("Text")   { handleAddText() }
            Button("Shape")  { handleAddShape() }
            Button("Cancel", role: .cancel) { }
        }
    }

    // Presents the "add layer" chooser.
    private func showAddLayerMenu() {
        vm.showAddLayerMenu = true
    }

    // Opens the gallery picker (stubbed: adds placeholder image layer).
    private func handleAddImage() {
        vm.addLayer(type: .image)
    }

    // Adds an editable text layer.
    private func handleAddText() {
        vm.addLayer(type: .text)
    }

    // Adds a basic shape layer.
    private func handleAddShape() {
        vm.addLayer(type: .shape)
    }
}
