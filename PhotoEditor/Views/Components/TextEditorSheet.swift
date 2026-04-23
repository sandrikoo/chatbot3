import SwiftUI

struct TextEditorSheet: View {
    @EnvironmentObject var vm: EditorViewModel
    let layerId: UUID

    @State private var draft: String = ""
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                TextField("Enter text", text: $draft, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .font(.title3)
                    .padding(.horizontal)
                    .padding(.top, 12)

                Text(draft)
                    .font(.system(size: 36, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding()
                    .frame(maxWidth: .infinity, minHeight: 140)
                    .background(Palette.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)

                Spacer()
            }
            .background(Palette.background.ignoresSafeArea())
            .navigationTitle("Edit Text")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        vm.updateLayerText(id: layerId, text: draft)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                draft = vm.layers.first(where: { $0.id == layerId })?.text ?? ""
            }
        }
        .preferredColorScheme(.dark)
    }
}
