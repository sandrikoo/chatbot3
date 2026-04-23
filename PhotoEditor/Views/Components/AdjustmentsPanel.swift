import SwiftUI

struct AdjustmentsPanel: View {
    @EnvironmentObject var vm: EditorViewModel

    var body: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(Color.white.opacity(0.25))
                .frame(width: 38, height: 4)
                .padding(.top, 10)

            HStack {
                Text("Adjustments")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Palette.textPrimary)
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.top, 14)

            tabBar
                .padding(.top, 14)

            Divider()
                .background(Palette.divider)
                .padding(.top, 10)

            header
                .padding(.top, 12)

            slidersForCurrentTab
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 16)
        }
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Palette.panel)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    // Tabs along the top: Light, Color, Effects, Detail, Optics, Geometry.
    private var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(AdjustmentTab.allCases) { tab in
                let isActive = vm.adjustments.activeTab == tab
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { vm.switchTab(tab) }
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: tab.systemIcon)
                            .font(.system(size: 18, weight: .medium))
                        Text(tab.title)
                            .font(.system(size: 11, weight: .medium))
                        Rectangle()
                            .fill(isActive ? Palette.accent : Color.clear)
                            .frame(height: 2)
                            .frame(maxWidth: 36)
                    }
                    .foregroundStyle(isActive ? Palette.accent : Palette.textSecondary)
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
    }

    private var header: some View {
        HStack {
            Text(vm.adjustments.activeTab.title)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Palette.textPrimary)
            Spacer()
            Button("Auto") { vm.applyAutoAdjustments() }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Palette.accent)
                .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
    }

    @ViewBuilder
    private var slidersForCurrentTab: some View {
        switch vm.adjustments.activeTab {
        case .light:
            sliderGroup([.exposure, .contrast, .highlights, .shadows])
        case .color:
            sliderGroup([.saturation, .temperature, .tint, .vibrance])
        case .effects:
            sliderGroup([.contrast, .vibrance])
        case .detail:
            sliderGroup([.sharpness])
        case .optics, .geometry:
            Text("Coming soon")
                .font(.system(size: 13))
                .foregroundStyle(Palette.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 12)
        }
    }

    private func sliderGroup(_ types: [AdjustmentType]) -> some View {
        VStack(spacing: 18) {
            ForEach(types) { type in
                AdjustmentSlider(type: type)
            }
        }
        .padding(.top, 6)
    }
}

private struct AdjustmentSlider: View {
    @EnvironmentObject var vm: EditorViewModel
    let type: AdjustmentType

    var body: some View {
        VStack(spacing: 6) {
            HStack {
                Text(type.title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Palette.textPrimary)
                Spacer()
                Text(format(value))
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(Palette.textSecondary)
            }
            Slider(
                value: Binding(
                    get: { Double(value) },
                    set: { vm.applyAdjustment(type: type, value: Float($0)) }
                ),
                in: Double(type.range.lowerBound)...Double(type.range.upperBound),
                onEditingChanged: { editing in
                    if !editing { vm.commitAdjustment() }
                }
            )
            .tint(Palette.accent)
        }
    }

    private var value: Float {
        vm.adjustments.adjustments.value(for: type)
    }

    private func format(_ value: Float) -> String {
        switch type {
        case .exposure:
            return String(format: "%+.2f", value)
        default:
            return String(format: "%+.0f", value)
        }
    }
}
