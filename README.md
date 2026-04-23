# Photo Editor

A Photoshop-style mobile photo editor, shipped in two forms:

- **`web/`** – React + Vite + TypeScript web app (runs in any modern browser;
  installable as a PWA for a fullscreen mobile experience).
- **`PhotoEditor/`** – SwiftUI iOS app (MVVM, CoreImage, PencilKit).

The web version is the primary build right now.

---

## Web version (`web/`)

### Run

```bash
cd web
npm install
npm run dev -- --host        # http://localhost:5173  (reachable on LAN)
```

Open the dev URL on your phone for a proper mobile test. Tap *Add to Home
Screen* in Safari / Chrome to install the PWA for a fullscreen,
chrome-less experience.

### Build / preview

```bash
cd web
npm run build
npm run preview -- --host
```

### Features

- **Layers** — add / duplicate / delete / lock / hide / reorder
- **Per-layer transforms** — drag, pinch-to-scale, two-finger rotate
- **Tools** — select / brush / eraser / marquee / lasso / pen / stamp /
  pencil / text / shape / image / adjust / crop
- **Adjustments** — Light (exposure / contrast / highlights / shadows),
  Color (saturation / temperature / tint / vibrance), Effects + Optics
  (vignette / grain), Detail (sharpness), Geometry (rotation / straighten);
  live preview via CSS filters, full pixel-accurate version on export
- **Crop** — corner-handle overlay with rule-of-thirds grid
- **Text** — modal editor
- **Image import** — device photo picker
- **Export** — PNG via the Web Share API (Save to Photos on iOS) with a
  download fallback
- **Undo / redo** — 50-step history
- **Pinch-zoom + two-finger pan** on the canvas, double-tap to reset
- **PWA** — manifest + safe-area handling, installs full-screen on mobile

### Architecture

```
web/src/
  main.tsx           entry
  App.tsx            composes EditorView
  store/editorStore.ts   Zustand — single source of truth (layers, adjustments,
                         history, tools, sheets)
  types/             shared types + IDENTITY_ADJUSTMENTS, ADJUSTMENT_RANGES
  services/
    imageProcessor.ts  CSS-filter string + pixel-accurate flatten (highlights,
                       shadows, vignette, grain, rotation) via Canvas 2D
    exporter.ts        toBlob + Web Share / download
  components/
    EditorView.tsx     top-level layout
    TopBar.tsx         undo / redo / auto / crop / export / layers toggle
    CanvasView.tsx     canvas with pinch-zoom and pan
    LayerItem.tsx      one image / text / shape layer, with drag + pinch
    BrushOverlay.tsx   SVG-path painting/erasing on the active layer
    CropOverlay.tsx    resizable crop frame with rule-of-thirds
    Toolbar.tsx        left-side floating tools
    LayersPanel.tsx    right-side layer stack
    AdjustmentsPanel.tsx bottom tabbed sliders
    BottomNavigationBar.tsx + FloatingActionButton
    Sheet.tsx          bottom-sheet modal
    ImagePicker.tsx    native <input type=file>
    TextEditorSheet.tsx modal text editor
    AddLayerSheet.tsx  Image/Text/Shape chooser
    ExportResultSheet.tsx success confirmation
```

### Trade-offs

- **Save to Photos on iOS** uses Web Share — works in Safari 15+, not Chrome
  iOS. The fallback is a standard download.
- **Stroke quality** matches SVG paths; there's no PencilKit-style smoothing.
- **Highlights / shadows / vignette / grain** run on the main thread via
  `getImageData` at export time. For very large images consider moving to a
  `OffscreenCanvas` Worker.

---

## iOS version (`PhotoEditor/`)

SwiftUI app requiring Xcode 15+ and iOS 17+.

### Build

```bash
brew install xcodegen
xcodegen generate
open PhotoEditor.xcodeproj
```

Or create a new iOS App target manually and drag `PhotoEditor/` in; use
the bundled `Info.plist` (it ships the Photos usage strings).

### Architecture

- `EditorViewModel` is the single source of truth; views observe via
  `@EnvironmentObject`
- Adjustments are non-destructive; `ImageProcessingService.applyFilters`
  renders a CoreImage chain for live preview and `mergeLayers` flattens
  on export
- `PhotoExporter` wraps `PHPhotoLibrary` with async/await

```
PhotoEditor/
  App/                entry point
  Models/             LayerModel, AdjustmentModel, ToolType, AdjustmentTab
  ViewModels/         EditorViewModel
  Views/
    EditorView.swift  top-level composition
    Components/       Canvas, Toolbar, LayersPanel, AdjustmentsPanel,
                      TopBar, BottomNavigationBar, FloatingActionButton,
                      BrushOverlay, CropOverlay, ImagePickerView,
                      TextEditorSheet
  Services/           ImageProcessingService, GestureService, PhotoExporter
  Utils/              ColorPalette
  Info.plist
```
