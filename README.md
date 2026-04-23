# Photo Editor

A SwiftUI iOS photo editor inspired by Adobe Photoshop on mobile. Built with
MVVM, CoreImage, and PencilKit.

## Features

- Layer stack with add / delete / duplicate / lock / visibility / reorder
- Tap a layer to select; drag / pinch / rotate to transform
- PencilKit-backed brush + eraser bound to the active layer
- Live CoreImage adjustments (Light / Color / Effects / Detail / Optics / Geometry)
- Crop overlay with corner handles and rule-of-thirds grid
- Text layers with modal editor
- Image import via `PHPickerViewController`
- Export flattened image to the Photos library
- Undo / redo history (50 entries)
- Pinch-to-zoom and drag-to-pan canvas, double-tap to reset

## Project layout

```
PhotoEditor/
  App/                 -- app entry point
  Models/              -- LayerModel, AdjustmentModel, ToolType, AdjustmentTab
  ViewModels/          -- EditorViewModel (source of truth)
  Views/
    EditorView.swift   -- top-level composition
    Components/        -- Canvas, Toolbar, LayersPanel, AdjustmentsPanel,
                          TopBar, BottomNavigationBar, FloatingActionButton,
                          BrushOverlay, CropOverlay, ImagePickerView,
                          TextEditorSheet
  Services/            -- ImageProcessingService, GestureService, PhotoExporter
  Utils/               -- ColorPalette
  Info.plist
```

## Build

Requires Xcode 15+ and iOS 17+.

### Option A — XcodeGen (recommended)

```bash
brew install xcodegen
xcodegen generate
open PhotoEditor.xcodeproj
```

### Option B — Manual

1. In Xcode, **File → New → Project… → iOS → App**.
2. Product name `PhotoEditor`, Interface `SwiftUI`, Language `Swift`.
3. Delete the generated `ContentView.swift` and the auto-created `App` struct.
4. Drag the `PhotoEditor/` folder from this repo into the new project
   (*Copy items if needed* off, *Create groups*).
5. Use the bundled `PhotoEditor/Info.plist` (it declares the Photos usage
   strings the app needs).
6. Set deployment target to **iOS 17.0**.
7. Build & run on an iPhone simulator or device.

## Architecture notes

- `EditorViewModel` is the single source of truth. All views observe it via
  `@EnvironmentObject`. User actions go through VM methods that update state
  and push snapshots onto the history stack.
- Adjustments are **non-destructive**: sliders mutate the active layer's
  `AdjustmentModel`, and `ImageProcessingService.applyFilters` renders a CIImage
  chain for live preview. Only export flattens the result.
- Drawing, per-layer transforms, and text are merged into the output inside
  `ImageProcessingService.mergeLayers`.
- `PhotoExporter` wraps `PHPhotoLibrary` with async/await and surfaces errors
  via `ActiveSheet.exportResult`.
