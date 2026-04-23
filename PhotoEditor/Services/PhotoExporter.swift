import UIKit
import Photos

// Saves rendered editor output into the user's Photos library.
final class PhotoExporter: NSObject {
    static let shared = PhotoExporter()

    enum ExportError: LocalizedError {
        case authorizationDenied
        case saveFailed(Error)

        var errorDescription: String? {
            switch self {
            case .authorizationDenied: return "Photo library permission denied."
            case .saveFailed(let e):   return "Save failed: \(e.localizedDescription)"
            }
        }
    }

    func save(_ image: UIImage) async throws {
        let status = await requestAuthorization()
        guard status == .authorized || status == .limited else {
            throw ExportError.authorizationDenied
        }
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }, completionHandler: { success, error in
                if let error = error {
                    cont.resume(throwing: ExportError.saveFailed(error))
                } else if success {
                    cont.resume()
                } else {
                    cont.resume(throwing: ExportError.saveFailed(
                        NSError(domain: "PhotoExporter", code: -1)
                    ))
                }
            })
        }
    }

    private func requestAuthorization() async -> PHAuthorizationStatus {
        await withCheckedContinuation { cont in
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                cont.resume(returning: status)
            }
        }
    }
}
