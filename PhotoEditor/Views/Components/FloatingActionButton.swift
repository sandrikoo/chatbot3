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
                .background(Circle().fill(Palette.accent))
                .shadow(color: Palette.accent.opacity(0.5), radius: 10, x: 0, y: 4)
        }
        .buttonStyle(.plain)
        .confirmationDialog(
            "Add Layer",
            isPresented: $vm.showAddLayerMenu,
            titleVisibility: .visible
        ) {
            Button("Image")  { vm.addLayer(type: .image) }
            Button("Text")   { vm.addLayer(type: .text) }
            Button("Shape")  { vm.addLayer(type: .shape) }
            Button("Cancel", role: .cancel) { }
        }
    }

    private func showAddLayerMenu() {
        vm.showAddLayerMenu = true
    }
}
