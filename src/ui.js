import { DOM } from './dom.js';
import { states, appConfig, savedSingingValues } from './state.js';
import { midi } from './midi.js';
import { parseToneFromTitle, extractSongInfo } from './tone-parser.js';
import { analyzeAudioKey, stopAnalysis } from './audio-analyzer.js';

import { CUBASE_DB_CURVE } from './cubase_curve.js';

export function midiToDbString(value, format = 'db') {
  const val = parseInt(value);
  if (isNaN(val)) return value;
  
  if (format === 'percent') {
    return Math.round((val / 127) * 100) + '%';
  }

  // Lấy thẳng kết quả từ bảng nội suy siêu chuẩn 128 điểm của Cubase
  if (val >= 0 && val <= 127) {
    return CUBASE_DB_CURVE[val];
  }
  
  return '-∞ dB';
}

export function updateSliderFill(slider, fillElement, valElement) {
  if (!slider) return;
  const percent = (slider.value / slider.max) * 100;
  if (fillElement) fillElement.style.width = percent + '%';
  if (valElement) {
    const format = slider.getAttribute('data-format') || ((slider.id && (slider.id.includes('autotune') || slider.id.includes('flex'))) ? 'percent' : 'db');
    
    if (format === 'custom') {
      const min = parseFloat(slider.getAttribute('data-min') || 0);
      const max = parseFloat(slider.getAttribute('data-max') || 100);
      const val = parseInt(slider.value) || 0;
      const displayVal = min + (max - min) * (val / 127);
      valElement.innerText = (Number.isInteger(displayVal) ? displayVal : displayVal.toFixed(1));
    } else {
      valElement.innerText = midiToDbString(slider.value, format);
    }
  }
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
    DOM.btnReverbToggle.innerText = 'Hiệu ứng ▴';
    DOM.btnReverbToggle.classList.add('active');

    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }

    const fxCount = appConfig.effects ? appConfig.effects.length : 0;
    const addBtnHeight = fxCount >= 10 ? 0 : 40;
    const customHeight = 120 + (fxCount * 40) + addBtnHeight;
    window.electronAPI.resizeWindow('expanded', customHeight);
  } else {
    DOM.fxPanel.classList.add('hidden');
    DOM.btnReverbToggle.innerText = 'Hiệu ứng ▾';
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
      DOM.btnReverbToggle.innerText = 'Hiệu ứng ▾';
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

export const KEY_NAMES_MAJOR = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const KEY_NAMES_MINOR = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

export function updateKeyButtonsText() {
  if (!DOM.keySelectorContainer) return;
  const isMajor = states.currentScale === 0;
  const names = isMajor ? KEY_NAMES_MAJOR : KEY_NAMES_MINOR;
  const keyButtons = DOM.keySelectorContainer.querySelectorAll('.key-btn');
  keyButtons.forEach(btn => {
    const k = parseInt(btn.getAttribute('data-key'));
    if (!isNaN(k) && names[k]) {
      btn.innerText = names[k];
    }
  });
}

export function initKeySelector() {
  updateKeyButtonsText();
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
    let ccValue = 0;
    if (appConfig.autotuneVersion === 'pro') {
      const keysArray = appConfig.customAutotuneKeys || [0, 12, 24, 35, 47, 58, 70, 82, 93, 104, 125, 127];
      ccValue = keysArray[keyIndex] !== undefined ? keysArray[keyIndex] : Math.round((keyIndex / 12) * 127);
    } else {
      ccValue = Math.round((keyIndex / 12) * 127);
    }
    midi.sendCC(appConfig.midiMappings.autotuneKey ?? 31, ccValue);
    updateKeyDisplay();
  }
}

export function selectScale(scaleIndex, sendMidi = true) {
  states.currentScale = scaleIndex;
  updateKeyButtonsText();

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
    let ccValue = 0;
    if (appConfig.autotuneVersion === 'pro') {
      const scalesArray = appConfig.customAutotuneScales || [0, 5];
      ccValue = scalesArray[scaleIndex] !== undefined ? scalesArray[scaleIndex] : (scaleIndex === 0 ? 0 : 5);
    } else {
      const autoTuneScaleIndex = scaleIndex === 0 ? 1 : 2;
      ccValue = Math.round((autoTuneScaleIndex / 8) * 127);
    }
    midi.sendCC(appConfig.midiMappings.autotuneScale ?? 32, ccValue);
    updateKeyDisplay();
  }
}

export function updateKeyDisplay() {
  const isMajor = states.currentScale === 0;
  const names = isMajor ? KEY_NAMES_MAJOR : KEY_NAMES_MINOR;
  const keyName = names[states.currentKey] || 'C';
  const scaleName = isMajor ? 'Trưởng (Major)' : 'Thứ (Minor)';
  DOM.currentKeyDisplay.innerText = `${keyName} ${scaleName}`;
}

export function updateAutoKeyDisplay() {
  const METHOD_BADGE = {
    'title': '📋',
    'audio': '🎤',
  };

  if (states.detectedKey !== null && states.detectedScale !== null) {
    const isMajor = states.detectedScale === 0;
    const names = isMajor ? KEY_NAMES_MAJOR : KEY_NAMES_MINOR;
    const keyName = names[states.detectedKey] || 'C';
    const scaleName = isMajor ? 'Major' : 'Minor';
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
      DOM.btnReverbToggle.innerText = 'Hiệu ứng ▾';
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
      DOM.btnReverbToggle.innerText = 'Hiệu ứng ▾';
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
    
    const fxCount = appConfig.effects ? appConfig.effects.length : 0;
    const addBtnHeight = fxCount >= 10 ? 0 : 40;
    const customHeight = 120 + (fxCount * 40) + addBtnHeight;
    window.electronAPI.resizeWindow('expanded', customHeight);
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
    beatMuted: states.beatMuted,
    micMuted: states.micMuted,
    fxMuted: states.fxMuted,
    currentMode: states.currentMode,
    activePreset: states.activePreset,
    currentKey: states.currentKey,
    currentScale: states.currentScale
  };

  if (!appConfig.effects) appConfig.effects = [];
  appConfig.effects.forEach(fx => {
    const slider = document.getElementById(`slider-fx-${fx.id}`);
    if (slider) {
      fx.value = parseInt(slider.value);
    }
  });

  appConfig.theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';

  // Không tự động lưu đè cấu hình vào preset khi kéo slider.
  // Người dùng phải bấm nút Lưu (dấu +) để ghi đè.

  await window.electronAPI.saveConfig(appConfig);
}

// Render Hiệu ứng động
export function renderEffects() {
  if (!DOM.effectsContainer) return;
  DOM.effectsContainer.innerHTML = '';
  
  if (!appConfig.effects) appConfig.effects = [];
  
  appConfig.effects.forEach(fx => {
    const row = document.createElement('div');
    row.className = 'fx-row';
    
    // Luôn hiển thị nút bật tắt, dùng CSS switch
    const isOn = fx.isEnabled !== false;
    const toggleHtml = `
      <label class="fx-switch" title="Bật/Tắt hiệu ứng" style="margin-right: 12px; cursor: pointer;">
        <input type="checkbox" class="fx-toggle-checkbox" data-id="${fx.id}" ${isOn ? 'checked' : ''} style="display: none;">
        <div class="fx-switch-slider ${isOn ? 'on' : 'off'}" style="width: 32px; height: 18px; background: ${isOn ? '#2ecc71' : 'rgba(255,255,255,0.2)'}; border-radius: 9px; position: relative; transition: 0.2s;">
          <div class="fx-switch-knob" style="width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 2px; left: ${isOn ? '16px' : '2px'}; transition: 0.2s;"></div>
        </div>
      </label>
    `;
    
    const isHex = fx.color && fx.color.startsWith('#');
    const labelClass = isHex ? '' : `label-${fx.color}`;
    const fillClass = isHex ? '' : `fill-${fx.color}`;
    const sliderClass = isHex ? `custom-slider-${fx.id}` : fx.color;
    
    const labelStyle = isHex ? `color: ${fx.color}; border-color: ${fx.color};` : '';
    const fillStyle = isHex ? `background: ${fx.color};` : '';
    
    if (isHex) {
      let styleEl = document.getElementById(`style-fx-${fx.id}`);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `style-fx-${fx.id}`;
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `
        input[type=range].custom-slider-${fx.id}::-webkit-slider-thumb { border-color: ${fx.color} !important; box-shadow: 0 0 10px ${fx.color} !important; }
      `;
    }
    
    row.innerHTML = `
      ${toggleHtml}
      <span class="fx-label ${labelClass}" data-id="${fx.id}" title="Nháy đúp để sửa cấu hình" style="${labelStyle}; display: inline-flex; align-items: center; justify-content: space-between; padding: 0 8px;">
        ${fx.name}
        <button class="btn-fx-edit" data-id="${fx.id}" title="Sửa hiệu ứng này" style="background:none; border:none; color:inherit; opacity: 0.6; cursor:pointer; font-size: 12px; padding:0; margin-left:4px;">⚙️</button>
      </span>
      <div class="fx-slider-wrapper">
        <input type="range" id="slider-fx-${fx.id}" class="${sliderClass}" min="0" max="127" value="${fx.value ?? 24}" data-format="${fx.format || 'db'}" data-min="${fx.min ?? 0}" data-max="${fx.max ?? 100}">
        <div class="fx-track-fill ${fillClass}" id="fill-fx-${fx.id}" style="${fillStyle}"></div>
      </div>
      <span class="fx-value" id="val-fx-${fx.id}">${fx.value ?? 24}</span>
    `;
    
    DOM.effectsContainer.appendChild(row);
    
    const slider = document.getElementById(`slider-fx-${fx.id}`);
    const fill = document.getElementById(`fill-fx-${fx.id}`);
    const valText = document.getElementById(`val-fx-${fx.id}`);
    const label = row.querySelector('.fx-label');
    const toggleBtn = row.querySelector('.fx-toggle-btn');
    const editBtn = row.querySelector('.btn-fx-edit');
    
    updateSliderFill(slider, fill, valText);
    
    slider.addEventListener('input', (e) => {
      fx.value = parseInt(e.target.value);
      updateSliderFill(slider, fill, valText);
      import('./midi.js').then(({midi}) => midi.sendCC(fx.ccValue, fx.value));
    });
    
    slider.addEventListener('change', autoSaveCurrentStates);
    
    slider.addEventListener('dblclick', () => {
      slider.value = 100;
      slider.dispatchEvent(new Event('input'));
      slider.dispatchEvent(new Event('change'));
    });
    
    label.addEventListener('dblclick', () => {
      openEffectEditModal(fx.id);
    });
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEffectEditModal(fx.id);
      });
    }
    
    const toggleCheckbox = row.querySelector('.fx-toggle-checkbox');
    const switchSlider = row.querySelector('.fx-switch-slider');
    const switchKnob = row.querySelector('.fx-switch-knob');
    
    if (toggleCheckbox) {
      toggleCheckbox.addEventListener('change', (e) => {
        fx.isEnabled = e.target.checked;
        const isOn = fx.isEnabled;
        
        switchSlider.style.background = isOn ? '#2ecc71' : 'rgba(255,255,255,0.2)';
        switchKnob.style.left = isOn ? '16px' : '2px';
        
        if (fx.ccToggle > 0) {
          import('./midi.js').then(({midi}) => midi.sendCC(fx.ccToggle, isOn ? 127 : 0));
        }
        autoSaveCurrentStates();
      });
    }
  });
  
  if (appConfig.effects.length >= 10) {
    if(DOM.btnAddEffect) DOM.btnAddEffect.style.display = 'none';
  } else {
    if(DOM.btnAddEffect) DOM.btnAddEffect.style.display = 'inline-block';
  }
  
  if (states.isFxPanelOpen) {
    const fxCount = appConfig.effects ? appConfig.effects.length : 0;
    const addBtnHeight = fxCount >= 10 ? 0 : 50;
    const customHeight = 120 + (fxCount * 40) + addBtnHeight + 20; // Thêm 20px padding
    window.electronAPI.resizeWindow('expanded', customHeight);
  }
}

function getUsedCCs() {
  const usedCCs = new Set();
  if (appConfig.midiMappings) {
    Object.values(appConfig.midiMappings).forEach(val => {
      if (typeof val === 'number') usedCCs.add(val);
    });
  }
  if (appConfig.effects) {
    appConfig.effects.forEach(fx => {
      if (typeof fx.ccValue === 'number' && fx.ccValue >= 0) usedCCs.add(fx.ccValue);
      if (typeof fx.ccToggle === 'number' && fx.ccToggle >= 0) usedCCs.add(fx.ccToggle);
    });
  }
  return usedCCs;
}

function findNextAvailableValueCC() {
  const usedCCs = getUsedCCs();
  // Khuyên dùng: 20 - 29 (Nhóm thanh kéo)
  for (let i = 20; i <= 63; i++) {
    if (!usedCCs.has(i)) return i;
  }
  return 0;
}

function findNextAvailableToggleCC() {
  const usedCCs = getUsedCCs();
  // Khuyên dùng: 102 - 111 (Nhóm công tắc)
  for (let i = 102; i <= 119; i++) {
    if (!usedCCs.has(i)) return i;
  }
  return 0;
}

export function openEffectEditModal(id) {
  let fx = id ? appConfig.effects.find(e => e.id === id) : null;
  const existingCCs = appConfig.effects
    .filter(e => e.id !== (fx ? fx.id : null))
    .map(e => ({ name: e.name, ccValue: e.ccValue, ccToggle: e.ccToggle }));
    
  const mappedCCs = [];
  if (appConfig.midiMappings) {
    for (const [key, val] of Object.entries(appConfig.midiMappings)) {
      if (typeof val === 'number' && val >= 0) {
        mappedCCs.push({ name: key, cc: val });
      }
    }
  }

  if (!fx) {
    let maxEffectNum = 0;
    appConfig.effects.forEach(e => {
      if (e.name && e.name.toUpperCase().startsWith('EFFECT ')) {
        const num = parseInt(e.name.substring(7));
        if (!isNaN(num) && num > maxEffectNum) {
          maxEffectNum = num;
        }
      }
    });
    const nextName = `EFFECT ${maxEffectNum + 1}`;
    fx = { isNew: true, name: nextName, ccValue: findNextAvailableValueCC(), ccToggle: findNextAvailableToggleCC() };
  } else {
    // Clone to avoid mutating original state before save
    fx = JSON.parse(JSON.stringify(fx));
  }
  fx.existingCCs = existingCCs;
  fx.mappedCCs = mappedCCs;
  
  window.electronAPI.openEffectEditWindow(fx);
}
if (window.electronAPI && window.electronAPI.onSaveEffectEdit) {
  window.electronAPI.onSaveEffectEdit((newFxData) => {
    if (newFxData.deleteId) {
      appConfig.effects = appConfig.effects.filter(e => e.id !== newFxData.deleteId);
    } else {
      if (newFxData.ccToggle === -1) {
        newFxData.ccToggle = findNextAvailableToggleCC();
      }
      const isNew = !appConfig.effects.find(e => e.id === newFxData.id);
      if (isNew) {
        if (appConfig.effects.length >= 10) {
          alert('Tối đa 10 hiệu ứng!');
          return;
        }
        appConfig.effects.push(newFxData);
        if (appConfig.presets) {
          Object.keys(appConfig.presets).forEach(presetName => {
            if (appConfig.presets[presetName]) {
              appConfig.presets[presetName][newFxData.id] = newFxData.value;
            }
          });
        }
      } else {
        const index = appConfig.effects.findIndex(e => e.id === newFxData.id);
        appConfig.effects[index] = newFxData;
      }
    }
    
    // Nếu có preset nào bị mất trường của các effect, cập nhật lại
    if (appConfig.presets) {
      Object.keys(appConfig.presets).forEach(presetName => {
        appConfig.effects.forEach(fx => {
          if (appConfig.presets[presetName][fx.id] === undefined) {
            appConfig.presets[presetName][fx.id] = fx.value;
          }
        });
      });
    }
    renderEffects();
    autoSaveCurrentStates();
  });
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
