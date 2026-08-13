# 🎵 MIDI Protocol & Generic Remote Specification

## 1. MIDI CC Registry

| CC Number | Function Name | Range & Interpretation |
| :---: | :--- | :--- |
| **20** | Beat Volume | `0` (Mute) to `127` (Max Volume) |
| **21** | Beat Mute Toggle | `>=64` Muted, `<64` Unmuted |
| **22** | Mic Volume | `0` to `127` |
| **23** | Mic Mute Toggle | `>=64` Muted, `<64` Unmuted |
| **24** | FX Mute Toggle | `>=64` Muted, `<64` Unmuted |
| **25** | Reverb Long | `0` to `127` |
| **26** | Reverb Short | `0` to `127` |
| **27** | Delay | `0` to `127` |
| **28** | Auto-Tune | `0` to `127` |
| **29** | Flex | `0` to `127` |
| **30** | Mode Switch | `127` (Sing Mode), `0` (Voice Mode) |
| **31** | Autotune Key | Values mapped to 12 notes: C=0, C#=11, D=23, D#=34, E=45, F=56, F#=68, G=79, G#=90, A=101, A#=113, B=124 |
| **32** | Autotune Scale | `0` = Major (Trưởng), `127` = Minor (Thứ) |

## 2. Cubase Remote Configuration Map

The included configuration XML file `2.Cubase_Live_Controller_Generic_Remote.xml` maps:
- `Beat` track $\rightarrow$ CC 20 (Volume) & CC 21 (Mute)
- `Mic` track $\rightarrow$ CC 22 (Volume) & CC 23 (Mute)
- Insert Slot 1 on `Mic` track (Auto-Tune VST):
  - Parameter 2 $\rightarrow$ Key (CC 31)
  - Parameter 3 $\rightarrow$ Scale (CC 32)
