import SwiftUI

struct BottomNavigationBar: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        HStack(alignment: .center) {
            navItem(.discover)
            navItem(.learn)
            Spacer()
            FloatingActionButton()
                .offset(y: -8)
            Spacer()
            navItem(.files)
            navItem(.more)
        }
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .padding(.bottom, 14)
        .frame(maxWidth: .infinity)
        .background(Palette.background.ignoresSafeArea(edges: .bottom))
        .overlay(
            Rectangle().fill(Palette.divider).frame(height: 0.5),
            alignment: .top
        )
    }

    // Switches the active app-level tab via the view model.
    private func navItem(_ tab: AppTab) -> some View {
        Button {
            navigateTo(tab)
        } label: {
            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 18, weight: .medium))
                Text(tab.title)
                    .font(.system(size: 11, weight: .medium))
            }
            .foregroundStyle(vm.currentAppTab == tab ? Palette.textPrimary : Palette.textSecondary)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    private func navigateTo(_ tab: AppTab) {
        vm.navigateTo(tab)
    }
}
