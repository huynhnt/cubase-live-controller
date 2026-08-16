import { midi } from './midi.js';
import { DOM } from './dom.js';
import { states, appConfig, setAppConfig, savedSingingValues } from './state.js';
import {
  updateSliderFill,
  updateStatus,
  applyTheme,
  toggleTheme,
  setBeatMuteUI,
  setMicMuteUI,
  setFxMuteUI,
  toggleFxPanel,
  toggleKeySelector,
  initKeySelector,
  selectKey,
  selectScale,
  updateAutoKeyDisplay,
  toggleAboutPanel,
  closeSettingsPanelUI,
  autoSaveCurrentStates,
  toggleSoundboardPanel,
  renderEffects,
  openEffectEditModal
} from './ui.js';
import { exportFeaturesXML, exportEffectsXML } from './export.js';
import {
  renderPresets,
  loadPreset,
  saveCurrentAsPreset,
  submitNewPreset,
  confirmOverwritePreset,
  confirmDeletePreset
} from './presets.js';
import {
  loadConfigToForm,
  saveSettings,
  cancelSettings
} from './settings.js';
import { initSoundboard } from './soundboard.js';

export const interactingSliders = {
  beatVol: false,
  micVol: false,
};

export function syncAllStatesToCubase() {
  if (!appConfig) return;
  const mappings = appConfig.midiMappings;

  midi.sendCC(mappings.beatVol, DOM.sliderBeatVol.value);
  midi.sendCC(mappings.micVol, DOM.sliderMicVol.value);

  if (appConfig.effects) {
    appConfig.effects.forEach(fx => {
      const slider = document.getElementById(`slider-fx-${fx.id}`);
      if (slider) {
        midi.sendCC(fx.ccValue, slider.value);
      }
      if (fx.isEnabled && fx.ccToggle >= 0) {
        const toggle = document.getElementById(`toggle-fx-${fx.id}`);
        if (toggle) {
          midi.sendCC(fx.ccToggle, toggle.checked ? 127 : 0);
        }
      }
    });
  }

  midi.sendCC(mappings.beatMute, states.beatMuted ? 127 : 0);
  midi.sendCC(mappings.micMute, states.micMuted ? 127 : 0);
  midi.sendCC(mappings.fxMute, states.fxMuted ? 0 : 127);

  midi.sendCC(mappings.modeSingVoice, states.currentMode === 'sing' ? 127 : 0);
}

// -------------------------------------------------------------
// KHỞI TẠO CÁC CỔNG MIDI VÀ KẾT NỐI
// -------------------------------------------------------------
export async function initMidi() {
  try {
    updateStatus('Đang khởi tạo MIDI...');
    await midi.initialize();

    window.onMidiStateChange = () => {
      populateMidiPorts();
      connectMidi();
    };

    populateMidiPorts();

    midi.setChannel(appConfig.midiChannel);

    connectMidi();
  } catch (err) {
    console.error('Không khởi tạo được MIDI:', err);
    updateStatus('Không tìm thấy thiết bị MIDI. Hãy cài loopMIDI!', false);
  }
}

export function populateMidiPorts() {
  const outs = midi.getOutputPorts();
  const ins = midi.getInputPorts();

  DOM.selectMidiOut.innerHTML = '<option value="">-- Chưa kết nối --</option>';
  DOM.selectMidiIn.innerHTML = '<option value="">-- Chưa kết nối --</option>';

  let foundSavedOut = false;
  outs.forEach(port => {
    const opt = document.createElement('option');
    opt.value = port.name;
    opt.innerText = port.name;
    DOM.selectMidiOut.appendChild(opt);
    if (port.name === appConfig.midiOutPort) foundSavedOut = true;
  });

  if (appConfig.midiOutPort && !foundSavedOut) {
    const opt = document.createElement('option');
    opt.value = appConfig.midiOutPort;
    opt.innerText = `${appConfig.midiOutPort} (Đã lưu)`;
    DOM.selectMidiOut.appendChild(opt);
  }

  let foundSavedIn = false;
  ins.forEach(port => {
    const opt = document.createElement('option');
    opt.value = port.name;
    opt.innerText = port.name;
    DOM.selectMidiIn.appendChild(opt);
    if (port.name === appConfig.midiInPort) foundSavedIn = true;
  });

  if (appConfig.midiInPort && !foundSavedIn) {
    const opt = document.createElement('option');
    opt.value = appConfig.midiInPort;
    opt.innerText = `${appConfig.midiInPort} (Đã lưu)`;
    DOM.selectMidiIn.appendChild(opt);
  }

  DOM.selectMidiOut.value = appConfig.midiOutPort || '';
  DOM.selectMidiIn.value = appConfig.midiInPort || '';
}

export function connectMidi() {
  let statusMsg = '';

  if (appConfig.midiOutPort) {
    const successOut = midi.connectOutput(appConfig.midiOutPort);
    if (successOut) {
      statusMsg += `MIDI Out: ${appConfig.midiOutPort}`;
      // Đồng bộ từ app xuống Cubase sau khi kết nối (ưu tiên app)
      setTimeout(() => syncAllStatesToCubase(), 200);
    } else {
      statusMsg += `Lỗi kết nối Out: ${appConfig.midiOutPort}`;
    }
  } else {
    statusMsg += 'Chưa cấu hình MIDI Out';
  }

  if (appConfig.midiInPort) {
    const successIn = midi.connectInput(appConfig.midiInPort, handleIncomingMidiCC);
    if (successIn) {
      statusMsg += ` | MIDI In: ${appConfig.midiInPort}`;
    } else {
      statusMsg += ` | Lỗi kết nối In: ${appConfig.midiInPort}`;
    }
  } else {
    statusMsg += ' | Chưa kết nối MIDI In';
  }

  const isOk = appConfig.midiOutPort && midi.midiOutPort;
  updateStatus(statusMsg, isOk);
}

// Xử lý đồng bộ dữ liệu khi nhận lệnh MIDI CC ngược lại từ Cubase (2-way sync)
export function handleIncomingMidiCC({ cc, value }) {
  const mappings = appConfig.midiMappings;
  let stateChanged = false;

  if (cc === mappings.beatVol && !interactingSliders.beatVol) {
    DOM.sliderBeatVol.value = value;
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    stateChanged = true;
  }
  else if (cc === mappings.micVol && !interactingSliders.micVol) {
    DOM.sliderMicVol.value = value;
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    stateChanged = true;
  }
  else if (cc === mappings.beatMute) {
    const isMuted = value >= 64;
    if (states.beatMuted !== isMuted) {
      setBeatMuteUI(isMuted);
      stateChanged = true;
    }
  }
  else if (cc === mappings.micMute) {
    const isMuted = value >= 64;
    if (states.micMuted !== isMuted) {
      setMicMuteUI(isMuted);
      stateChanged = true;
    }
  }
  else if (cc === mappings.fxMute) {
    const isMuted = value < 64;
    if (states.fxMuted !== isMuted) {
      setFxMuteUI(isMuted);
      stateChanged = true;
    }
  }
  else if (appConfig.effects && appConfig.effects.find(e => e.ccValue === cc || e.ccToggle === cc)) {
    const fx = appConfig.effects.find(e => e.ccValue === cc || e.ccToggle === cc);
    if (fx.ccValue === cc && !interactingSliders[fx.id]) {
      const slider = document.getElementById(`slider-fx-${fx.id}`);
      const fill = document.getElementById(`fill-fx-${fx.id}`);
      const valText = document.getElementById(`val-fx-${fx.id}`);
      if (slider) {
        slider.value = value;
        updateSliderFill(slider, fill, valText);
        stateChanged = true;
      }
    } else if (fx.ccToggle === cc) {
      const toggle = document.getElementById(`toggle-fx-${fx.id}`);
      if (toggle) {
        const isChecked = value > 63;
        if (toggle.checked !== isChecked) {
          toggle.checked = isChecked;
          toggle.dispatchEvent(new Event('change'));
          stateChanged = true;
        }
      }
    }
  }
  else if (cc === mappings.detectedKey) {
    const keyIndex = Math.round((value / 127) * 11);
    states.detectedKey = keyIndex;
    updateAutoKeyDisplay();
  }
  else if (cc === mappings.detectedScale) {
    const scaleIndex = value > 64 ? 1 : 0;
    states.detectedScale = scaleIndex;
    updateAutoKeyDisplay();
  }

  if (stateChanged) {
    clearTimeout(window._autoSaveDebounce);
    window._autoSaveDebounce = setTimeout(() => {
      autoSaveCurrentStates();
    }, 500);
  }
}

export function toggleBeatMute() {
  const nextState = !states.beatMuted;
  setBeatMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.beatMute, nextState ? 127 : 0);
  autoSaveCurrentStates();
}

export function toggleMicMute() {
  const nextState = !states.micMuted;
  setMicMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.micMute, nextState ? 127 : 0);
  autoSaveCurrentStates();
}

export function toggleFxMute() {
  const nextState = !states.fxMuted;
  setFxMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.fxMute, nextState ? 0 : 127);
  autoSaveCurrentStates();
}

// -------------------------------------------------------------
// CHUYỂN ĐỔI CHẾ ĐỘ HÁT LIVE <=> VOICE THOẠI
// -------------------------------------------------------------
export function setMode(targetMode) {
  if (targetMode === states.currentMode) return;

  if (targetMode === 'voice') {
    states.currentMode = 'voice';
    DOM.btnModeToggle.className = 'action-btn btn-blue active';
    DOM.btnModeToggle.style.backgroundColor = 'var(--color-orange)';
    DOM.btnModeToggle.querySelector('.mode-text').innerText = 'VOICE THOẠI';
    DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click để HÁT';

    savedSingingValues.beatVol = parseInt(DOM.sliderBeatVol.value);
    savedSingingValues.micVol = parseInt(DOM.sliderMicVol.value);

    appConfig.effects.forEach(fx => {
      const slider = document.getElementById(`slider-fx-${fx.id}`);
      if (slider) {
        savedSingingValues[fx.id] = parseInt(slider.value) || 0;
      }
    });

    const presetName = appConfig.voicePreset?.presetName || 'Voice';
    const preset = appConfig.presets && appConfig.presets[presetName] ? appConfig.presets[presetName] : {};

    appConfig.effects.forEach(fx => {
      const presetVal = preset[fx.id] !== undefined ? preset[fx.id] : (fx.value ?? 24);
      midi.sendCC(fx.ccValue, presetVal);
      const slider = document.getElementById(`slider-fx-${fx.id}`);
      const fill = document.getElementById(`fill-fx-${fx.id}`);
      const valText = document.getElementById(`val-fx-${fx.id}`);
      if (slider) {
        slider.value = presetVal;
        updateSliderFill(slider, fill, valText);
      }
    });

    // Thay đổi âm lượng nhạc theo phần trăm (thang 127 CC)
    let newBeatVol = savedSingingValues.beatVol + Math.round(127 * ((appConfig.voicePreset?.beatChange ?? -20) / 100));
    newBeatVol = Math.max(0, Math.min(127, newBeatVol));
    DOM.sliderBeatVol.value = newBeatVol;
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    midi.sendCC(appConfig.midiMappings.beatVol, newBeatVol);

    // Thay đổi âm lượng mic theo phần trăm (thang 127 CC)
    let newMicVol = savedSingingValues.micVol + Math.round(127 * ((appConfig.voicePreset?.micChange ?? 10) / 100));
    newMicVol = Math.max(0, Math.min(127, newMicVol));
    DOM.sliderMicVol.value = newMicVol;
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    midi.sendCC(appConfig.midiMappings.micVol, newMicVol);

    midi.sendCC(appConfig.midiMappings.modeSingVoice, 0);

  } else {
    states.currentMode = 'sing';
    DOM.btnModeToggle.className = 'action-btn btn-blue';
    DOM.btnModeToggle.style.backgroundColor = '';
    DOM.btnModeToggle.querySelector('.mode-text').innerText = 'HÁT LIVE';
    DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click đổi Voice';

    appConfig.effects.forEach(fx => {
      let val = savedSingingValues[fx.id];
      if (val === undefined) val = fx.value;
      fx.value = val;
      midi.sendCC(fx.ccValue, val);

      const slider = document.getElementById(`slider-fx-${fx.id}`);
      const fill = document.getElementById(`fill-fx-${fx.id}`);
      const valText = document.getElementById(`val-fx-${fx.id}`);
      if (slider) {
        slider.value = val;
        updateSliderFill(slider, fill, valText);
      }
    });

    // Trả về âm lượng nhạc và mic ban đầu
    midi.sendCC(appConfig.midiMappings.beatVol, savedSingingValues.beatVol);
    midi.sendCC(appConfig.midiMappings.micVol, savedSingingValues.micVol);
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);

    midi.sendCC(appConfig.midiMappings.modeSingVoice, 127);
  }
  autoSaveCurrentStates();
}

export function toggleSingVoiceMode() {
  if (states.currentMode === 'sing') {
    setMode('voice');
  } else {
    setMode('sing');
  }
}

export function openSettingsPanel() {
  states.isSettingsOpen = true;
  DOM.settingsPanel.classList.remove('hidden');
  DOM.btnSettingsToggle.classList.add('active');

  DOM.fxPanel.classList.add('hidden');
  DOM.btnReverbToggle.innerText = 'Hiệu Ứng ▾';
  DOM.btnReverbToggle.classList.remove('active');
  DOM.btnToneToggle.innerText = 'Chọn Tone ▾';
  DOM.btnToneToggle.classList.remove('active');

  window.electronAPI.resizeWindow('settings');

  populateMidiPorts();
  loadConfigToForm();
}

// -------------------------------------------------------------
// THIẾT LẬP SỰ KIỆN KHỞI TẠO VÀ LẮNG NGHE (EVENT LISTENERS)
// -------------------------------------------------------------
export function setupEventListeners() {
  const setupInteraction = (slider, key, valElement) => {
    if (!slider) return;
    slider.addEventListener('mousedown', () => interactingSliders[key] = true);
    slider.addEventListener('touchstart', () => interactingSliders[key] = true, { passive: true });
    slider.addEventListener('mouseup', () => interactingSliders[key] = false);
    slider.addEventListener('touchend', () => interactingSliders[key] = false);

    if (valElement) {
      const resetAction = () => {
        slider.value = 100;
        slider.dispatchEvent(new Event('input'));
        slider.dispatchEvent(new Event('change'));
      };

      valElement.style.cursor = 'pointer';
      valElement.title = 'Nháy đúp để Reset về 0 dB';
      valElement.addEventListener('dblclick', resetAction);

      // Thêm event double click thẳng vào thanh trượt (slider)
      slider.title = 'Nháy đúp để Reset về 0 dB';
      slider.addEventListener('dblclick', resetAction);

      const parent = valElement.parentElement;
      if (parent) {
        const label = parent.querySelector('.slider-label');
        if (label) {
          label.style.cursor = 'pointer';
          label.title = 'Nháy đúp để Reset về 0 dB';
          label.addEventListener('dblclick', resetAction);
          label.style.userSelect = 'none';
        }
      }
    }
  };

  setupInteraction(DOM.sliderBeatVol, 'beatVol', DOM.valBeatVol);
  setupInteraction(DOM.sliderMicVol, 'micVol', DOM.valMicVol);

  if (appConfig.effects) {
    appConfig.effects.forEach(fx => {
      const slider = document.getElementById(`slider-fx-${fx.id}`);
      const valText = document.getElementById(`val-fx-${fx.id}`);
      if (slider) {
        setupInteraction(slider, fx.id, valText);
      }
    });
  }

  if (window.electronAPI) {
    DOM.btnMinimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
    DOM.btnClose.addEventListener('click', () => window.electronAPI.closeWindow());
    DOM.btnMediaPlayPause.addEventListener('click', () => window.electronAPI.playPauseMedia());
    if (DOM.btnToggleCubase) DOM.btnToggleCubase.addEventListener('click', () => window.electronAPI.toggleApp('cubase'));
    if (DOM.btnToggleYouTube) DOM.btnToggleYouTube.addEventListener('click', () => {
      const target = appConfig.customAppTarget || 'YouTube';
      window.electronAPI.toggleApp(target);
    });
  } else {
    DOM.btnMinimize.style.display = 'none';
    DOM.btnClose.style.display = 'none';
    if (DOM.btnToggleCubase) DOM.btnToggleCubase.style.display = 'none';
    if (DOM.btnToggleYouTube) DOM.btnToggleYouTube.style.display = 'none';
    if (DOM.btnMediaPlayPause) DOM.btnMediaPlayPause.style.display = 'none';
    if (DOM.shortcutPlayMedia) {
      const parentItem = DOM.shortcutPlayMedia.closest('.shortcut-item');
      if (parentItem) parentItem.style.display = 'none';
    }
  }
  DOM.btnSettingsToggle.addEventListener('click', () => {
    if (states.isSettingsOpen) {
      cancelSettings();
    } else {
      if (states.isAboutOpen) {
        toggleAboutPanel();
      }
      openSettingsPanel();
    }
  });
  DOM.btnAboutToggle.addEventListener('click', toggleAboutPanel);
  DOM.btnPinToggle.addEventListener('click', () => {
    states.isPinned = !states.isPinned;
    if (states.isPinned) {
      DOM.btnPinToggle.classList.add('active');
    } else {
      DOM.btnPinToggle.classList.remove('active');
    }
    window.electronAPI.togglePin(states.isPinned);
  });
  DOM.btnCloseAbout.addEventListener('click', () => {
    if (states.isAboutOpen) {
      toggleAboutPanel();
    }
  });
  DOM.btnThemeToggle.addEventListener('click', toggleTheme);

  DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabButtons.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  DOM.btnBeatMute.addEventListener('click', toggleBeatMute);
  DOM.btnMicMute.addEventListener('click', toggleMicMute);
  DOM.btnFxMute.addEventListener('click', toggleFxMute);

  DOM.btnModeToggle.addEventListener('click', toggleSingVoiceMode);

  DOM.btnReverbToggle.addEventListener('click', toggleFxPanel);
  DOM.btnToneToggle.addEventListener('click', toggleKeySelector);
  DOM.btnSoundboardToggle.addEventListener('click', toggleSoundboardPanel);

  let deferredPwaPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    const btnPwa = document.getElementById('btn-pwa-install');
    if (btnPwa) {
      btnPwa.classList.remove('hidden');
      btnPwa.addEventListener('click', () => {
        btnPwa.classList.add('hidden');
        if (deferredPwaPrompt) {
          deferredPwaPrompt.prompt();
          deferredPwaPrompt = null;
        }
      });
    }
  });

  DOM.btnSaveSettings.addEventListener('click', saveSettings);
  DOM.btnCloseSettings.addEventListener('click', cancelSettings);

  DOM.btnSelectProject.addEventListener('click', async () => {
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      DOM.inputProjectPath.value = filePath;
    }
  });

  DOM.sliderOpacity.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.valOpacity.innerText = val + '%';
    DOM.app.style.setProperty('--bg-opacity', val / 100);
  });

  DOM.sliderBeatVol.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    midi.sendCC(appConfig.midiMappings.beatVol, e.target.value);
  });
  DOM.sliderMicVol.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    midi.sendCC(appConfig.midiMappings.micVol, e.target.value);
  });

  DOM.sliderBeatVol.addEventListener('change', autoSaveCurrentStates);
  DOM.sliderMicVol.addEventListener('change', autoSaveCurrentStates);

  if (DOM.btnAddEffect) DOM.btnAddEffect.addEventListener('click', () => openEffectEditModal(null));
  if (DOM.btnExportFeatures) DOM.btnExportFeatures.addEventListener('click', exportFeaturesXML);
  if (DOM.btnExportEffects) DOM.btnExportEffects.addEventListener('click', exportEffectsXML);

  DOM.btnAddPreset.addEventListener('click', saveCurrentAsPreset);

  DOM.btnModalSave.addEventListener('click', submitNewPreset);
  DOM.btnModalCancel.addEventListener('click', () => DOM.presetModal.classList.add('hidden'));
  DOM.inputPresetName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitNewPreset();
  });

  DOM.btnConfirmYes.addEventListener('click', confirmDeletePreset);
  DOM.btnConfirmNo.addEventListener('click', () => DOM.confirmModal.classList.add('hidden'));

  DOM.btnOverwriteYes.addEventListener('click', confirmOverwritePreset);
  DOM.btnOverwriteNo.addEventListener('click', () => DOM.overwriteModal.classList.add('hidden'));

  // Lắng nghe sự kiện ghi nhận phím tắt
  const shortcutInputs = [
    DOM.shortcutToggleMusic,
    DOM.shortcutToggleMic,
    DOM.shortcutToggleFx,
    DOM.shortcutToggleWindow,
    DOM.shortcutSetSingMode,
    DOM.shortcutSetVoiceMode,
    DOM.shortcutPlayMedia
  ];

  shortcutInputs.forEach(input => {
    if (!input) return;

    input.addEventListener('focus', () => {
      input.classList.add('recording');
      input.placeholder = 'Nhấn tổ hợp phím...';
    });

    input.addEventListener('blur', () => {
      input.classList.remove('recording');
      if (!input.value) {
        input.value = 'Chưa gán';
      }
      input.placeholder = 'Nhấp để ghi phím...';
    });

    input.addEventListener('keydown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      let key = e.key;

      // Nếu chỉ nhấn modifier, cập nhật giao diện hiển thị modifier tạm thời
      if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') {
        input.value = keys.length > 0 ? keys.join('+') : '';
        return;
      }

      // Chuẩn hóa tên phím sang định dạng Electron Accelerator
      if (key === ' ') {
        key = 'Space';
      } else if (key.length === 1) {
        key = key.toUpperCase();
      } else if (key.startsWith('Arrow')) {
        key = key.replace('Arrow', '');
      } else if (key === 'Escape') {
        input.blur();
        return;
      }

      // Xử lý phím NumPad
      if (e.code.startsWith('Numpad')) {
        const num = e.code.replace('Numpad', '');
        if (num >= '0' && num <= '9') {
          key = 'num' + num;
        } else if (e.code === 'NumpadAdd') {
          key = 'numadd';
        } else if (e.code === 'NumpadSubtract') {
          key = 'numsub';
        } else if (e.code === 'NumpadMultiply') {
          key = 'nummult';
        } else if (e.code === 'NumpadDivide') {
          key = 'numdiv';
        } else if (e.code === 'NumpadDecimal') {
          key = 'numdec';
        }
      }

      keys.push(key);
      input.value = keys.join('+');
      input.blur();
    });
  });

  // Sự kiện xóa phím tắt bằng nút ✕
  document.querySelectorAll('.btn-clear-shortcut').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        targetInput.value = 'Chưa gán';
      }
    });
  });
}

// -------------------------------------------------------------
// KHỞI CHẠY KHI TẢI XONG TRANG
// -------------------------------------------------------------
export async function bootstrap() {
  try {
    setAppConfig(await window.electronAPI.loadConfig());

    applyTheme(appConfig.theme ?? 'dark');

    if (appConfig.lastValues) {
      DOM.sliderBeatVol.value = appConfig.lastValues.beatVol ?? 100;
      DOM.sliderMicVol.value = appConfig.lastValues.micVol ?? 100;

      states.beatMuted = appConfig.lastValues.beatMuted ?? false;
      states.micMuted = appConfig.lastValues.micMuted ?? false;
      states.fxMuted = appConfig.lastValues.fxMuted ?? false;
      states.currentMode = appConfig.lastValues.currentMode ?? 'sing';
      states.activePreset = appConfig.lastValues.activePreset ?? 'Mặc định';
      states.currentKey = appConfig.lastValues.currentKey ?? 0;
      states.currentScale = appConfig.lastValues.currentScale ?? 0;

      if (states.currentMode === 'voice') {
        DOM.btnModeToggle.className = 'action-btn btn-blue active';
        DOM.btnModeToggle.style.backgroundColor = 'var(--color-orange)';
        DOM.btnModeToggle.querySelector('.mode-text').innerText = 'VOICE THOẠI';
        DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click để HÁT';
      }
    }

    setupEventListeners();

    initKeySelector();

    renderPresets();
    renderEffects();

    DOM.app.style.setProperty('--bg-opacity', appConfig.opacity / 100);

    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);

    setBeatMuteUI(states.beatMuted);
    setMicMuteUI(states.micMuted);
    setFxMuteUI(states.fxMuted);

    // Đăng ký lắng nghe sự kiện phím tắt toàn cục từ Electron
    if (window.electronAPI.onShortcutPressed) {
      window.electronAPI.onShortcutPressed((action) => {
        if (action === 'toggleMusic') {
          toggleBeatMute();
        } else if (action === 'toggleMic') {
          toggleMicMute();
        } else if (action === 'toggleFx') {
          toggleFxMute();
        } else if (action === 'setSingMode') {
          setMode('sing');
        } else if (action === 'setVoiceMode') {
          setMode('voice');
        } else if (action === 'playMedia') {
          window.electronAPI.playPauseMedia();
        }
      });
    }

    if (window.electronAPI.onPinStateChanged) {
      window.electronAPI.onPinStateChanged((isPinned) => {
        states.isPinned = isPinned;
        if (isPinned) {
          DOM.btnPinToggle.classList.add('active');
        } else {
          DOM.btnPinToggle.classList.remove('active');
        }
      });
    }

    await initSoundboard();
    await initMidi();

    if (window.electronAPI && window.electronAPI.getAppVersion) {
      window.electronAPI.getAppVersion().then(version => {
        const titleEl = document.querySelector('.app-title');
        if (titleEl && version) {
          titleEl.innerText = `CUBASE LIVE CONTROLLER ${version}`;
        }
      });
    }
  } catch (error) {
    console.error('Lỗi trong quá trình khởi chạy phần mềm:', error);
    alert('Có lỗi xảy ra khi khởi động giao diện điều khiển: ' + error.message);
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
