import { DOM } from './dom.js';
import { appConfig, states } from './state.js';
import { autoSaveCurrentStates } from './ui.js';

let currentEditingSlotId = null;
let currentPlayingAudio = null;

// Khởi tạo Soundboard
export async function initSoundboard() {
  if (!appConfig) return;

  // 1. Nạp danh sách thiết bị đầu ra âm thanh
  await populateAudioOutputDevices();

  // 2. Lắng nghe thay đổi thiết bị phát
  if (DOM.selectAudioOutput) {
    DOM.selectAudioOutput.addEventListener('change', async () => {
      appConfig.soundboardAudioOutputLabel = DOM.selectAudioOutput.value;
      await autoSaveCurrentStates();
    });
  }

  // 3. Lắng nghe nút bật/tắt Chế độ sửa
  if (DOM.btnSoundboardEditMode) {
    DOM.btnSoundboardEditMode.addEventListener('click', () => {
      states.isSoundboardEditMode = !states.isSoundboardEditMode;
      if (states.isSoundboardEditMode) {
        DOM.btnSoundboardEditMode.classList.add('active');
        DOM.btnSoundboardEditMode.innerText = 'Xong sửa';
        DOM.soundboardGrid.classList.add('edit-mode-active');
      } else {
        DOM.btnSoundboardEditMode.classList.remove('active');
        DOM.btnSoundboardEditMode.innerText = 'Chế độ sửa';
        DOM.soundboardGrid.classList.remove('edit-mode-active');
      }
    });
  }

  // 4. Kết xuất lưới ô âm thanh
  renderSoundboardGrid();

  // 5. Cài đặt các sự kiện cho modal chỉnh sửa ô soundboard
  setupModalEvents();

  // 6. Lắng nghe sự kiện phím tắt toàn cục phát nhạc từ Main gửi xuống
  if (window.electronAPI.onPlaySoundboardSlot) {
    window.electronAPI.onPlaySoundboardSlot((slotId) => {
      playSound(slotId);
    });
  }
}

// Lấy danh sách thiết bị đầu ra
async function populateAudioOutputDevices() {
  if (!DOM.selectAudioOutput) return;

  try {
    // Đảm bảo quyền truy cập mic được cấp nếu Electron/Chromium yêu cầu để hiển thị tên nhãn thiết bị
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      // Bỏ qua nếu người dùng từ chối hoặc không có thiết bị đầu vào, setSinkId vẫn hoạt động tốt
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter(d => d.kind === 'audiooutput');

    DOM.selectAudioOutput.innerHTML = '';
    
    // Thêm tùy chọn Mặc định
    const optDefault = document.createElement('option');
    optDefault.value = 'Mặc định';
    optDefault.innerText = 'Mặc định (Hệ thống)';
    DOM.selectAudioOutput.appendChild(optDefault);

    outputs.forEach(device => {
      // Tránh trùng lặp hoặc nhãn trống
      if (!device.label) return;
      const opt = document.createElement('option');
      opt.value = device.label;
      opt.innerText = device.label;
      DOM.selectAudioOutput.appendChild(opt);
    });

    // Chọn lại thiết bị đã lưu
    if (appConfig.soundboardAudioOutputLabel) {
      DOM.selectAudioOutput.value = appConfig.soundboardAudioOutputLabel;
    }
  } catch (err) {
    console.error('Không thể liệt kê thiết bị âm thanh đầu ra:', err);
  }
}

// Kết xuất lưới nút soundboard
export function renderSoundboardGrid() {
  if (!DOM.soundboardGrid || !appConfig.soundboard) return;

  DOM.soundboardGrid.innerHTML = '';

  appConfig.soundboard.forEach(slot => {
    const btn = document.createElement('button');
    btn.className = `sb-btn sb-${slot.color || 'purple'}`;
    btn.setAttribute('data-id', slot.id);

    // Hiển thị phím tắt thu gọn nếu có
    let shortcutDisplay = '';
    if (slot.shortcut && slot.shortcut !== 'Chưa gán') {
      shortcutDisplay = `<span class="sb-btn-shortcut">${formatShortcutName(slot.shortcut)}</span>`;
    }

    btn.innerHTML = `
      <span class="sb-btn-name">${slot.name || 'Trống'}</span>
      ${shortcutDisplay}
      <span class="sb-btn-edit-indicator">⚙️</span>
    `;

    btn.addEventListener('click', () => {
      if (states.isSoundboardEditMode) {
        openEditModal(slot.id);
      } else {
        playSound(slot.id);
      }
    });

    DOM.soundboardGrid.appendChild(btn);
  });
}

// Chuẩn hóa hiển thị tên phím tắt cho gọn
function formatShortcutName(shortcut) {
  return shortcut
    .replace('num', 'Num ')
    .replace('add', '+')
    .replace('sub', '-')
    .replace('mult', '*')
    .replace('div', '/')
    .replace('dec', '.');
}

// Phát âm thanh của một ô
export async function playSound(slotId) {
  const slot = appConfig.soundboard.find(s => s.id === slotId);
  if (!slot || !slot.filePath) {
    if (!states.isSoundboardEditMode) {
      showToast('Ô âm thanh chưa được gán tệp! Hãy bật Chế độ sửa.');
    }
    return;
  }

  const btn = DOM.soundboardGrid.querySelector(`.sb-btn[data-id="${slotId}"]`);

  try {
    // Dừng âm thanh cũ nếu đang phát
    if (currentPlayingAudio) {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
      const playingBtns = DOM.soundboardGrid.querySelectorAll('.sb-btn.playing');
      playingBtns.forEach(b => b.classList.remove('playing'));
    }
    // Tạo đối tượng Audio phát qua custom protocol local-media://, đổi backslash thành slash để tránh lỗi Invalid URL
    const audio = new Audio('local-media://' + slot.filePath.replace(/\\/g, '/'));

    // Tìm deviceId từ nhãn thiết bị đã lưu
    if (appConfig.soundboardAudioOutputLabel && appConfig.soundboardAudioOutputLabel !== 'Mặc định') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const targetDevice = devices.find(d => d.kind === 'audiooutput' && d.label === appConfig.soundboardAudioOutputLabel);
      if (targetDevice) {
        try {
          await audio.setSinkId(targetDevice.deviceId);
        } catch (sinkErr) {
          console.error('Không thể gán thiết bị phát:', sinkErr);
        }
      }
    }

    if (btn) btn.classList.add('playing');

    audio.addEventListener('ended', () => {
      if (btn) btn.classList.remove('playing');
    });

    audio.addEventListener('error', (e) => {
      console.error('Lỗi khi phát file âm thanh:', e);
      if (btn) btn.classList.remove('playing');
      showToast('Lỗi: Không thể phát tệp âm thanh này.');
    });

    await audio.play();
    currentPlayingAudio = audio;
  } catch (err) {
    console.error('Lỗi khởi tạo âm thanh:', err);
    if (btn) btn.classList.remove('playing');
  }
}

// Hiển thị thông báo Toast nhanh trong Status Bar
function showToast(message) {
  const originalText = DOM.statusText.innerText;
  const originalClass = DOM.statusIndicator.className;
  
  DOM.statusText.innerText = message;
  DOM.statusIndicator.className = 'status-indicator warning';

  setTimeout(() => {
    DOM.statusText.innerText = originalText;
    DOM.statusIndicator.className = originalClass;
  }, 4000);
}

// Mở modal cấu hình cho ô bấm
function openEditModal(slotId) {
  const slot = appConfig.soundboard.find(s => s.id === slotId);
  if (!slot) return;

  currentEditingSlotId = slotId;

  DOM.inputSbName.value = slot.name || '';
  DOM.inputSbFile.value = slot.filePath || '';
  DOM.inputSbShortcut.value = slot.shortcut || 'Chưa gán';
  DOM.selectSbColor.value = slot.color || 'purple';

  DOM.soundboardEditModal.classList.remove('hidden');
  DOM.inputSbName.focus();

  // Mở rộng cửa sổ để chứa vừa popup
  if (window.electronAPI) {
    window.electronAPI.resizeWindow('settings');
  }
}

// Cài đặt sự kiện cho modal chỉnh sửa
function setupModalEvents() {
  if (!DOM.soundboardEditModal) return;

  // Nút chọn file âm thanh
  if (DOM.btnSbSelectFile) {
    DOM.btnSbSelectFile.addEventListener('click', async () => {
      const filePath = await window.electronAPI.selectAudioFile();
      if (filePath) {
        DOM.inputSbFile.value = filePath;
        // Tự động điền tên file nếu tên ô đang trống
        if (!DOM.inputSbName.value) {
          const fileName = filePath.split(/[\\/]/).pop().replace(/\.[^/.]+$/, "");
          DOM.inputSbName.value = fileName.substring(0, 15); // giới hạn 15 ký tự cho đẹp nút
        }
      }
    });
  }

  // Ghi nhận phím tắt
  if (DOM.inputSbShortcut) {
    DOM.inputSbShortcut.addEventListener('focus', () => {
      DOM.inputSbShortcut.classList.add('recording');
      DOM.inputSbShortcut.placeholder = 'Nhấn tổ hợp phím...';
    });

    DOM.inputSbShortcut.addEventListener('blur', () => {
      DOM.inputSbShortcut.classList.remove('recording');
      if (!DOM.inputSbShortcut.value) {
        DOM.inputSbShortcut.value = 'Chưa gán';
      }
      DOM.inputSbShortcut.placeholder = 'Nhấp để ghi phím...';
    });

    DOM.inputSbShortcut.addEventListener('keydown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      let key = e.key;

      if (key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta') {
        DOM.inputSbShortcut.value = keys.length > 0 ? keys.join('+') : '';
        return;
      }

      if (key === ' ') {
        key = 'Space';
      } else if (key.length === 1) {
        key = key.toUpperCase();
      } else if (key.startsWith('Arrow')) {
        key = key.replace('Arrow', '');
      } else if (key === 'Escape') {
        DOM.inputSbShortcut.blur();
        return;
      }

      // Numpad key detection
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
      DOM.inputSbShortcut.value = keys.join('+');
      DOM.inputSbShortcut.blur();
    });
  }

  // Xóa phím tắt
  if (DOM.btnSbClearShortcut) {
    DOM.btnSbClearShortcut.addEventListener('click', () => {
      DOM.inputSbShortcut.value = 'Chưa gán';
    });
  }

  // Nút Lưu Lại
  if (DOM.btnSbModalSave) {
    DOM.btnSbModalSave.addEventListener('click', async () => {
      const slotIndex = appConfig.soundboard.findIndex(s => s.id === currentEditingSlotId);
      if (slotIndex !== -1) {
        appConfig.soundboard[slotIndex] = {
          id: currentEditingSlotId,
          name: DOM.inputSbName.value.trim() || 'Trống',
          filePath: DOM.inputSbFile.value.trim(),
          shortcut: DOM.inputSbShortcut.value,
          color: DOM.selectSbColor.value
        };

        // Đóng modal
        DOM.soundboardEditModal.classList.add('hidden');
        if (window.electronAPI) window.electronAPI.resizeWindow('expanded');

        // Lưu cấu hình xuống file
        await window.electronAPI.saveConfig(appConfig);

        // Render lại lưới
        renderSoundboardGrid();
      }
    });
  }

  // Nút Hủy Bỏ
  if (DOM.btnSbModalCancel) {
    DOM.btnSbModalCancel.addEventListener('click', () => {
      DOM.soundboardEditModal.classList.add('hidden');
      if (window.electronAPI) window.electronAPI.resizeWindow('expanded');
    });
  }
}
