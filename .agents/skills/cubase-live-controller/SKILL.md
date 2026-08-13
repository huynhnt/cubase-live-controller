---
name: cubase-live-controller
description: Expert skill for developing, maintaining, and extending the Cubase Live Controller application. Includes architectural patterns, IPC contracts, Web MIDI 2-way sync, Smart Tone engine, state management, Soundboard engine, and electron-builder packaging rules.
---

# 🎛️ Cubase Live Controller Skill Guide

This skill provides comprehensive architectural context and technical blueprints for the **Cubase Live Controller** application. Agents using this skill can immediately modify, extend, or debug the codebase without needing to read the entire repository.

---

## 🏗️ 1. High-Level Architecture Overview

Cubase Live Controller is an Electron + Vite + Web MIDI desktop overlay application for live performers, karaoke streamers, and studio engineers controlling Steinberg Cubase in real time.

```
+-----------------------------------------------------------------------------------+
|                               ELECTRON MAIN PROCESS                              |
|  (electron/main.js)                                                               |
|  - Manages BrowserWindow & Standalone Floating Update Window                      |
|  - Config Persistence (%APPDATA%/cubase-live-controller/config.json)              |
|  - Global Shortcuts Engine (Electron globalShortcut API)                          |
|  - Shell operations & Auto-Updater (electron-updater + GitHub Releases)           |
+----------------------------------------+------------------------------------------+
                                         | IPC Bridge (electronAPI via preload.cjs)
+----------------------------------------v------------------------------------------+
|                              RENDERER PROCESS (Vite UI)                           |
|  (index.html, src/main.js, src/ui.js, src/dom.js)                                 |
|  - Modern Dark/Neon Glassmorphism UI                                              |
|  - State Engine (src/state.js)                                                    |
|  - Web MIDI Engine (src/midi.js) <---> loopMIDI Virtual Port <---> Cubase VST     |
|  - Smart Tone Engine (src/tone-parser.js + src/audio-analyzer.js)                 |
|  - Soundboard Audio Engine (src/soundboard.js)                                    |
+-----------------------------------------------------------------------------------+
```

---

## 📁 2. File Map & Responsibility Matrix

| Path | Purpose & Responsibilities |
| :--- | :--- |
| `electron/main.js` | Main process entry point. Handles window lifecycle, frameless drag regions, IPC handlers, config disk read/write, global shortcuts, and `autoUpdater` trigger. |
| `electron/preload.cjs` | ContextBridge bridge exposing `window.electronAPI` methods to the renderer process safely. |
| `electron/update-window.html` | Standalone OS floating window (440x210px) for auto-update notifications. |
| `src/main.js` | Web renderer entry point. Initializes MIDI, registers event listeners, handles bootstrap. |
| `src/dom.js` | Centralized DOM element reference registry. |
| `src/state.js` | Holds runtime reactive state (`states`), config (`appConfig`), and `DEFAULT_CONFIG`. |
| `src/ui.js` | UI rendering, sliders fill calculation, theme toggling, preset modal handling, Smart Tone UI. |
| `src/midi.js` | Web MIDI API initialization, 2-way MIDI CC send & receive listeners. |
| `src/tone-parser.js` | Browser title pitch parsing for Smart Tone. |
| `src/audio-analyzer.js` | Web Audio API YIN autocorrelation real-time pitch detection. |
| `src/soundboard.js` | Soundboard audio player, local sound file mapping, and custom audio device output routing. |
| `src/presets.js` | System presets (`Mặc định`, `Bolero`, `Remix`, `Lofi`) & User custom preset save/load/delete. |
| `src/settings.js` | Settings modal UI handling (MIDI ports, opacity, hotkeys, project path). |
| `package.json` | Project metadata, dependencies, scripts, and `electron-builder` packaging rules. |

---

## 🎹 3. MIDI CC Protocol & Mapping Contract

Communication between the app and Cubase operates over Web MIDI via **loopMIDI** virtual ports on Channel 1 (default):

| Function | CC Address | Value Range / Logic |
| :--- | :---: | :--- |
| **Beat Volume** | `20` | `0` (Mute) to `127` (Max) |
| **Beat Mute** | `21` | `>=64` (Muted) / `<64` (Unmuted) |
| **Mic Volume** | `22` | `0` to `127` |
| **Mic Mute** | `23` | `>=64` (Muted) / `<64` (Unmuted) |
| **FX Mute** | `24` | `>=64` (Muted) / `<64` (Unmuted) |
| **Reverb Long** | `25` | `0` to `127` |
| **Reverb Short** | `26` | `0` to `127` |
| **Delay** | `27` | `0` to `127` |
| **Auto-Tune** | `28` | `0` to `127` |
| **Flex** | `29` | `0` to `127` |
| **Sing / Voice Mode** | `30` | `127` (Sing Mode) / `0` (Voice Mode) |
| **Autotune Key** | `31` | Distributed `0`-`127` across 12 chromatic notes (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) |
| **Autotune Scale** | `32` | `0` (Major / Trưởng) / `127` (Minor / Thứ) |

---

## 🧠 4. Core Features & Subsystem Operations

### A. Smart Tone Engine
1. **Title Parsing (`src/tone-parser.js`)**: Uses Electron `desktopCapturer` IPC to inspect browser window titles (YouTube / Karaoke) and extracts song keys using regex patterns.
2. **Audio Frequency Analysis (`src/audio-analyzer.js`)**: Uses Web Audio API `AudioContext` and `AnalyserNode` with YIN pitch estimation over 8 seconds.
3. **MIDI Synchronization**: Immediately dispatches Key (`CC 31`) and Scale (`CC 32`) directly to the Auto-Tune VST plugin on Cubase and updates the UI nốt nhạc buttons.

### B. Voice ↔ Sing Mode Switching (`src/ui.js` / `src/state.js`)
- **Sing Mode**: Full reverb, full delay, normal mic level.
- **Voice Mode**: Saves current singing values into `savedSingingValues`, sets Reverb Long/Short & Delay to 0, lowers beat volume, and adjusts mic for clear speech. Toggling back restores original values.

### C. Standalone Floating Auto-Updater
- Main process triggers `autoUpdater.checkForUpdatesAndNotify()`.
- On update detection, opens frameless `electron/update-window.html` (440x210px).
- Renderer receives `onUpdateProgress` (percent & speed MB/s) and triggers `quitAndInstallUpdate` when downloaded.

---

## 📦 5. Packaging & Release Guidelines

- **Packaging Command**: `npm run dist` (`vite build && electron-builder`).
- **Extra Files Included**: `1.Huong_Dan_Su_Dung.md`, `2.Cubase_Live_Controller_Generic_Remote.xml`, `3.LiveStream.cpr`.
- **CJS Dependency Rule**: Must keep `@noble/hashes: 1.3.2` in `package.json` `overrides` for CJS compatibility in `electron-builder` builds.
- **Tag Trigger**: Pushing a tag matching `v*` (e.g. `v1.0.3`) triggers `.github/workflows/release.yml` to compile and publish to GitHub Releases automatically.

---

## 📚 Reference Documents
For detailed sub-system implementations, consult:
- [Architecture & IPC Specifications](references/architecture.md)
- [MIDI & Cubase Generic Remote Guide](references/midi-guide.md)
