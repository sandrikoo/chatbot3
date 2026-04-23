import SwiftUI

struct TopBar: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                Button { vm.openNewProject() } label: {
                    Image(systemName: "house")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(Palette.textPrimary)
                }
                Spacer()
                HStack(spacing: 6) {
                    Text("Adobe Photoshop")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Palette.textPrimary)
                    Image(systemName: "cloud")
                        .font(.system(size: 14))
                        .foregroundStyle(Palette.textSecondary)
                }
                Spacer()
                Button {} label: {
                    Image(systemName: "ellipsis")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(Palette.textPrimary)
                }
            }
            .buttonStyle(.plain)

            HStack(spacing: 24) {
                Button { vm.undo() } label: {
                    Image(systemName: "arrow.uturn.backward")
                        .foregroundStyle(vm.canUndo ? Palette.textPrimary : Palette.textSecondary.opacity(0.4))
                }
                .disabled(!vm.canUndo)

                Button { vm.redo() } label: {
                    Image(systemName: "arrow.uturn.forward")
                        .foregroundStyle(vm.canRedo ? Palette.textPrimary : Palette.textSecondary.opacity(0.4))
                }
                .disabled(!vm.canRedo)

                Divider()
                    .frame(height: 18)
                    .background(Palette.divider)

                Button { vm.applyAutoAdjustments() } label: {
                    Image(systemName: "wand.and.stars")
                        .foregroundStyle(Palette.textPrimary)
                }

                Button { vm.selectTool(.crop) } label: {
                    Image(systemName: "crop")
                        .foregroundStyle(Palette.textPrimary)
                }

                Button { vm.exportToPhotos() } label: {
                    Image(systemName: "square.and.arrow.up")
                        .foregroundStyle(Palette.textPrimary)
                }

                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        vm.showAdjustmentsPanel.toggle()
                    }
                } label: {
                    Image(systemName: "square.stack.3d.up")
                        .foregroundStyle(Palette.textPrimary)
                }
            }
            .font(.system(size: 18, weight: .medium))
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Palette.background.ignoresSafeArea(edges: .top))
    }
}
