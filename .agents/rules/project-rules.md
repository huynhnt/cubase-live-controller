# Cubase Live Controller - Project Rules

This document outlines the codebase layout, architectural patterns, MIDI CC mappings, and coding standards for the Cubase Live Controller project. All AI agents working on this project must adhere strictly to these rules.

---

## 📂 Codebase & Module Directory Layout

The application logic is modularized into focused ES Modules located in the `src/` directory. Do not write monolithic code in a single file.

1.  **`src/state.js`**: Holds the global state (`states`), default config (`DEFAULT_CONFIG`), and the active configuration (`appConfig`). Shared by all modules.
2.  **`src/dom.js`**: Centralized mapping of all HTML elements (buttons, inputs, sliders, panels) in a single `DOM` object. Prevents duplicate `getElementById` queries.
3.  **`src/midi.js`**: Web MIDI API engine wrapper. Handles connecting MIDI ports, sending CC signals, and parsing incoming CC signals.
4.  **`src/ui.js`**: General user interface controllers. Manages sliders (fill tracks, value displays), mute indicators, key selection UI, theme toggle, and opacity.
5.  **`src/presets.js`**: Manages loading, saving, and deleting VST settings presets, including handling custom HTML overlay modals (`#overwrite-modal`, `#confirm-modal`).
6.  **`src/settings.js`**: Handles reading settings from the configuration form UI and saving it to the persistent `config.json` via Electron IPC.
7.  **`src/main.js`**: The main entry point. Imports all other modules, setups application event listeners, runs the startup bootstrapper (`bootstrap`), and listens to incoming MIDI CC events.

---

## 🎛️ Official MIDI CC Mappings

All MIDI CC mappings must match this table:

| Function | CC Number | Values |
| :--- | :---: | :--- |
| **Beat Volume** | `20` | `0` (Mute) - `127` (Max) |
| **Beat Mute** | `21` | `>=64` (Muted) / `<64` (Open) |
| **Mic Volume** | `22` | `0` - `127` |
| **Mic Mute** | `23` | `>=64` (Muted) / `<64` (Open) |
| **FX Mute (Reverb)** | `24` | `>=64` (Muted) / `<64` (Open) |
| **Reverb Long** | `25` | `0` - `127` |
| **Reverb Short** | `26` | `0` - `127` |
| **Delay** | `27` | `0` - `127` |
| **Autotune (Retune Speed)** | `28` | `0` - `127` |
| **Flex (Humanize)** | `29` | `0` - `127` |
| **Sing/Voice Mode** | `30` | `127` (Sing Mode) / `0` (Voice Mode) |
| **Autotune Key** | `31` | `0` - `127` (Split among 12 notes) |
| **Autotune Scale** | `32` | `0` (Major) / `127` (Minor) |
| **Get Tone (Auto-Key)** | `33` | `127` (Trigger scan) |
| **Send Tone (Auto-Key)** | `34` | `127` (Trigger sync to Auto-Tune) |
| **Detected Key In (Auto-Key)**| `35` | `0` - `127` (Key received from Auto-Key) |
| **Detected Scale In (Auto-Key)**| `36` | `0` - `127` (Scale received from Auto-Key) |

---

## 📝 Coding Standards & Guidelines

*   **Modular Architecture**: When adding features, identify the correct module. For example, add new VST controls to `src/ui.js` and their MIDI triggers to `src/main.js`.
*   **Import Statements**: Always use explicit ES module import statements with file extensions (e.g., `import { DOM } from './dom.js';`).
*   **Preserve Comments**: Do not strip developer comments or docstrings when making edits.
*   **No Placeholders**: Never write placeholder code or comments like `// TODO: implement later`. All implementations must be complete.

---

## ⌨️ Global Hotkeys & Window Management

The application supports system-wide global hotkeys for hands-free live streaming control.

### Default Hotkey Mapping

| Function | Default Hotkey | Action |
| :--- | :---: | :--- |
| **Toggle Mode** | `Alt+F8` | Toggles Sing/Voice mode (`toggleSingVoiceMode`) |
| **Toggle Music** | `Alt+F9` | Toggles beat mute (`toggleBeatMute`) |
| **Toggle Mic** | `Alt+F10` | Toggles mic mute (`toggleMicMute`) |
| **Toggle Vang** | `Alt+F11` | Toggles reverb/FX mute (`toggleFxMute`) |
| **Toggle Window** | `Alt+F12` | Minimizes or restores window to top |

### Architecture & IPC Dataflow

1.  **Main Process (`electron/main.js`)**:
    - Registers hotkeys globally via Electron's `globalShortcut` module.
    - When a functional hotkey (`toggleMusic`, `toggleMic`, `toggleFx`, `toggleMode`) is triggered, it sends an IPC event `shortcut-pressed` to the frontend via `mainWindow.webContents.send()`.
    - When `toggleWindow` is triggered, the main process directly manages window state:
      - If minimized -> restores, shows, focuses, and brings to top (`setAlwaysOnTop(true)`).
      - If focused -> minimizes.
      - If visible but not focused -> focuses and brings to top.
2.  **Preload Script (`electron/preload.js` / `.cjs`)**:
    - Exposes the event listener binding `onShortcutPressed(callback)` in `window.electronAPI`.
3.  **Renderer Process (`src/main.js`)**:
    - Subscribes to `window.electronAPI.onShortcutPressed` in `bootstrap()` to receive events and invoke mute toggles.
    - In Settings (`setupEventListeners`), it monitors input fields for `focus` to enter "recording" state. Captures modifiers (`Ctrl`, `Alt`, `Shift`) and main keys via `keydown` event, formatting them into standard Electron Accelerator strings (e.g. `Ctrl+Alt+A`). Saves results to `config.json`.
    - Handles `toggleSingVoiceMode()`:
      - Saves pre-toggle volume values (`savedSingingValues.beatVol` and `savedSingingValues.micVol`).
      - Calculates and applies temporary volume shifts in Voice mode based on percentage values (`preset.beatChange` and `preset.micChange`) of the full CC range (127): `newVol = currentVol + Math.round(127 * (percentage / 100))`, clamped between `0` and `127`.
      - Restores the original volumes exactly when switching back to Sing mode.
