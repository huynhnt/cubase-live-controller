import { DOM } from './dom.js';
import { states, appConfig } from './state.js';
import { midi } from './midi.js';
import { updateSliderFill, autoSaveCurrentStates } from './ui.js';

export const SYSTEM_PRESETS = ["Mặc định", "Nhạc Trẻ", "Bolero", "Voice"];

export function renderPresets() {
  if (!DOM.presetsSystemList || !DOM.presetsCustomList || !appConfig || !appConfig.presets) return;
  
  DOM.presetsSystemList.innerHTML = '';
  DOM.presetsCustomList.innerHTML = '';
  
  const defaultPresets = SYSTEM_PRESETS;
  
  const keys = Object.keys(appConfig.presets);
  
  // Đảm bảo các preset hệ thống luôn tồn tại trong danh sách để render
  defaultPresets.forEach(pName => {
    if (!keys.includes(pName)) keys.push(pName);
    if (!appConfig.presets[pName]) appConfig.presets[pName] = {};
  });
  
  const systemKeys = keys.filter(k => defaultPresets.includes(k));
  // Giữ nguyên thứ tự gốc (thứ tự thêm vào) cho các preset cá nhân
  const customKeys = keys.filter(k => !defaultPresets.includes(k));
  
  const orderedKeys = [...systemKeys, ...customKeys];
  
  orderedKeys.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.setAttribute('data-preset', name);
    btn.innerText = name;
    
    if (name === states.activePreset) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', (e) => {
      if (e.ctrlKey) {
        states.presetToOverwrite = name;
        DOM.overwriteModalText.innerText = `Bạn có muốn cập nhật (ghi đè) cấu hình hiện tại của các hiệu ứng vào Preset "${name}" không?`;
        DOM.overwriteModal.classList.remove('hidden');
      } else {
        loadPreset(name);
      }
    });
    
    const isSystem = defaultPresets.includes(name);
    
    if (isSystem) {
      btn.classList.add('system-preset');
      btn.title = `Preset hệ thống "${name}" (Ctrl+Click để lưu đè cấu hình hiện tại, không thể xóa)`;
      DOM.presetsSystemList.appendChild(btn);
    } else {
      btn.classList.add('custom-preset');
      btn.title = "Preset cá nhân của bạn (Ctrl+Click để lưu đè cấu hình hiện tại, chuột phải để xóa)";
      
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deletePreset(name);
      });
      
      DOM.presetsCustomList.appendChild(btn);
    }
  });
}

export function loadPreset(name) {
  if (!appConfig || !appConfig.presets) return;

  if (states.currentMode === 'voice' && name !== states.activePreset) {
    alert('Đang ở chế độ VOICE THOẠI. Vui lòng bấm chuyển về HÁT LIVE để đổi Preset khác!');
    return;
  }
  
  // Tạo rỗng nếu preset hệ thống vô tình bị xóa khỏi config
  const defaultPresets = SYSTEM_PRESETS;
  if (defaultPresets.includes(name) && !appConfig.presets[name]) {
    appConfig.presets[name] = {};
  }
  
  if (!appConfig.presets[name]) return;
  
  states.activePreset = name;
  renderPresets();
  
  const preset = appConfig.presets[name];
  
  appConfig.effects.forEach(fx => {
    let presetData = preset[fx.id];
    let val, isEnabled;
    
    if (typeof presetData === 'object' && presetData !== null) {
      val = presetData.val ?? fx.value ?? 24;
      isEnabled = presetData.enabled !== false;
    } else if (typeof presetData === 'number') {
      val = presetData;
      isEnabled = fx.isEnabled !== false;
    } else {
      val = fx.value ?? 24;
      isEnabled = fx.isEnabled !== false;
    }
    
    fx.value = val;
    fx.isEnabled = isEnabled;
    
    const slider = document.getElementById(`slider-fx-${fx.id}`);
    const fill = document.getElementById(`thumb-fx-${fx.id}`) || document.getElementById(`fill-fx-${fx.id}`);
    const valText = document.getElementById(`val-fx-${fx.id}`);
    const toggleCheckbox = document.querySelector(`.fx-toggle-checkbox[data-id="${fx.id}"]`);
    const row = slider ? slider.closest('.fx-column') : null;
    
    if (slider) {
      slider.value = val;
      updateSliderFill(slider, fill, valText);
    }
    
    if (toggleCheckbox) {
      toggleCheckbox.checked = isEnabled;
      const switchSlider = row ? row.querySelector('.fx-switch-slider') : null;
      const switchKnob = row ? row.querySelector('.fx-switch-knob') : null;
      if (switchSlider) switchSlider.style.background = isEnabled ? '#2ecc71' : 'rgba(255,255,255,0.2)';
      if (switchKnob) switchKnob.style.left = isEnabled ? '16px' : '2px';
    }
    
    midi.sendCC(fx.ccValue, val);
    if (fx.ccToggle > 0) {
      midi.sendCC(fx.ccToggle, isEnabled ? 127 : 0);
    }
  });
  
  autoSaveCurrentStates();
}

export function saveCurrentAsPreset() {
  DOM.inputPresetName.value = '';
  DOM.presetModal.classList.remove('hidden');
  DOM.inputPresetName.focus();
}

export async function submitNewPreset() {
  const name = DOM.inputPresetName.value.trim();
  if (name === '') {
    alert('Tên Preset không được để trống!');
    return;
  }
  
  if (appConfig.presets && appConfig.presets[name]) {
    states.presetToOverwrite = name;
    DOM.overwriteModalText.innerText = `Preset tên "${name}" đã tồn tại. Bạn có muốn ghi đè cấu hình mới này lên không?`;
    DOM.overwriteModal.classList.remove('hidden');
    return;
  }
  
  executeSavePreset(name);
}

export async function executeSavePreset(name) {
  const newPreset = {};
  appConfig.effects.forEach(fx => {
    const slider = document.getElementById(`slider-fx-${fx.id}`);
    let val = slider ? parseInt(slider.value) : fx.value;
    if (isNaN(val)) val = 24;
    newPreset[fx.id] = {
      val: val,
      enabled: fx.isEnabled !== false
    };
  });
  
  if (!appConfig.presets) appConfig.presets = {};
  appConfig.presets[name] = newPreset;
  states.activePreset = name;
  
  const success = await window.electronAPI.saveConfig(appConfig);
  if (success) {
    renderPresets();
    DOM.presetModal.classList.add('hidden');
    DOM.overwriteModal.classList.add('hidden');
  } else {
    alert('Lỗi: Không thể lưu Preset mới.');
  }
}

export function confirmOverwritePreset() {
  const name = states.presetToOverwrite;
  if (name) {
    executeSavePreset(name);
  }
}

export function deletePreset(name) {
  const defaultPresets = SYSTEM_PRESETS;
  if (defaultPresets.includes(name)) {
    alert(`Không thể xóa Preset hệ thống "${name}"!`);
    return;
  }
  
  states.presetToDelete = name;
  DOM.confirmModalText.innerText = `Bạn có chắc chắn muốn xóa Preset giọng hát "${name}" không?`;
  DOM.confirmModal.classList.remove('hidden');
}

export async function confirmDeletePreset() {
  const name = states.presetToDelete;
  if (!name) return;
  
  delete appConfig.presets[name];
  
  if (states.activePreset === name) {
    states.activePreset = "Mặc định";
  }
  
  if (appConfig.voicePreset && appConfig.voicePreset.presetName === name) {
    appConfig.voicePreset.presetName = "Voice";
  }
  
  const success = await window.electronAPI.saveConfig(appConfig);
  if (success) {
    renderPresets();
  } else {
    alert('Lỗi: Không thể xóa Preset.');
  }
  
  DOM.confirmModal.classList.add('hidden');
  states.presetToDelete = '';
}
