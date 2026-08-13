import { DOM } from './dom.js';
import { states, appConfig, savedSingingValues } from './state.js';
import { midi } from './midi.js';
import { parseToneFromTitle, extractSongInfo } from './tone-parser.js';
import { analyzeAudioKey, stopAnalysis } from './audio-analyzer.js';

export function updateSliderFill(slider, fillElement, valElement) {
  if (!slider) return;
  const percent = (slider.value / slider.max) * 100;
  if (fillElement) fillElement.style.width = percent + '%';
  if (valElement) valElement.innerText = slider.value;
}

export function updateStatus(text, isConnected = true) {
  DOM.statusText.innerText = text;
  if (isConnected) {
    DOM.statusIndicator.className = 'status-indicator connected';
  } else {
    DOM.statusIndicator.className = 'status-indicator disconnected';
  }
}

export function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    if (DOM.btnThemeToggle) {
      DOM.btnThemeToggle.innerText = '🌙';
      DOM.btnThemeToggle.title = 'Chuyển sang Chế độ Tối';
    }
  } else {
    document.body.classList.remove('light-theme');
    if (DOM.btnThemeToggle) {
      DOM.btnThemeToggle.innerText = '☀️';
      DOM.btnThemeToggle.title = 'Chuyển sang Chế độ Sáng';
    }
  }
}

export function toggleTheme() {
  if (!appConfig) return;
  const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  autoSaveCurrentStates();
}

export function setBeatMuteUI(isMuted) {
  states.beatMuted = isMuted;
  if (isMuted) {
    DOM.btnBeatMute.classList.add('muted');
    DOM.btnBeatMute.innerText = 'Bật Nhạc';
  } else {
    DOM.btnBeatMute.classList.remove('muted');
    DOM.btnBeatMute.innerText = 'Tắt Nhạc';
  }
}

export function setMicMuteUI(isMuted) {
  states.micMuted = isMuted;
  if (isMuted) {
    DOM.btnMicMute.classList.add('muted');
    DOM.btnMicMute.innerText = 'Bật Mic';
  } else {
    DOM.btnMicMute.classList.remove('muted');
    DOM.btnMicMute.innerText = 'Tắt Mic';
  }
}

export function setFxMuteUI(isMuted) {
  states.fxMuted = isMuted;
  if (isMuted) {
    DOM.btnFxMute.classList.add('muted');
    DOM.btnFxMute.innerText = 'Bật AutoTune';
  } else {
    DOM.btnFxMute.classList.remove('muted');
    DOM.btnFxMute.innerText = 'Tắt AutoTune';
  }
}

export function toggleFxPanel() {
  states.isFxPanelOpen = !states.isFxPanelOpen;

  if (states.isFxPanelOpen) {
    if (states.isAboutOpen) {
      states.isAboutOpen = false;
      DOM.aboutPanel.classList.add('hidden');
      DOM.btnAboutToggle.classList.remove('active');
    }
    if (states.isKeySelectorOpen) {
      states.isKeySelectorOpen = false;
      if (DOM.keySelectorPanel) DOM.keySelectorPanel.classList.add('hidden');
      DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
      DOM.btnToneToggle.classList.remove('active');
    }
    if (states.isSoundboardOpen) {
      states.isSoundboardOpen = false;
      DOM.soundboardPanel.classList.add('hidden');
      DOM.btnSoundboardToggle.innerText = 'FX ▾';
      DOM.btnSoundboardToggle.classList.remove('active');
    }
    DOM.fxPanel.classList.remove('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
    DOM.btnReverbToggle.classList.add('active');

    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }

    window.electronAPI.resizeWindow('expanded');
  } else {
    DOM.fxPanel.classList.add('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
    DOM.btnReverbToggle.classList.remove('active');

    window.electronAPI.resizeWindow('collapsed');
  }
}

export function toggleKeySelector() {
  states.isKeySelectorOpen = !states.isKeySelectorOpen;

  if (states.isKeySelectorOpen) {
    if (states.isAboutOpen) {
      states.isAboutOpen = false;
      DOM.aboutPanel.classList.add('hidden');
      DOM.btnAboutToggle.classList.remove('active');
    }
    if (states.isFxPanelOpen) {
      states.isFxPanelOpen = false;
      DOM.fxPanel.classList.add('hidden');
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
      DOM.btnReverbToggle.classList.remove('active');
    }
    if (states.isSoundboardOpen) {
      states.isSoundboardOpen = false;
      DOM.soundboardPanel.classList.add('hidden');
      DOM.btnSoundboardToggle.innerText = 'FX ▾';
      DOM.btnSoundboardToggle.classList.remove('active');
    }
    if (DOM.keySelectorPanel) DOM.keySelectorPanel.classList.remove('hidden');
    DOM.btnToneToggle.innerText = 'Chọn Tone ▴';
    DOM.btnToneToggle.classList.add('active');

    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }

    window.electronAPI.resizeWindow('expanded_tone_only');
  } else {
    if (DOM.keySelectorPanel) DOM.keySelectorPanel.classList.add('hidden');
    DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
    DOM.btnToneToggle.classList.remove('active');

    window.electronAPI.resizeWindow('collapsed');
  }
}

export const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function initKeySelector() {
  const keyButtons = DOM.keySelectorContainer.querySelectorAll('.key-btn');
  const scaleButtons = DOM.keySelectorContainer.querySelectorAll('.scale-btn');

  keyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const keyIndex = parseInt(btn.getAttribute('data-key'));
      selectKey(keyIndex);
      autoSaveCurrentStates();
    });
  });

  scaleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scaleIndex = parseInt(btn.getAttribute('data-scale'));
      selectScale(scaleIndex);
      autoSaveCurrentStates();
    });
  });

  if (DOM.btnGetTone) {
    DOM.btnGetTone.addEventListener('click', async () => {
      if (states.isWaitingForAutoKey) {
        // Huỷ nếu đang phân tích
        states.isWaitingForAutoKey = false;
        stopAnalysis();
        DOM.btnGetTone.innerText = 'Tự Động Lấy Tone';
        DOM.btnGetTone.classList.remove('analyzing');
        DOM.detectedKeyDisplay.innerText = 'Smart Tone: Đã hủy';
        DOM.detectedKeyDisplay.style.color = '';
        return;
      }

      states.detectedKey = null;
      states.detectedScale = null;
      states.detectionMethod = null;
      states.isWaitingForAutoKey = true;

      // ===== TIER 1: Parse tiêu đề trình duyệt =====
      try {
        DOM.btnGetTone.innerText = 'Đọc tiêu đề...';
        DOM.btnGetTone.classList.add('analyzing');
        DOM.detectedKeyDisplay.innerText = '🔍 Tier 1...';
        DOM.detectedKeyDisplay.style.color = 'var(--color-orange)';

        let browserTitle = null;
        if (window.electronAPI.getBrowserTitle) {
          browserTitle = await window.electronAPI.getBrowserTitle();
        }

        if (browserTitle) {
          const foundTone = parseToneFromTitle(browserTitle);
          if (foundTone) {
            states.detectedKey = foundTone.key;
            states.detectedScale = foundTone.scale;
            states.detectionMethod = 'title';
            states.isWaitingForAutoKey = false;
            
            // Tự động áp dụng kết quả
            selectKey(states.detectedKey);
            selectScale(states.detectedScale);

            DOM.btnGetTone.innerText = 'Tự Động Lấy Tone';
            DOM.btnGetTone.classList.remove('analyzing');
            updateAutoKeyDisplay();
            return;
          }
        }
      } catch (tier1Err) {
        console.warn('Tier 1 lỗi:', tier1Err.message);
      }

      // ===== TIER 2: Web Audio Analysis =====
      DOM.detectedKeyDisplay.innerText = '🎤 Tier 2...';
      DOM.detectedKeyDisplay.style.color = 'var(--color-orange)';

      try {
        const durationMs = appConfig.audioAnalyzer?.duration ? appConfig.audioAnalyzer.duration * 1000 : 8000;
        const minFreq = appConfig.audioAnalyzer?.minFreq ?? 27.5;
        
        DOM.btnGetTone.innerText = `Đang dò... (${durationMs/1000}s)`;
        
        const audioResult = await analyzeAudioKey(durationMs, minFreq, (progress) => {
          const sec = Math.round(((100 - progress) / 100) * (durationMs / 1000));
          DOM.btnGetTone.innerText = `Dò âm... ${sec}s`;
        });

        states.detectedKey = audioResult.key;
        states.detectedScale = audioResult.scale;
        states.detectionMethod = 'audio';
        
        // Tự động áp dụng kết quả
        selectKey(states.detectedKey);
        selectScale(states.detectedScale);

        states.isWaitingForAutoKey = false;
        DOM.btnGetTone.innerText = 'Tự Động Lấy Tone';
        DOM.btnGetTone.classList.remove('analyzing');
        updateAutoKeyDisplay();
      } catch (audioErr) {
        // Tất cả 3 tier đều thất bại
        states.isWaitingForAutoKey = false;
        DOM.btnGetTone.innerText = 'Lấy Tone';
        DOM.btnGetTone.classList.remove('analyzing');
        DOM.detectedKeyDisplay.innerText = `Không tìm được tone: ${audioErr.message}`;
        DOM.detectedKeyDisplay.style.color = 'var(--color-red, #e74c3c)';
        setTimeout(() => {
          DOM.detectedKeyDisplay.innerText = 'Smart Tone: Chưa rõ';
          DOM.detectedKeyDisplay.style.color = '';
        }, 5000);
      }
    });
  }

  selectKey(states.currentKey, false);
  selectScale(states.currentScale, false);
}

export function selectKey(keyIndex, sendMidi = true) {
  states.currentKey = keyIndex;

  const keyButtons = DOM.keySelectorContainer.querySelectorAll('.key-btn');
  keyButtons.forEach(btn => {
    const btnKey = parseInt(btn.getAttribute('data-key'));
    if (btnKey === keyIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateKeyDisplay();

  if (sendMidi) {
    // Cubase dùng: key = round((cc/127) * 12)
    // → Ngược lại: cc = round((keyIndex / 12) * 127)
    const ccValue = Math.round((keyIndex / 12) * 127);
    midi.sendCC(appConfig.midiMappings.autotuneKey ?? 31, ccValue);
  }
}

export function selectScale(scaleIndex, sendMidi = true) {
  states.currentScale = scaleIndex;

  const scaleButtons = DOM.keySelectorContainer.querySelectorAll('.scale-btn');
  scaleButtons.forEach(btn => {
    const btnScale = parseInt(btn.getAttribute('data-scale'));
    if (btnScale === scaleIndex) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateKeyDisplay();

  if (sendMidi) {
    // Auto-Tune EFX: Chromatic(0) Major(1) NatMinor(2) HarmMinor(3)
    //                MelMinor(4) Pentatonic(5) PentMinor(6) Blues(7) → N=8
    // Cubase dùng: scale = round((cc/127) * 8)
    // → Ngược lại: cc = round((targetIndex / 8) * 127)
    // Major (index 1) → cc = round(1/8*127) = 16
    // Natural Minor (index 2) → cc = round(2/8*127) = 32
    const autoTuneScaleIndex = scaleIndex === 0 ? 1 : 2;
    const ccValue = Math.round((autoTuneScaleIndex / 8) * 127);
    midi.sendCC(appConfig.midiMappings.autotuneScale ?? 32, ccValue);
  }
}

export function updateKeyDisplay() {
  const keyName = KEY_NAMES[states.currentKey] || 'C';
  const scaleName = states.currentScale === 0 ? 'Trưởng (Major)' : 'Thứ (Minor)';
  DOM.currentKeyDisplay.innerText = `${keyName} ${scaleName}`;
}

export function updateAutoKeyDisplay() {
  const METHOD_BADGE = {
    'title': '📋',
    'audio': '🎤',
  };

  if (states.detectedKey !== null && states.detectedScale !== null) {
    const keyName = KEY_NAMES[states.detectedKey] || 'C';
    const scaleName = states.detectedScale === 0 ? 'Major' : 'Minor';
    const badge = states.detectionMethod ? ` — ${METHOD_BADGE[states.detectionMethod] || ''}` : '';
    DOM.detectedKeyDisplay.innerText = `${keyName} ${scaleName}${badge}`;
    DOM.detectedKeyDisplay.style.color = 'var(--color-green)';

    if (states.isWaitingForAutoKey) {
      states.isWaitingForAutoKey = false;
      DOM.btnGetTone.innerText = 'Lấy Tone';
      DOM.btnGetTone.classList.remove('analyzing');
    }
  } else {
    DOM.detectedKeyDisplay.innerText = 'Smart Tone: Chưa rõ';
    DOM.detectedKeyDisplay.style.color = '';
  }
}

export function toggleAboutPanel() {
  states.isAboutOpen = !states.isAboutOpen;

  if (states.isAboutOpen) {
    if (states.isFxPanelOpen) {
      states.isFxPanelOpen = false;
      DOM.fxPanel.classList.add('hidden');
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
      DOM.btnReverbToggle.classList.remove('active');
    }
    if (states.isKeySelectorOpen) {
      states.isKeySelectorOpen = false;
      DOM.keySelectorContainer.classList.add('hidden');
      DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
      DOM.btnToneToggle.classList.remove('active');
    }
    if (states.isSoundboardOpen) {
      states.isSoundboardOpen = false;
      DOM.soundboardPanel.classList.add('hidden');
      DOM.btnSoundboardToggle.innerText = 'FX ▾';
      DOM.btnSoundboardToggle.classList.remove('active');
    }
    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }

    DOM.aboutPanel.classList.remove('hidden');
    DOM.btnAboutToggle.classList.add('active');
    window.electronAPI.resizeWindow('settings');
  } else {
    DOM.aboutPanel.classList.add('hidden');
    DOM.btnAboutToggle.classList.remove('active');
    window.electronAPI.resizeWindow('collapsed');
  }
}

export function toggleSoundboardPanel() {
  states.isSoundboardOpen = !states.isSoundboardOpen;
  
  if (states.isSoundboardOpen) {
    if (states.isAboutOpen) {
      states.isAboutOpen = false;
      DOM.aboutPanel.classList.add('hidden');
      DOM.btnAboutToggle.classList.remove('active');
    }
    if (states.isFxPanelOpen) {
      states.isFxPanelOpen = false;
      DOM.fxPanel.classList.add('hidden');
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
      DOM.btnReverbToggle.classList.remove('active');
    }
    if (states.isKeySelectorOpen) {
      states.isKeySelectorOpen = false;
      DOM.keySelectorContainer.classList.add('hidden');
      DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
      DOM.btnToneToggle.classList.remove('active');
    }
    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }
    
    DOM.soundboardPanel.classList.remove('hidden');
    DOM.btnSoundboardToggle.innerText = 'FX ▴';
    DOM.btnSoundboardToggle.classList.add('active');
    
    window.electronAPI.resizeWindow('expanded');
  } else {
    DOM.soundboardPanel.classList.add('hidden');
    DOM.btnSoundboardToggle.innerText = 'FX ▾';
    DOM.btnSoundboardToggle.classList.remove('active');
    
    window.electronAPI.resizeWindow('collapsed');
  }
}

// Hàm UI đóng mở cấu hình cài đặt
export function closeSettingsPanelUI() {
  states.isSettingsOpen = false;
  DOM.settingsPanel.classList.add('hidden');
  DOM.btnSettingsToggle.classList.remove('active');
}

// Tự động lưu cài đặt
export async function autoSaveCurrentStates() {
  if (!appConfig) return;

  appConfig.lastValues = {
    beatVol: parseInt(DOM.sliderBeatVol.value),
    micVol: parseInt(DOM.sliderMicVol.value),
    reverbLong: parseInt(DOM.sliders.reverbLong.value),
    reverbShort: parseInt(DOM.sliders.reverbShort.value),
    delay: parseInt(DOM.sliders.delay.value),
    autotune: parseInt(DOM.sliders.autotune.value),
    flex: parseInt(DOM.sliders.flex.value),
    beatMuted: states.beatMuted,
    micMuted: states.micMuted,
    fxMuted: states.fxMuted,
    currentMode: states.currentMode,
    activePreset: states.activePreset,
    currentKey: states.currentKey,
    currentScale: states.currentScale
  };

  appConfig.theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';

  const defaultPresets = ["Mặc định", "Bolero", "Remix", "Lofi"];
  if (states.activePreset && !defaultPresets.includes(states.activePreset) && appConfig.presets && appConfig.presets[states.activePreset]) {
    appConfig.presets[states.activePreset] = {
      reverbLong: parseInt(DOM.sliders.reverbLong.value),
      reverbShort: parseInt(DOM.sliders.reverbShort.value),
      delay: parseInt(DOM.sliders.delay.value),
      autotune: parseInt(DOM.sliders.autotune.value),
      flex: parseInt(DOM.sliders.flex.value)
    };
  }

  await window.electronAPI.saveConfig(appConfig);
}

// --- AUTO UPDATER UI LOGIC ---
// --- AUTO UPDATER MANUAL CHECK BTN IN SETTINGS ---
if (window.electronAPI && window.electronAPI.checkForUpdates) {
  const btnCheckUpdates = document.getElementById('btn-check-updates');

  if (btnCheckUpdates) {
    btnCheckUpdates.addEventListener('click', () => {
      let originalText = btnCheckUpdates.innerHTML;
      try {
        btnCheckUpdates.innerHTML = '<span style="font-size: 14px;">⏳</span> Đang kiểm tra...';
        btnCheckUpdates.disabled = true;
        
        window.electronAPI.checkForUpdates();
        
        setTimeout(() => {
          if (btnCheckUpdates.disabled) {
            btnCheckUpdates.innerHTML = '<span style="font-size: 14px;">⚠️</span> Không phản hồi';
            setTimeout(() => {
              btnCheckUpdates.innerHTML = originalText;
              btnCheckUpdates.disabled = false;
            }, 2000);
          }
        }, 5000);
      } catch (err) {
        btnCheckUpdates.innerHTML = 'Lỗi JS: ' + err.message;
      }
    });

    if (window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(() => {
        btnCheckUpdates.innerHTML = '<span style="font-size: 14px;">✅</span> Đã thấy bản mới!';
        btnCheckUpdates.disabled = false;
      });
    }

    if (window.electronAPI.onUpdateNotAvailable) {
      window.electronAPI.onUpdateNotAvailable(() => {
        btnCheckUpdates.innerHTML = '<span style="font-size: 14px;">✔️</span> Bạn đang dùng bản mới nhất!';
        btnCheckUpdates.disabled = false;
      });
    }

    if (window.electronAPI.onUpdateError) {
      window.electronAPI.onUpdateError(() => {
        btnCheckUpdates.innerHTML = '<span style="font-size: 14px;">❌</span> Lỗi kiểm tra!';
        btnCheckUpdates.disabled = false;
      });
    }
  }
}
