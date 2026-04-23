import SwiftUI

enum Palette {
    static let background = Color(red: 0.06, green: 0.07, blue: 0.09)
    static let panel = Color(red: 0.11, green: 0.12, blue: 0.14)
    static let panelElevated = Color(red: 0.15, green: 0.16, blue: 0.18)
    static let divider = Color.white.opacity(0.08)
    static let accent = Color(red: 0.14, green: 0.48, blue: 1.0)
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.65)
    static let iconInactive = Color.white.opacity(0.75)
}

extension View {
    func glassBackground(cornerRadius: CGFloat = 16) -> some View {
        self.background(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Palette.panel)
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(Palette.divider, lineWidth: 0.5)
                )
        )
    }
}
