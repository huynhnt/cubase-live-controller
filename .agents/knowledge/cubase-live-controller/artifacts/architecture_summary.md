# 🎛️ Cubase Live Controller Knowledge Base: Architecture Summary

## 1. System Components & Flow

```
                                +---------------------------+
                                |  Steinberg Cubase VST     |
                                |  Track "Beat", "Mic",     |
                                |  Auto-Tune Insert Slot 1  |
                                +-------------+-------------+
                                              ^
                                  MIDI CC     | loopMIDI Virtual
                                  2-Way Sync  v Port (CC 20-32)
+---------------------------------------------+-------------------------------------+
|                              ELECTRON APP (v1.0.3)                                |
|                                                                                   |
|  MAIN PROCESS (electron/main.js)                                                  |
|  - Config persistence (%APPDATA%/cubase-live-controller/config.json)              |
|  - Standalone Floating Auto-Updater Window (electron/update-window.html)          |
|  - Electron globalShortcut registrations (Alt+F7 to Alt+F12, Soundboard Num 1..5) |
|  - desktopCapturer for Smart Tone title detection                                 |
|                                                                                   |
|  RENDERER PROCESS (Vite + HTML5)                                                  |
|  - UI Layout & Glassmorphism Theme (src/ui.js, src/style.css)                     |
|  - Web MIDI API (src/midi.js)                                                     |
|  - Smart Tone Audio Analyzer (src/tone-parser.js, src/audio-analyzer.js)          |
|  - Soundboard Offline Audio Player (src/soundboard.js)                            |
|  - Preset Engine (src/presets.js)                                                 |
+-----------------------------------------------------------------------------------+
```

## 2. Key Developer Gotchas & Guidelines

1. **CJS Package Overrides Rule**:
   Always keep `"overrides": { "@noble/hashes": "1.3.2" }` in `package.json`. Without this override, `@noble/hashes` v1.4.0+ converts to ESM module and causes `ERR_REQUIRE_ESM` inside `electron-builder` CJS scripts during `npm run dist` or GitHub Actions build.

2. **Auto-Updater Testing**:
   When testing auto-updater popup locally in dev mode (`npx electron .`), `package.json` `"version"` MUST be set lower than the remote release version on GitHub (e.g. set `"version": "1.0.0"` while GitHub has `1.0.3`).

3. **Dynamic Default Project File**:
   The installer packages `3.LiveStream.cpr` via `extraFiles`. At runtime, `getDefaultProjectPath()` dynamically resolves `path.join(path.dirname(app.getPath('exe')), '3.LiveStream.cpr')` so auto-opening Cubase projects works on ANY computer regardless of username or install directory.
