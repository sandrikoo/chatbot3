import SwiftUI

@main
struct PhotoEditorApp: App {
    @StateObject private var editorViewModel = EditorViewModel()

    var body: some Scene {
        WindowGroup {
            EditorView()
                .environmentObject(editorViewModel)
                .preferredColorScheme(.dark)
        }
    }
}
