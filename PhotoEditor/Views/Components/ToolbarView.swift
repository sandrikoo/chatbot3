import SwiftUI

struct ToolbarView: View {
    @EnvironmentObject var vm: EditorViewModel

    private let tools: [ToolType] = [
        .select, .marquee, .brush, .eraser, .lasso,
        .pen, .stamp, .pencil, .text, .shape, .image, .adjust
    ]

    var body: some View {
        VStack(spacing: 14) {
            ForEach(tools) { tool in
                ToolButton(
                    tool: tool,
                    isActive: vm.currentTool == tool,
                    action: { selectTool(tool) }
                )
                .contextMenu { toolOptions(for: tool) }
            }

            Image(systemName: "ellipsis")
                .foregroundStyle(Palette.iconInactive)
                .font(.system(size: 16, weight: .semibold))
                .padding(.top, 4)

            Spacer(minLength: 0)

            ColorSwatchStack()
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 8)
        .frame(width: 52)
        .glassBackground(cornerRadius: 14)
    }

    // Notifies the view model of the tool selection.
    private func selectTool(_ tool: ToolType) {
        vm.selectTool(tool)
    }

    // Presents contextual options for the chosen tool.
    @ViewBuilder
    private func toolOptions(for tool: ToolType) -> some View {
        switch tool {
        case .brush:
            Button("Small") {}
            Button("Medium") {}
            Button("Large") {}
        case .eraser:
            Button("Erase Pixels") {}
            Button("Erase to Mask") {}
        default:
            Button("Options") {}
        }
    }
}

private struct ToolButton: View {
    let tool: ToolType
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(isActive ? Palette.accent : Color.clear)
                    .frame(width: 36, height: 36)
                Image(systemName: tool.systemIcon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(isActive ? Color.white : Palette.iconInactive)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct ColorSwatchStack: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.white)
                .frame(width: 22, height: 22)
                .offset(x: 6, y: 6)
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.black)
                .frame(width: 22, height: 22)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(Color.white.opacity(0.6), lineWidth: 1)
                )
        }
        .padding(.bottom, 6)
    }
}
