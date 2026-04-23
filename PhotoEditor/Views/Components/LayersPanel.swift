import SwiftUI

struct LayersPanel: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        VStack(spacing: 10) {
            Button {
                vm.showAddLayerMenu = true
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Palette.textPrimary)
                    .frame(width: 36, height: 36)
                    .background(Palette.panelElevated, in: RoundedRectangle(cornerRadius: 8))
            }
            .buttonStyle(.plain)

            ScrollView(showsIndicators: false) {
                VStack(spacing: 8) {
                    let sorted = vm.layers.sorted(by: { $0.zIndex > $1.zIndex })
                    ForEach(sorted) { layer in
                        LayerRow(layer: layer, isActive: layer.id == vm.activeLayerId)
                            .onTapGesture { vm.selectLayer(layerId: layer.id) }
                            .contextMenu {
                                Button("Duplicate") { vm.duplicateActiveLayer() }
                                Button(layer.isVisible ? "Hide" : "Show") {
                                    vm.toggleVisibility(layerId: layer.id)
                                }
                                Button(layer.isLocked ? "Unlock" : "Lock") {
                                    vm.lockLayer(layerId: layer.id)
                                }
                                Button("Delete", role: .destructive) {
                                    vm.deleteLayer(layerId: layer.id)
                                }
                            }
                    }
                }
            }

            HStack(spacing: 6) {
                Button {
                    vm.duplicateActiveLayer()
                } label: {
                    Image(systemName: "square.on.square")
                        .frame(width: 40, height: 34)
                        .background(Palette.panelElevated, in: RoundedRectangle(cornerRadius: 8))
                }
                Button(role: .destructive) {
                    if let id = vm.activeLayerId { vm.deleteLayer(layerId: id) }
                } label: {
                    Image(systemName: "trash")
                        .frame(width: 40, height: 34)
                        .background(Palette.panelElevated, in: RoundedRectangle(cornerRadius: 8))
                }
            }
            .buttonStyle(.plain)
            .foregroundStyle(Palette.iconInactive)
        }
        .padding(8)
        .frame(width: 108)
        .glassBackground(cornerRadius: 14)
    }
}

private struct LayerRow: View {
    @EnvironmentObject var vm: EditorViewModel
    let layer: LayerModel
    let isActive: Bool

    var body: some View {
        HStack(spacing: 6) {
            Button {
                vm.toggleVisibility(layerId: layer.id)
            } label: {
                Image(systemName: layer.isLocked ? "lock.fill" : (layer.isVisible ? "eye" : "eye.slash"))
                    .font(.system(size: 12))
                    .foregroundStyle(Palette.iconInactive)
                    .frame(width: 16)
            }
            .buttonStyle(.plain)

            thumbnail
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(isActive ? Palette.accent : Color.clear, lineWidth: 2)
                )

            Image(systemName: "ellipsis")
                .font(.system(size: 11))
                .foregroundStyle(Palette.iconInactive)
        }
        .padding(.vertical, 2)
    }

    @ViewBuilder
    private var thumbnail: some View {
        if let img = layer.thumbnail ?? layer.image {
            Image(uiImage: img).resizable().scaledToFill()
        } else if layer.type == .text {
            ZStack {
                Rectangle().fill(Palette.panelElevated)
                Text("T").font(.system(size: 20, weight: .bold)).foregroundStyle(.white)
            }
        } else {
            Rectangle().fill(Palette.panelElevated)
        }
    }
}
