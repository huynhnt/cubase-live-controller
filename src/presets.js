import { DOM } from './dom.js';
import { states, appConfig } from './state.js';
import { midi } from './midi.js';
import { updateSliderFill, autoSaveCurrentStates } from './ui.js';

export function renderPresets() {
  if (!DOM.presetsSystemList || !DOM.presetsCustomList || !appConfig || !appConfig.presets) return;
  
  DOM.presetsSystemList.innerHTML = '';
  DOM.presetsCustomList.innerHTML = '';
  
  const defaultPresets = ["Mặc định"];
  
  const keys = Object.keys(appConfig.presets);
  keys.sort((a, b) => {
    const idxA = defaultPresets.indexOf(a);
    const idxB = defaultPresets.indexOf(b);
    
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  
  keys.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.setAttribute('data-preset', name);
    btn.innerText = name;
    
    if (name === states.activePreset) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => loadPreset(name));
    
    const isSystem = defaultPresets.includes(name);
    
    if (isSystem) {
      btn.classList.add('system-preset');
      btn.title = "Preset chuẩn hệ thống (không thể ghi đè thông số gốc)";
      DOM.presetsSystemList.appendChild(btn);
    } else {
      btn.classList.add('custom-preset');
      btn.title = "Preset cá nhân của bạn (tự động lưu khi chỉnh, chuột phải để xóa)";
      
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deletePreset(name);
      });
      
      DOM.presetsCustomList.appendChild(btn);
    }
  });
}

export function loadPreset(name) {
  if (!appConfig || !appConfig.presets || !appConfig.presets[name]) return;
  
  states.activePreset = name;
  renderPresets();
  
  const preset = appConfig.presets[name];
  
  appConfig.effects.forEach(fx => {
    let val = preset[fx.id];
    if (val === undefined) val = fx.value ?? 0;
    
    fx.value = val;
    const slider = document.getElementById(`slider-fx-${fx.id}`);
    const fill = document.getElementById(`fill-fx-${fx.id}`);
    const valText = document.getElementById(`val-fx-${fx.id}`);
    
    if (slider) {
      slider.value = val;
      updateSliderFill(slider, fill, valText);
    }
    
    midi.sendCC(fx.ccValue, val);
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
    newPreset[fx.id] = slider ? parseInt(slider.value) : fx.value;
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
  const defaultPresets = ["Mặc định"];
  if (defaultPresets.includes(name)) {
    alert(`Không thể xóa Preset mặc định "${name}" của hệ thống!`);
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
  
  const success = await window.electronAPI.saveConfig(appConfig);
  if (success) {
    renderPresets();
  } else {
    alert('Lỗi: Không thể xóa Preset.');
  }
  
  DOM.confirmModal.classList.add('hidden');
  states.presetToDelete = '';
}
