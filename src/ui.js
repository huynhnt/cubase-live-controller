import { DOM } from './dom.js';
import { states, appConfig, savedSingingValues } from './state.js';
import { midi } from './midi.js';

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
    DOM.btnFxMute.innerText = 'Bật Vang';
  } else {
    DOM.btnFxMute.classList.remove('muted');
    DOM.btnFxMute.innerText = 'Tắt Vang';
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
      DOM.keySelectorContainer.classList.add('hidden');
      DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
      DOM.btnToneToggle.classList.remove('active');
    }
    
    DOM.fxPanel.classList.remove('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
    DOM.btnReverbToggle.classList.add('active');
    
    const fxContainer = DOM.fxPanel.querySelector('.fx-container');
    const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
    if (fxContainer) fxContainer.classList.remove('hidden');
    if (presetsContainer) presetsContainer.classList.remove('hidden');
    
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
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
      DOM.btnReverbToggle.classList.remove('active');
    }
    
    DOM.fxPanel.classList.remove('hidden');
    DOM.keySelectorContainer.classList.remove('hidden');
    DOM.btnToneToggle.innerText = 'Chọn Tone ▴';
    DOM.btnToneToggle.classList.add('active');
    
    const fxContainer = DOM.fxPanel.querySelector('.fx-container');
    const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
    if (fxContainer) fxContainer.classList.add('hidden');
    if (presetsContainer) presetsContainer.classList.add('hidden');
    
    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }
    
    window.electronAPI.resizeWindow('expanded_tone_only');
  } else {
    DOM.keySelectorContainer.classList.add('hidden');
    DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
    DOM.btnToneToggle.classList.remove('active');
    
    DOM.fxPanel.classList.add('hidden');
    
    const fxContainer = DOM.fxPanel.querySelector('.fx-container');
    const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
    if (fxContainer) fxContainer.classList.remove('hidden');
    if (presetsContainer) presetsContainer.classList.remove('hidden');
    
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
    DOM.btnGetTone.addEventListener('click', () => {
      // Gửi pulse: 127 rồi 0 sau 50ms để Cubase Generic Remote nhận đúng trigger
      midi.sendCC(appConfig.midiMappings.getTone ?? 33, 127);
      setTimeout(() => midi.sendCC(appConfig.midiMappings.getTone ?? 33, 0), 50);
      states.detectedKey = null;
      states.detectedScale = null;
      states.isWaitingForAutoKey = true;
      
      DOM.btnGetTone.innerText = 'Đang dò...';
      DOM.btnGetTone.classList.add('analyzing');
      
      DOM.detectedKeyDisplay.innerText = 'Auto-Key: Đang phân tích...';
      DOM.detectedKeyDisplay.style.color = 'var(--color-orange)';
      DOM.btnSendTone.classList.remove('ready-to-send');
      
      setTimeout(() => {
        if (states.isWaitingForAutoKey) {
          states.isWaitingForAutoKey = false;
          DOM.btnGetTone.innerText = 'Lấy Tone';
          DOM.btnGetTone.classList.remove('analyzing');
          DOM.detectedKeyDisplay.innerText = 'Auto-Key: Hết thời gian dò';
          DOM.detectedKeyDisplay.style.color = '';
        }
      }, 15000);
    });
  }
  
  if (DOM.btnSendTone) {
    DOM.btnSendTone.addEventListener('click', () => {
      midi.sendCC(appConfig.midiMappings.sendTone ?? 34, 127);
      
      if (states.detectedKey !== null && states.detectedScale !== null) {
        selectKey(states.detectedKey);
        selectScale(states.detectedScale);
        autoSaveCurrentStates();
      }
      
      DOM.btnSendTone.classList.remove('ready-to-send');
      DOM.btnSendTone.style.background = 'rgba(46, 204, 113, 0.4)';
      DOM.btnSendTone.style.boxShadow = '0 0 12px var(--color-green)';
      setTimeout(() => {
        DOM.btnSendTone.style.background = '';
        DOM.btnSendTone.style.boxShadow = '';
      }, 300);
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
    const ccValue = Math.round((keyIndex / 11) * 127);
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
    const ccValue = scaleIndex === 0 ? 0 : 127;
    midi.sendCC(appConfig.midiMappings.autotuneScale ?? 32, ccValue);
  }
}

export function updateKeyDisplay() {
  const keyName = KEY_NAMES[states.currentKey] || 'C';
  const scaleName = states.currentScale === 0 ? 'Trưởng (Major)' : 'Thứ (Minor)';
  DOM.currentKeyDisplay.innerText = `${keyName} ${scaleName}`;
}

export function updateAutoKeyDisplay() {
  if (states.detectedKey !== null && states.detectedScale !== null) {
    const keyName = KEY_NAMES[states.detectedKey] || 'C';
    const scaleName = states.detectedScale === 0 ? 'Major' : 'Minor';
    DOM.detectedKeyDisplay.innerText = `Auto-Key: ${keyName} ${scaleName}`;
    DOM.detectedKeyDisplay.style.color = 'var(--color-green)';
    
    if (states.isWaitingForAutoKey) {
      states.isWaitingForAutoKey = false;
      DOM.btnGetTone.innerText = 'Lấy Tone';
      DOM.btnGetTone.classList.remove('analyzing');
      DOM.btnSendTone.classList.add('ready-to-send');
    }
  } else {
    DOM.detectedKeyDisplay.innerText = 'Auto-Key: Chưa rõ';
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
