# 🏛️ Architecture & Subsystems Specification

## 1. Electron Dual-Process Model & IPC Bridge

The application strictly separates main process responsibilities from UI renderer process logic using Electron's `contextBridge`.

### Main Process (`electron/main.js`)
- **Lifecycle & Windows**: Manages `mainWindow` (frameless, transparent, draggable overlay bar) and `updateWindow` (standalone floating update notification modal).
- **Config Persistence**: Reads and writes `%APPDATA%/cubase-live-controller/config.json`.
- **Global Shortcuts**: Handles system-wide keyboard shortcuts via `globalShortcut`.
- **Window Desktop Capture**: Interrogates open browser window titles via `desktopCapturer.getSources()` for Smart Tone song detection.
- **Auto-Updater**: Integrates `electron-updater` with GitHub Releases API.

### Preload Bridge (`electron/preload.cjs` & `electron/preload.js`)
Exposes safe IPC invocations through `window.electronAPI`:
```javascript
// Available API Methods in Renderer:
window.electronAPI.getConfig()
window.electronAPI.saveConfig(newConfig)
window.electronAPI.selectFile()
window.electronAPI.getBrowserTitle()
window.electronAPI.getAppVersion()
window.electronAPI.onShortcutPressed(callback)
window.electronAPI.onUpdateAvailable(callback)
window.electronAPI.onUpdateProgress(callback)
window.electronAPI.downloadUpdate()
window.electronAPI.quitAndInstallUpdate()
```

---

## 2. State Management Architecture (`src/state.js`)

State is divided into three key export objects:

1. `states`: Reactive UI state flags:
   - `beatMuted` (boolean)
   - `micMuted` (boolean)
   - `fxMuted` (boolean)
   - `mode` ('sing' | 'voice')
   - `selectedKey` ('C' ... 'B')
   - `selectedScale` ('major' | 'minor')
   - `activePreset` (string)

2. `appConfig`: Active persistent user preferences loaded from disk:
   - MIDI Out & In ports, channel
   - Global hotkey mappings
   - Custom presets dictionary
   - Audio analyzer duration & min frequency
   - Soundboard slots array (12 slots)
   - Opacity & Theme settings

3. `savedSingingValues`: Temporary cache holding singing reverb/delay levels before toggling to Voice mode.

---

## 3. Standalone Auto-Updater Subsystem

```
+------------------+         checkForUpdatesAndNotify()       +------------------------+
|   Main Process   | ---------------------------------------> | GitHub Releases API    |
+--------+---------+                                          +-----------+------------+
         |                                                                |
         | (update-available event)                                       | (info)
         v                                                                v
+------------------+             IPC Message: update-available       +------------------------+
|  createUpdate    | ----------------------------------------------> | electron/update-window |
|     Window()     |                                                 | (440x210px Frameless)  |
+------------------+                                                 +------------------------+
```

---

## 4. Design Token System & CSS Architecture (`src/style.css`)

The UI follows a sleek dark neon glassmorphism aesthetic:
- `--bg-color`: Deep dark translucent background `#0d0f12`.
- `--card-bg`: Card container dark grey `#181b20`.
- `--accent-cyan`: Vibrant cyan highlight `#00e5ff`.
- `--accent-green`: Success / active green `#10b981`.
- `--accent-red`: Mute / danger red `#ef4444`.
- `--accent-orange`: Smart Tone / warning orange `#f59e0b`.
- `--accent-purple`: Soundboard purple `#8b5cf6`.
