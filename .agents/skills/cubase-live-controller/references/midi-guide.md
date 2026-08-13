# 🎵 Web MIDI & Cubase Generic Remote Integration Guide

## 1. Web MIDI Engine Architecture (`src/midi.js`)

The application interacts with Cubase via Web MIDI API (`navigator.requestMIDIAccess`).

### Connection Setup
- Requires a virtual MIDI loopback driver on Windows (e.g. **loopMIDI**).
- Cổng kết nối mặc định: `loopMIDI Port`.
- Cấu hình 2 chiều:
  - `midiOutPort`: Receives CC messages sent from App $\rightarrow$ Cubase.
  - `midiInPort`: Listens for CC messages sent from Cubase $\rightarrow$ App (2-way state sync).

---

## 2. Complete MIDI Control Change (CC) Mapping Table

| Command Name | CC Address | Direction | Values & Action |
| :--- | :---: | :---: | :--- |
| **Beat Volume** | `20` | App $\leftrightarrow$ Cubase | `0` (Mute) to `127` (Max Volume) |
| **Beat Mute** | `21` | App $\leftrightarrow$ Cubase | `>=64` Muted, `<64` Unmuted |
| **Mic Volume** | `22` | App $\leftrightarrow$ Cubase | `0` to `127` |
| **Mic Mute** | `23` | App $\leftrightarrow$ Cubase | `>=64` Muted, `<64` Unmuted |
| **FX Mute** | `24` | App $\leftrightarrow$ Cubase | `>=64` Muted, `<64` Unmuted |
| **Reverb Long** | `25` | App $\leftrightarrow$ Cubase | `0` to `127` (Fader level) |
| **Reverb Short** | `26` | App $\leftrightarrow$ Cubase | `0` to `127` (Fader level) |
| **Delay** | `27` | App $\leftrightarrow$ Cubase | `0` to `127` (Fader level) |
| **Auto-Tune** | `28` | App $\leftrightarrow$ Cubase | `0` to `127` (Retune speed) |
| **Flex** | `29` | App $\leftrightarrow$ Cubase | `0` to `127` (Humanize level) |
| **Sing / Voice Mode** | `30` | App $\leftrightarrow$ Cubase | `127` = Sing Mode, `0` = Voice Mode |
| **Autotune Key** | `31` | App $\rightarrow$ Cubase | `0` to `127` evenly divided into 12 nốt: C(0), C#(11), D(23), D#(34), E(45), F(56), F#(68), G(79), G#(90), A(101), A#(113), B(124) |
| **Autotune Scale** | `32` | App $\rightarrow$ Cubase | `0` = Major (Trưởng), `127` = Minor (Thứ) |

---

## 3. Cubase Generic Remote Configuration (`2.Cubase_Live_Controller_Generic_Remote.xml`)

### Generic Remote Upper Table (MIDI Input Definition)
- Maps Control Change numbers (20..32) on MIDI Channel 1.
- `flags="1"` enables receiving MIDI messages.

### Generic Remote Lower Table (VST Mixer Assignment)
- **Beat Track**: Track name in Cubase must be named **`Beat`**.
- **Mic Track**: Track name in Cubase must be named **`Mic`**.
- **Auto-Tune VST**: Plugin must be placed on **Insert Slot 1** of track **`Mic`**.
  - `inserts/slot1:param2` $\rightarrow$ Autotune Key (CC 31)
  - `inserts/slot1:param3` $\rightarrow$ Autotune Scale (CC 32)
