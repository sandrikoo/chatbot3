import SwiftUI

struct CropOverlay: View {
    @EnvironmentObject var vm: EditorViewModel
    let containerSize: CGSize

    var body: some View {
        GeometryReader { proxy in
            let rect = currentRect(in: proxy.size)

            ZStack {
                Color.black.opacity(0.5)
                    .mask(
                        Rectangle()
                            .overlay(
                                Rectangle()
                                    .frame(width: rect.width, height: rect.height)
                                    .position(x: rect.midX, y: rect.midY)
                                    .blendMode(.destinationOut)
                            )
                            .compositingGroup()
                    )

                Rectangle()
                    .stroke(Color.white, lineWidth: 1.5)
                    .frame(width: rect.width, height: rect.height)
                    .position(x: rect.midX, y: rect.midY)

                gridLines(in: rect)

                ForEach(Corner.allCases, id: \.self) { corner in
                    Handle()
                        .position(point(for: corner, rect: rect))
                        .gesture(dragCorner(corner, containerSize: proxy.size))
                }

                HStack(spacing: 12) {
                    Button("Cancel") {
                        vm.cropRect = nil
                        vm.selectTool(.select)
                    }
                    .foregroundStyle(.white)
                    Button("Apply") {
                        vm.applyCrop(rect: rect, containerSize: proxy.size)
                    }
                    .foregroundStyle(Palette.accent)
                    .fontWeight(.semibold)
                }
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(.black.opacity(0.7), in: Capsule())
                .position(x: proxy.size.width / 2, y: proxy.size.height - 40)
            }
        }
    }

    private func currentRect(in size: CGSize) -> CGRect {
        let norm = vm.cropRect ?? CGRect(x: 0.1, y: 0.1, width: 0.8, height: 0.8)
        return CGRect(
            x: norm.origin.x * size.width,
            y: norm.origin.y * size.height,
            width: norm.width * size.width,
            height: norm.height * size.height
        )
    }

    private func dragCorner(_ corner: Corner, containerSize: CGSize) -> some Gesture {
        DragGesture()
            .onChanged { value in
                var rect = currentRect(in: containerSize)
                let p = value.location
                switch corner {
                case .topLeft:
                    rect = CGRect(x: p.x, y: p.y, width: rect.maxX - p.x, height: rect.maxY - p.y)
                case .topRight:
                    rect = CGRect(x: rect.minX, y: p.y, width: p.x - rect.minX, height: rect.maxY - p.y)
                case .bottomLeft:
                    rect = CGRect(x: p.x, y: rect.minY, width: rect.maxX - p.x, height: p.y - rect.minY)
                case .bottomRight:
                    rect = CGRect(x: rect.minX, y: rect.minY, width: p.x - rect.minX, height: p.y - rect.minY)
                }
                let normalized = CGRect(
                    x: max(0, rect.origin.x / containerSize.width),
                    y: max(0, rect.origin.y / containerSize.height),
                    width: min(1, max(0.1, rect.width / containerSize.width)),
                    height: min(1, max(0.1, rect.height / containerSize.height))
                )
                vm.cropRect = normalized
            }
    }

    private func point(for corner: Corner, rect: CGRect) -> CGPoint {
        switch corner {
        case .topLeft:     return CGPoint(x: rect.minX, y: rect.minY)
        case .topRight:    return CGPoint(x: rect.maxX, y: rect.minY)
        case .bottomLeft:  return CGPoint(x: rect.minX, y: rect.maxY)
        case .bottomRight: return CGPoint(x: rect.maxX, y: rect.maxY)
        }
    }

    private func gridLines(in rect: CGRect) -> some View {
        ZStack {
            Path { path in
                let w = rect.width / 3
                let h = rect.height / 3
                for i in 1..<3 {
                    path.move(to: CGPoint(x: rect.minX + w * CGFloat(i), y: rect.minY))
                    path.addLine(to: CGPoint(x: rect.minX + w * CGFloat(i), y: rect.maxY))
                    path.move(to: CGPoint(x: rect.minX, y: rect.minY + h * CGFloat(i)))
                    path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + h * CGFloat(i)))
                }
            }
            .stroke(Color.white.opacity(0.4), lineWidth: 0.5)
        }
    }

    private enum Corner: CaseIterable { case topLeft, topRight, bottomLeft, bottomRight }
}

private struct Handle: View {
    var body: some View {
        Circle()
            .fill(Color.white)
            .frame(width: 16, height: 16)
            .overlay(Circle().stroke(Palette.accent, lineWidth: 2))
    }
}
