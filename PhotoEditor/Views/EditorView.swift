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
        }
        .animation(.easeInOut(duration: 0.2), value: vm.showAdjustmentsPanel)
    }
}

#Preview {
    EditorView()
        .environmentObject(EditorViewModel())
        .preferredColorScheme(.dark)
}
