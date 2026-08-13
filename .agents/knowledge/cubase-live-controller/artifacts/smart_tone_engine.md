# 🧠 Smart Tone Engine Technical Blueprint

## 1. Overview & Components

The **Smart Tone** subsystem replaces third-party Auto-Key VST plugins by providing an internal dual-mode key detection engine:

1. **Title Parsing Mode (`src/tone-parser.js`)**:
   - Invocated via `window.electronAPI.getBrowserTitle()`.
   - Main process uses Electron `desktopCapturer` to inspect active Chrome/Edge/Brave window titles.
   - Applies regex patterns matching musical keys (e.g. `Tone D# Minor`, `Tone C Major`, `Tone Gm`, `Karaoke Tone Am`).

2. **Web Audio Pitch Analysis (`src/audio-analyzer.js`)**:
   - Captures system or microphone audio using `navigator.mediaDevices.getUserMedia()`.
   - Uses Web Audio API `AudioContext` and `AnalyserNode`.
   - Applies YIN autocorrelation pitch detection over 8-second sampling intervals to compute dominant frequencies and map them to standard equal temperament pitch classes.

## 2. Direct MIDI Key & Scale Dispatch

Upon detecting a key (e.g., `D# Minor`):
- `selectKey('D#')` sends MIDI CC `31` with value `34`.
- `selectScale('minor')` sends MIDI CC `32` with value `127`.
- Updates UI nốt nhạc buttons immediately to reflect the detected tone (`Smart Tone: D# Minor`).
