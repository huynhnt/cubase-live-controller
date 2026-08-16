const inputFxId = document.getElementById('input-fx-id');
const inputFxName = document.getElementById('input-fx-name');
const inputFxColor = document.getElementById('input-fx-color');
const hiddenFxColor = document.getElementById('hidden-fx-color');
const colorSwatches = document.querySelectorAll('.color-swatch');
const inputFxCc = document.getElementById('input-fx-cc');
const checkboxHasToggle = document.getElementById('checkbox-has-toggle');
const uiHasToggle = document.getElementById('ui-has-toggle');
const uiKnobToggle = document.getElementById('ui-knob-toggle');
const uiTextToggle = document.getElementById('ui-text-toggle');
const selectFxFormat = document.getElementById('select-fx-format');
const fxCustomRange = document.getElementById('fx-custom-range');
const inputFxMin = document.getElementById('input-fx-min');
const inputFxMax = document.getElementById('input-fx-max');
const inputFxValue = document.getElementById('input-fx-value');
const inputFxToggleCc = document.getElementById('input-fx-toggle-cc');
const btnFxDelete = document.getElementById('btn-fx-delete');
const btnFxSave = document.getElementById('btn-fx-save');
const btnFxCancel = document.getElementById('btn-fx-cancel');
const btnClose = document.getElementById('btn-close');

function updateSwatchSelection(color) {
  colorSwatches.forEach(sw => sw.style.borderColor = 'transparent');
  if (color && !color.startsWith('#')) {
    const sw = Array.from(colorSwatches).find(s => s.getAttribute('data-color') === color);
    if (sw) sw.style.borderColor = '#ffffff';
  }
}

colorSwatches.forEach(sw => {
  sw.addEventListener('click', () => {
    const color = sw.getAttribute('data-color');
    hiddenFxColor.value = color;
    updateSwatchSelection(color);
  });
});

inputFxColor.addEventListener('input', (e) => {
  hiddenFxColor.value = e.target.value;
  updateSwatchSelection(e.target.value);
});

checkboxHasToggle.addEventListener('change', (e) => {
  const isOn = e.target.checked;
  uiHasToggle.style.background = isOn ? '#2ecc71' : 'rgba(255,255,255,0.2)';
  uiKnobToggle.style.left = isOn ? '18px' : '2px';
  uiTextToggle.innerText = isOn ? 'BẬT (ON)' : 'TẮT (OFF)';
});

selectFxFormat.addEventListener('change', () => {
  fxCustomRange.style.display = selectFxFormat.value === 'custom' ? 'flex' : 'none';
});

function closeWindow() {
  if (window.electronAPI && window.electronAPI.closeEffectEditWindow) {
    window.electronAPI.closeEffectEditWindow();
  } else {
    window.close(); // fallback for dev
  }
}

let currentFx = null;
let existingCCs = [];
let mappedCCs = [];

selectFxFormat.addEventListener('change', () => {
  fxCustomRange.style.display = selectFxFormat.value === 'custom' ? 'flex' : 'none';
});

btnClose.addEventListener('click', closeWindow);
btnFxCancel.addEventListener('click', closeWindow);

btnFxSave.addEventListener('click', () => {
  const name = inputFxName.value.trim();
  if (!name) {
    alert('Vui lòng nhập tên hiệu ứng!');
    return;
  }
  
  const ccValue = parseInt(inputFxCc.value) || 0;
  const ccToggle = parseInt(inputFxToggleCc.value) || -1;
  const isEnabled = checkboxHasToggle.checked;
  
  // Validate duplicate CCs
  let duplicateWarning = '';
  
  if (isEnabled && ccValue >= 0 && ccValue === ccToggle) {
    duplicateWarning += `- Mã CC Giá trị và Mã CC Bật/Tắt đang TRÙNG NHAU (${ccValue}) trên chính hiệu ứng này.\n`;
  }
  
  for (const otherFx of existingCCs) {
    if (ccValue >= 0 && (otherFx.ccValue === ccValue || otherFx.ccToggle === ccValue)) {
      duplicateWarning += `- Mã CC Giá trị (${ccValue}) đang bị trùng với hiệu ứng "${otherFx.name}".\n`;
    }
    if (isEnabled && ccToggle >= 0 && (otherFx.ccValue === ccToggle || otherFx.ccToggle === ccToggle)) {
      duplicateWarning += `- Mã CC Bật/Tắt (${ccToggle}) đang bị trùng với hiệu ứng "${otherFx.name}".\n`;
    }
  }
  
  for (const mapping of mappedCCs) {
    if (ccValue >= 0 && mapping.cc === ccValue) {
      duplicateWarning += `- Mã CC Giá trị (${ccValue}) đang bị trùng với tính năng "${mapping.name}".\n`;
    }
    if (isEnabled && ccToggle >= 0 && mapping.cc === ccToggle) {
      duplicateWarning += `- Mã CC Bật/Tắt (${ccToggle}) đang bị trùng với tính năng "${mapping.name}".\n`;
    }
  }
  
  if (duplicateWarning) {
    duplicateWarning += '\nNếu trùng lặp, cả 2 hiệu ứng sẽ nhận cùng một lệnh.\nBạn có muốn tiếp tục sử dụng mã này không?';
    if (!confirm(duplicateWarning)) {
      return; // Stop saving if user cancels
    }
  }
  
  const fxData = {
    id: inputFxId.value || ('fx_' + Date.now()),
    name: name,
    color: hiddenFxColor.value,
    ccValue: ccValue,
    ccToggle: ccToggle,
    format: selectFxFormat.value,
    min: parseFloat(inputFxMin.value) || 0,
    max: parseFloat(inputFxMax.value) || 0,
    value: parseInt(inputFxValue.value) || 24, // Giá trị mặc định do user tự nhập
    isEnabled: isEnabled
  };
  
  if (window.electronAPI && window.electronAPI.saveEffectEdit) {
    window.electronAPI.saveEffectEdit(fxData);
  }
});

btnFxDelete.addEventListener('click', () => {
  if (!inputFxId.value) return;
  if (!confirm('Bạn có chắc chắn muốn xóa hiệu ứng này?')) return;
  
  if (window.electronAPI && window.electronAPI.saveEffectEdit) {
    window.electronAPI.saveEffectEdit({ deleteId: inputFxId.value });
  }
});

if (window.electronAPI && window.electronAPI.onLoadEffectEdit) {
  window.electronAPI.onLoadEffectEdit((fx) => {
    currentFx = fx;
    existingCCs = fx?.existingCCs || [];
    mappedCCs = fx?.mappedCCs || [];
    
    const isNew = fx && fx.isNew;
    inputFxId.value = isNew ? '' : (fx ? fx.id : '');
    inputFxName.value = fx ? (fx.name || '') : '';
    
    const color = isNew ? 'orange' : (fx ? fx.color : 'orange');
    hiddenFxColor.value = color;
    if (color.startsWith('#')) {
      inputFxColor.value = color;
    }
    updateSwatchSelection(color);
    
    inputFxCc.value = fx ? fx.ccValue : 0;
    inputFxToggleCc.value = fx ? (fx.ccToggle ?? -1) : -1;
    
    // Sync toggle switch with fx.isEnabled
    const isEnabled = isNew ? true : (fx ? (fx.isEnabled !== false) : true);
    checkboxHasToggle.checked = isEnabled;
    checkboxHasToggle.dispatchEvent(new Event('change'));
    
    selectFxFormat.value = isNew ? 'db' : (fx ? (fx.format || 'db') : 'db');
    selectFxFormat.dispatchEvent(new Event('change'));
    
    inputFxMin.value = isNew ? 0 : (fx ? (fx.min ?? 0) : 0);
    inputFxMax.value = isNew ? 100 : (fx ? (fx.max ?? 100) : 100);
    inputFxValue.value = isNew ? 24 : (fx ? (fx.value ?? 24) : 24);
    
    btnFxDelete.style.display = (!isNew && fx && fx.id) ? 'block' : 'none';
  });
}
