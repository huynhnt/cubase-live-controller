import { DOM } from './dom.js';
import { states, appConfig } from './state.js';
import { midi } from './midi.js';
import { updateSliderFill, autoSaveCurrentStates } from './ui.js';

export function renderPresets() {
  if (!DOM.presetsSystemList || !DOM.presetsCustomList || !appConfig || !appConfig.presets) return;
  
  DOM.presetsSystemList.innerHTML = '';
  DOM.presetsCustomList.innerHTML = '';
  
  const defaultPresets = ["Mặc định", "Voice"];
  
  const keys = Object.keys(appConfig.presets);
  
  // Đảm bảo Mặc định và Voice luôn tồn tại trong danh sách để render
  if (!keys.includes("Mặc định")) keys.push("Mặc định");
  if (!keys.includes("Voice")) keys.push("Voice");
  
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
    
    btn.addEventListener('click', () => loadPreset(name));
    
    const isSystem = defaultPresets.includes(name);
    
    if (isSystem) {
      btn.classList.add('system-preset');
      btn.title = name === "Mặc định" ? "Preset chuẩn hệ thống (không thể xóa)" : "Preset hệ thống cho Voice (nháy đúp hoặc lưu đè để sửa, không thể xóa)";
      DOM.presetsSystemList.appendChild(btn);
    } else {
      btn.classList.add('custom-preset');
      btn.title = "Preset cá nhân của bạn (chuột phải để xóa)";
      
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
  
  // Tạo rỗng nếu preset hệ thống vô tình bị xóa khỏi config
  const defaultPresets = ["Mặc định", "Voice"];
  if (defaultPresets.includes(name) && !appConfig.presets[name]) {
    appConfig.presets[name] = {};
  }
  
  if (!appConfig.presets[name]) return;
  
  states.activePreset = name;
  renderPresets();
  
  const preset = appConfig.presets[name];
  
  appConfig.effects.forEach(fx => {
    let val = preset[fx.id];
    if (val === undefined) val = fx.value ?? 24;
    
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
  
  if (name === "Mặc định") {
    alert('Không thể ghi đè Preset "Mặc định" của hệ thống!');
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
    newPreset[fx.id] = val;
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
  const defaultPresets = ["Mặc định", "Voice"];
  if (defaultPresets.includes(name)) {
    alert(`Không thể xóa Preset "${name}" của hệ thống!`);
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
