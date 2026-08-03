import { midi } from './midi.js';

const DEFAULT_CONFIG = {
  midiOutPort: '',
  midiInPort: '',
  midiChannel: 1,
  autoOpenProject: false,
  projectPath: '',
  opacity: 100,
  scale: 100,
  voicePreset: {
    reverbLong: 0,
    reverbShort: 0,
    delay: 0,
    micChange: 10
  },
  midiMappings: {
    beatVol: 20,
    beatMute: 21,
    micVol: 22,
    micMute: 23,
    fxMute: 24,
    reverbLong: 25,
    reverbShort: 26,
    delay: 27,
    autotune: 28,
    flex: 29,
    modeSingVoice: 30
  },
  presets: {
    "Mặc định": { reverbLong: 24, reverbShort: 24, delay: 24, autotune: 20, flex: 50 },
    "Bolero": { reverbLong: 45, reverbShort: 30, delay: 40, autotune: 15, flex: 60 },
    "Remix": { reverbLong: 15, reverbShort: 10, delay: 15, autotune: 40, flex: 20 },
    "Lofi": { reverbLong: 35, reverbShort: 25, delay: 35, autotune: 5, flex: 80 }
  }
};

// Giả lập API Electron nếu chạy trên trình duyệt web thông thường
if (!window.electronAPI) {
  console.warn("Đang chạy ở môi trường ngoài Electron. Kích hoạt chế độ giả lập.");
  window.electronAPI = {
    loadConfig: async () => {
      const data = localStorage.getItem('cubase_live_config');
      const loaded = data ? JSON.parse(data) : {};
      return {
        ...DEFAULT_CONFIG,
        ...loaded,
        midiMappings: { ...DEFAULT_CONFIG.midiMappings, ...loaded.midiMappings },
        voicePreset: { ...DEFAULT_CONFIG.voicePreset, ...loaded.voicePreset },
        presets: loaded.presets ? loaded.presets : DEFAULT_CONFIG.presets
      };
    },
    saveConfig: async (config) => {
      localStorage.setItem('cubase_live_config', JSON.stringify(config));
      return true;
    },
    selectFile: async () => {
      return 'C:\\mock-path\\project.cpr';
    },
    openCubaseProject: async (path) => {
      console.log('Giả lập mở file project:', path);
      return { success: true };
    },
    minimizeWindow: () => {
      console.log('Giả lập thu nhỏ cửa sổ');
    },
    closeWindow: () => {
      console.log('Giả lập đóng cửa sổ');
    },
    resizeWindow: (state) => {
      console.log('Giả lập thay đổi kích thước:', state);
      // Giả lập thay đổi kích thước cửa sổ trên trình duyệt bằng cách thay đổi CSS height
      const appEl = document.getElementById('app');
      if (appEl) {
        if (state === 'collapsed') appEl.style.height = '95px';
        else if (state === 'expanded') appEl.style.height = '310px';
        else if (state === 'settings') appEl.style.height = '430px';
      }
    }
  };
}

// Khởi tạo đối tượng cấu hình mặc định (sẽ được ghi đè bởi tệp config)
let appConfig = null;

// Lưu trữ giá trị tạm thời trước khi chuyển sang chế độ Voice để khôi phục khi hát lại
let savedSingingValues = {
  micVol: 100,
  reverbLong: 24,
  reverbShort: 24,
  delay: 24,
  autotune: 20,
  flex: 50,
  fxMuted: false
};

// Trạng thái các nút Mute (True = Đang Tắt/Muted, False = Đang Bật/Active)
let states = {
  beatMuted: false,
  micMuted: false,
  fxMuted: false,
  currentMode: 'sing', // 'sing' | 'voice'
  isFxPanelOpen: false,
  isSettingsOpen: false,
  activePreset: 'Mặc định',
  presetToDelete: ''
};

// Các phần tử DOM
const DOM = {
  app: document.getElementById('app'),
  
  // Nút điều khiển cửa sổ
  btnMinimize: document.getElementById('btn-minimize'),
  btnClose: document.getElementById('btn-close'),
  btnSettingsToggle: document.getElementById('btn-settings-toggle'),
  
  // Nút chức năng chính
  btnBeatMute: document.getElementById('btn-beat-mute'),
  btnMicMute: document.getElementById('btn-mic-mute'),
  btnFxMute: document.getElementById('btn-fx-mute'),
  btnModeToggle: document.getElementById('btn-mode-toggle'),
  btnReverbToggle: document.getElementById('btn-reverb-toggle'),
  
  // Thanh trượt chính
  sliderBeatVol: document.getElementById('slider-beat-vol'),
  sliderMicVol: document.getElementById('slider-mic-vol'),
  valBeatVol: document.getElementById('val-beat-vol'),
  valMicVol: document.getElementById('val-mic-vol'),
  fillBeatVol: document.getElementById('fill-beat-vol'),
  fillMicVol: document.getElementById('fill-mic-vol'),
  
  // Panel chỉnh vang & sliders
  fxPanel: document.getElementById('fx-panel'),
  sliders: {
    reverbLong: document.getElementById('slider-reverb-long'),
    reverbShort: document.getElementById('slider-reverb-short'),
    delay: document.getElementById('slider-delay'),
    autotune: document.getElementById('slider-autotune'),
    flex: document.getElementById('slider-flex')
  },
  vals: {
    reverbLong: document.getElementById('val-reverb-long'),
    reverbShort: document.getElementById('val-reverb-short'),
    delay: document.getElementById('val-delay'),
    autotune: document.getElementById('val-autotune'),
    flex: document.getElementById('val-flex')
  },
  fills: {
    reverbLong: document.querySelector('.fill-orange'),
    reverbShort: document.querySelector('.fill-yellow'),
    delay: document.querySelector('.fill-purple'),
    autotune: document.querySelector('.fill-red'),
    flex: document.querySelector('.fill-blue')
  },
  
  // Panel cài đặt & inputs
  settingsPanel: document.getElementById('settings-panel'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  selectMidiOut: document.getElementById('select-midi-out'),
  selectMidiIn: document.getElementById('select-midi-in'),
  inputMidiChannel: document.getElementById('input-midi-channel'),
  
  // Mapping inputs
  mapBeatVol: document.getElementById('map-beat-vol'),
  mapBeatMute: document.getElementById('map-beat-mute'),
  mapMicVol: document.getElementById('map-mic-vol'),
  mapMicMute: document.getElementById('map-mic-mute'),
  mapFxMute: document.getElementById('map-fx-mute'),
  mapReverbLong: document.getElementById('map-reverb-long'),
  mapReverbShort: document.getElementById('map-reverb-short'),
  mapDelay: document.getElementById('map-delay'),
  mapAutotune: document.getElementById('map-autotune'),
  mapFlex: document.getElementById('map-flex'),
  
  // General inputs
  inputProjectPath: document.getElementById('input-project-path'),
  btnSelectProject: document.getElementById('btn-select-project'),
  chkAutoOpen: document.getElementById('chk-auto-open'),
  sliderOpacity: document.getElementById('slider-opacity'),
  valOpacity: document.getElementById('val-opacity'),
  
  // Voice Presets inputs
  presetReverbLong: document.getElementById('preset-reverb-long'),
  presetReverbShort: document.getElementById('preset-reverb-short'),
  presetDelay: document.getElementById('preset-delay'),
  presetMicChange: document.getElementById('preset-mic-change'),
  
  // Cấu hình Preset
  presetsSystemList: document.getElementById('presets-system-list'),
  presetsCustomList: document.getElementById('presets-custom-list'),
  btnAddPreset: document.getElementById('btn-add-preset'),
  presetModal: document.getElementById('preset-modal'),
  inputPresetName: document.getElementById('input-preset-name'),
  btnModalSave: document.getElementById('btn-modal-save'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmModalText: document.getElementById('confirm-modal-text'),
  btnConfirmYes: document.getElementById('btn-confirm-yes'),
  btnConfirmNo: document.getElementById('btn-confirm-no'),
  
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  
  // Status Bar
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text')
};

// -------------------------------------------------------------
// HÀM TIỆN ÍCH CẬP NHẬT GIAO DIỆN SLIDER (TRACK FILL)
// -------------------------------------------------------------
function updateSliderFill(slider, fillElement, valElement) {
  if (!slider) return;
  const percent = (slider.value / slider.max) * 100;
  if (fillElement) fillElement.style.width = percent + '%';
  if (valElement) valElement.innerText = slider.value;
}

// -------------------------------------------------------------
// QUẢN LÝ CẬP NHẬT TRẠNG THÁI STATUS BAR
// -------------------------------------------------------------
function updateStatus(text, isConnected = true) {
  DOM.statusText.innerText = text;
  if (isConnected) {
    DOM.statusIndicator.className = 'status-indicator connected';
  } else {
    DOM.statusIndicator.className = 'status-indicator disconnected';
  }
}

// -------------------------------------------------------------
// KHỞI TẠO CÁC CỔNG MIDI VÀ KẾT NỐI
// -------------------------------------------------------------
async function initMidi() {
  try {
    updateStatus('Đang khởi tạo MIDI...');
    await midi.initialize();
    
    // Cập nhật dropdowns cài đặt
    populateMidiPorts();
    
    // Đặt kênh MIDI từ cấu hình
    midi.setChannel(appConfig.midiChannel);
    
    // Thực hiện kết nối tới các cổng đã lưu
    connectMidi();
  } catch (err) {
    console.error('Không khởi tạo được MIDI:', err);
    updateStatus('Không tìm thấy thiết bị MIDI. Hãy cài loopMIDI!', false);
  }
}

function populateMidiPorts() {
  const outs = midi.getOutputPorts();
  const ins = midi.getInputPorts();
  
  // Xóa danh sách cũ ngoại trừ lựa chọn đầu tiên
  DOM.selectMidiOut.innerHTML = '<option value="">-- Chưa kết nối --</option>';
  DOM.selectMidiIn.innerHTML = '<option value="">-- Chưa kết nối --</option>';
  
  outs.forEach(port => {
    const opt = document.createElement('option');
    opt.value = port.name;
    opt.innerText = port.name;
    DOM.selectMidiOut.appendChild(opt);
  });
  
  ins.forEach(port => {
    const opt = document.createElement('option');
    opt.value = port.name;
    opt.innerText = port.name;
    DOM.selectMidiIn.appendChild(opt);
  });
  
  // Set giá trị đã lưu
  DOM.selectMidiOut.value = appConfig.midiOutPort;
  DOM.selectMidiIn.value = appConfig.midiInPort;
}

function connectMidi() {
  let statusMsg = '';
  
  // Kết nối cổng Out
  if (appConfig.midiOutPort) {
    const successOut = midi.connectOutput(appConfig.midiOutPort);
    if (successOut) {
      statusMsg += `MIDI Out: ${appConfig.midiOutPort}`;
    } else {
      statusMsg += `Lỗi kết nối Out: ${appConfig.midiOutPort}`;
    }
  } else {
    statusMsg += 'Chưa cấu hình MIDI Out';
  }
  
  // Kết nối cổng In và đăng ký lắng nghe đồng bộ 2 chiều
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
function handleIncomingMidiCC({ cc, value }) {
  const mappings = appConfig.midiMappings;
  
  // Đồng bộ Vol Nhạc
  if (cc === mappings.beatVol) {
    DOM.sliderBeatVol.value = value;
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
  }
  // Đồng bộ Vol Mic
  else if (cc === mappings.micVol) {
    DOM.sliderMicVol.value = value;
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
  }
  // Đồng bộ Tắt/Mở Nhạc
  else if (cc === mappings.beatMute) {
    const isMuted = value >= 64;
    setBeatMuteUI(isMuted);
  }
  // Đồng bộ Tắt/Mở Mic
  else if (cc === mappings.micMute) {
    const isMuted = value >= 64;
    setMicMuteUI(isMuted);
  }
  // Đồng bộ Tắt/Mở Vang
  else if (cc === mappings.fxMute) {
    const isMuted = value >= 64;
    setFxMuteUI(isMuted);
  }
  // Đồng bộ Vang Dài
  else if (cc === mappings.reverbLong) {
    DOM.sliders.reverbLong.value = value;
    updateSliderFill(DOM.sliders.reverbLong, DOM.fills.reverbLong, DOM.vals.reverbLong);
  }
  // Đồng bộ Vang Ngắn
  else if (cc === mappings.reverbShort) {
    DOM.sliders.reverbShort.value = value;
    updateSliderFill(DOM.sliders.reverbShort, DOM.fills.reverbShort, DOM.vals.reverbShort);
  }
  // Đồng bộ Delay
  else if (cc === mappings.delay) {
    DOM.sliders.delay.value = value;
    updateSliderFill(DOM.sliders.delay, DOM.fills.delay, DOM.vals.delay);
  }
  // Đồng bộ Auto-tune
  else if (cc === mappings.autotune) {
    DOM.sliders.autotune.value = value;
    updateSliderFill(DOM.sliders.autotune, DOM.fills.autotune, DOM.vals.autotune);
  }
  // Đồng bộ Flex
  else if (cc === mappings.flex) {
    DOM.sliders.flex.value = value;
    updateSliderFill(DOM.sliders.flex, DOM.fills.flex, DOM.vals.flex);
  }
}

// -------------------------------------------------------------
// ĐIỀU KHIỂN GIAO DIỆN TẮT/MỞ (MUTE UI) & GỬI LỆNH MIDI
// -------------------------------------------------------------
function setBeatMuteUI(isMuted) {
  states.beatMuted = isMuted;
  if (isMuted) {
    DOM.btnBeatMute.classList.add('muted');
    DOM.btnBeatMute.innerText = 'Bật Nhạc';
  } else {
    DOM.btnBeatMute.classList.remove('muted');
    DOM.btnBeatMute.innerText = 'Tắt Nhạc';
  }
}

async function autoSaveCurrentStates() {
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
    activePreset: states.activePreset
  };
  
  // Tự động CẬP NHẬT các thông số fader mới vào chính Preset đang được chọn (chỉ áp dụng cho Preset TỰ TẠO, không ghi đè Preset mặc định)
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

// Render các nút Preset giọng hát từ config (Chia nhóm Hệ Thống và Cá Nhân)
function renderPresets() {
  if (!DOM.presetsSystemList || !DOM.presetsCustomList || !appConfig || !appConfig.presets) return;
  
  DOM.presetsSystemList.innerHTML = '';
  DOM.presetsCustomList.innerHTML = '';
  
  const defaultPresets = ["Mặc định", "Bolero", "Remix", "Lofi"];
  
  // Sắp xếp các phím preset (Hệ thống lên trước theo thứ tự chuẩn, Cá nhân xếp alphabet)
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
    
    // Sự kiện click để load
    btn.addEventListener('click', () => loadPreset(name));
    
    const isSystem = defaultPresets.includes(name);
    
    if (isSystem) {
      btn.classList.add('system-preset');
      btn.title = "Preset chuẩn hệ thống (không thể ghi đè thông số gốc)";
      DOM.presetsSystemList.appendChild(btn);
    } else {
      btn.classList.add('custom-preset');
      btn.title = "Preset cá nhân của bạn (tự động lưu khi chỉnh, chuột phải để xóa)";
      
      // Sự kiện chuột phải để xóa
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        deletePreset(name);
      });
      
      DOM.presetsCustomList.appendChild(btn);
    }
  });
}

// Tải một preset lên faders và gửi tín hiệu MIDI sang Cubase
function loadPreset(name) {
  if (!appConfig || !appConfig.presets || !appConfig.presets[name]) return;
  
  states.activePreset = name;
  renderPresets();
  
  const preset = appConfig.presets[name];
  
  // 1. Cập nhật giá trị vào các thanh trượt
  DOM.sliders.reverbLong.value = preset.reverbLong;
  DOM.sliders.reverbShort.value = preset.reverbShort;
  DOM.sliders.delay.value = preset.delay;
  DOM.sliders.autotune.value = preset.autotune ?? preset.autoTune ?? 20;
  DOM.sliders.flex.value = preset.flex;
  
  // 2. Cập nhật background track fill của fader
  Object.keys(DOM.sliders).forEach(key => {
    updateSliderFill(DOM.sliders[key], DOM.fills[key], DOM.vals[key]);
  });
  
  // 3. Gửi lệnh MIDI CC tương ứng sang Cubase
  midi.sendCC(appConfig.midiMappings.reverbLong, preset.reverbLong);
  midi.sendCC(appConfig.midiMappings.reverbShort, preset.reverbShort);
  midi.sendCC(appConfig.midiMappings.delay, preset.delay);
  midi.sendCC(appConfig.midiMappings.autotune, preset.autotune ?? preset.autoTune ?? 20);
  midi.sendCC(appConfig.midiMappings.flex, preset.flex);
  
  // 4. Tự động lưu trạng thái hiện tại
  autoSaveCurrentStates();
}

// Lưu các giá trị hiện tại của fader thành Preset mới
// Lưu các giá trị hiện tại của fader thành Preset mới (Mở Modal nhập tên)
function saveCurrentAsPreset() {
  DOM.inputPresetName.value = '';
  DOM.presetModal.classList.remove('hidden');
  DOM.inputPresetName.focus();
}

// Xử lý lưu lại preset khi nhấn nút trên Modal
async function submitNewPreset() {
  const name = DOM.inputPresetName.value.trim();
  if (name === '') {
    alert('Tên Preset không được để trống!');
    return;
  }
  
  if (appConfig.presets && appConfig.presets[name]) {
    const override = confirm(`Preset tên "${name}" đã tồn tại. Bạn có muốn ghi đè cấu hình mới này đè lên không?`);
    if (!override) return;
  }
  
  // Tạo đối tượng preset mới
  const newPreset = {
    reverbLong: parseInt(DOM.sliders.reverbLong.value),
    reverbShort: parseInt(DOM.sliders.reverbShort.value),
    delay: parseInt(DOM.sliders.delay.value),
    autotune: parseInt(DOM.sliders.autotune.value),
    flex: parseInt(DOM.sliders.flex.value)
  };
  
  // Lưu vào cấu hình
  if (!appConfig.presets) appConfig.presets = {};
  appConfig.presets[name] = newPreset;
  states.activePreset = name;
  
  // Ghi tệp config.json
  const success = await window.electronAPI.saveConfig(appConfig);
  if (success) {
    renderPresets();
    DOM.presetModal.classList.add('hidden'); // Ẩn modal sau khi lưu thành công
  } else {
    alert('Lỗi: Không thể lưu Preset mới.');
  }
}

// Xóa Preset (Mở Modal xác nhận xóa, không dùng confirm() đồng bộ gây đơ)
function deletePreset(name) {
  // Không cho xóa preset mặc định hệ thống
  const defaultPresets = ["Mặc định", "Bolero", "Remix", "Lofi"];
  if (defaultPresets.includes(name)) {
    alert(`Không thể xóa Preset mặc định "${name}" của hệ thống!`);
    return;
  }
  
  states.presetToDelete = name;
  DOM.confirmModalText.innerText = `Bạn có chắc chắn muốn xóa Preset giọng hát "${name}" không?`;
  DOM.confirmModal.classList.remove('hidden');
}

// Xử lý thực hiện xóa Preset khi nhấn xác nhận trên Modal
async function confirmDeletePreset() {
  const name = states.presetToDelete;
  if (!name) return;
  
  delete appConfig.presets[name];
  
  // Nếu đang active preset bị xóa, quay về mặc định
  if (states.activePreset === name) {
    states.activePreset = "Mặc định";
  }
  
  const success = await window.electronAPI.saveConfig(appConfig);
  if (success) {
    renderPresets();
  } else {
    alert('Lỗi: Không thể xóa Preset.');
  }
  
  // Đóng modal và reset trạng thái
  DOM.confirmModal.classList.add('hidden');
  states.presetToDelete = '';
}

function toggleBeatMute() {
  const nextState = !states.beatMuted;
  setBeatMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.beatMute, nextState ? 127 : 0);
  autoSaveCurrentStates();
}

function setMicMuteUI(isMuted) {
  states.micMuted = isMuted;
  if (isMuted) {
    DOM.btnMicMute.classList.add('muted');
    DOM.btnMicMute.innerText = 'Bật Mic';
  } else {
    DOM.btnMicMute.classList.remove('muted');
    DOM.btnMicMute.innerText = 'Tắt Mic';
  }
}

function toggleMicMute() {
  const nextState = !states.micMuted;
  setMicMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.micMute, nextState ? 127 : 0);
  autoSaveCurrentStates();
}

function setFxMuteUI(isMuted) {
  states.fxMuted = isMuted;
  if (isMuted) {
    DOM.btnFxMute.classList.add('muted');
    DOM.btnFxMute.innerText = 'Bật Vang';
  } else {
    DOM.btnFxMute.classList.remove('muted');
    DOM.btnFxMute.innerText = 'Tắt Vang';
  }
}

function toggleFxMute() {
  const nextState = !states.fxMuted;
  setFxMuteUI(nextState);
  midi.sendCC(appConfig.midiMappings.fxMute, nextState ? 127 : 0);
  autoSaveCurrentStates();
}

// -------------------------------------------------------------
// CHUYỂN ĐỔI CHẾ ĐỘ HÁT LIVE <=> VOICE ĐỐI THOẠI
// -------------------------------------------------------------
function toggleSingVoiceMode() {
  if (states.currentMode === 'sing') {
    // CHUYỂN SANG VOICE
    states.currentMode = 'voice';
    DOM.btnModeToggle.className = 'action-btn btn-blue active'; // Đổi màu hiển thị
    DOM.btnModeToggle.style.backgroundColor = 'var(--color-orange)';
    DOM.btnModeToggle.querySelector('.mode-text').innerText = 'VOICE ĐỐI THOẠI';
    DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click để HÁT';

    // 1. Lưu các giá trị hiện tại để phục hồi sau này
    savedSingingValues.micVol = parseInt(DOM.sliderMicVol.value);
    savedSingingValues.reverbLong = parseInt(DOM.sliders.reverbLong.value);
    savedSingingValues.reverbShort = parseInt(DOM.sliders.reverbShort.value);
    savedSingingValues.delay = parseInt(DOM.sliders.delay.value);
    savedSingingValues.autotune = parseInt(DOM.sliders.autotune.value);
    savedSingingValues.flex = parseInt(DOM.sliders.flex.value);
    savedSingingValues.fxMuted = states.fxMuted;

    // 2. Thiết lập thông số về mức nói chuyện (theo cài đặt)
    const preset = appConfig.voicePreset;
    
    // Tự động tắt vang / đưa về mức nhỏ
    midi.sendCC(appConfig.midiMappings.reverbLong, preset.reverbLong);
    midi.sendCC(appConfig.midiMappings.reverbShort, preset.reverbShort);
    midi.sendCC(appConfig.midiMappings.delay, preset.delay);
    midi.sendCC(appConfig.midiMappings.autotune, preset.autoTune);
    midi.sendCC(appConfig.midiMappings.flex, preset.flex);

    // Cập nhật giao diện thanh trượt tương ứng
    DOM.sliders.reverbLong.value = preset.reverbLong;
    DOM.sliders.reverbShort.value = preset.reverbShort;
    DOM.sliders.delay.value = preset.delay;
    DOM.sliders.autotune.value = preset.autoTune;
    DOM.sliders.flex.value = preset.flex;

    Object.keys(DOM.sliders).forEach(key => {
      updateSliderFill(DOM.sliders[key], DOM.fills[key], DOM.vals[key]);
    });

    // Thay đổi âm lượng Mic (nói chuyện thường to/rõ hơn hoặc giảm để tránh hú)
    let newMicVol = savedSingingValues.micVol + preset.micChange;
    newMicVol = Math.max(0, Math.min(127, newMicVol));
    DOM.sliderMicVol.value = newMicVol;
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    midi.sendCC(appConfig.midiMappings.micVol, newMicVol);

    // Tắt vang hoàn toàn trên Mixer
    setFxMuteUI(true);
    midi.sendCC(appConfig.midiMappings.fxMute, 127); // Gửi lệnh câm FX

    // Gửi tín hiệu CC thay đổi chế độ cho Cubase (nếu Cubase cần)
    midi.sendCC(appConfig.midiMappings.modeSingVoice, 0); // 0 = Voice

  } else {
    // PHỤC HỒI CHẾ ĐỘ HÁT
    states.currentMode = 'sing';
    DOM.btnModeToggle.className = 'action-btn btn-blue';
    DOM.btnModeToggle.style.backgroundColor = '';
    DOM.btnModeToggle.querySelector('.mode-text').innerText = 'HÁT LIVE';
    DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click đổi Voice';

    // 1. Gửi lại các giá trị hát đã lưu sang Cubase
    midi.sendCC(appConfig.midiMappings.reverbLong, savedSingingValues.reverbLong);
    midi.sendCC(appConfig.midiMappings.reverbShort, savedSingingValues.reverbShort);
    midi.sendCC(appConfig.midiMappings.delay, savedSingingValues.delay);
    midi.sendCC(appConfig.midiMappings.autotune, savedSingingValues.autotune);
    midi.sendCC(appConfig.midiMappings.flex, savedSingingValues.flex);
    midi.sendCC(appConfig.midiMappings.micVol, savedSingingValues.micVol);

    // 2. Cập nhật lại UI thanh trượt
    DOM.sliders.reverbLong.value = savedSingingValues.reverbLong;
    DOM.sliders.reverbShort.value = savedSingingValues.reverbShort;
    DOM.sliders.delay.value = savedSingingValues.delay;
    DOM.sliders.autotune.value = savedSingingValues.autotune;
    DOM.sliders.flex.value = savedSingingValues.flex;
    DOM.sliderMicVol.value = savedSingingValues.micVol;

    Object.keys(DOM.sliders).forEach(key => {
      updateSliderFill(DOM.sliders[key], DOM.fills[key], DOM.vals[key]);
    });
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);

    // Khôi phục trạng thái Mute FX
    setFxMuteUI(savedSingingValues.fxMuted);
    midi.sendCC(appConfig.midiMappings.fxMute, savedSingingValues.fxMuted ? 127 : 0);

    // Gửi tín hiệu CC sang Cubase
    midi.sendCC(appConfig.midiMappings.modeSingVoice, 127); // 127 = Hát
  }
  autoSaveCurrentStates();
}

// -------------------------------------------------------------
// ĐIỀU KHIỂN HIỂN THỊ PANEL MỞ RỘNG (REVERB / SETTINGS)
// -------------------------------------------------------------
function toggleFxPanel() {
  states.isFxPanelOpen = !states.isFxPanelOpen;
  
  if (states.isFxPanelOpen) {
    // Mở bảng chỉnh vang
    DOM.fxPanel.classList.remove('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
    DOM.btnReverbToggle.classList.add('active');
    
    // Nếu bảng cài đặt đang mở thì đóng lại
    if (states.isSettingsOpen) {
      closeSettingsPanelUI();
    }
    
    window.electronAPI.resizeWindow('expanded');
  } else {
    // Đóng bảng chỉnh vang
    DOM.fxPanel.classList.add('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
    DOM.btnReverbToggle.classList.remove('active');
    
    window.electronAPI.resizeWindow('collapsed');
  }
}

function openSettingsPanel() {
  states.isSettingsOpen = true;
  DOM.settingsPanel.classList.remove('hidden');
  DOM.btnSettingsToggle.classList.add('active');
  
  // Đóng tạm thời panel chỉnh vang
  DOM.fxPanel.classList.add('hidden');
  DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▾';
  DOM.btnReverbToggle.classList.remove('active');
  
  // Resize window sang kích thước settings
  window.electronAPI.resizeWindow('settings');
  
  // Điền cấu hình hiện tại vào form
  loadConfigToForm();
}

function closeSettingsPanelUI() {
  states.isSettingsOpen = false;
  DOM.settingsPanel.classList.add('hidden');
  DOM.btnSettingsToggle.classList.remove('active');
}

function cancelSettings() {
  closeSettingsPanelUI();
  
  // Khôi phục lại độ trong suốt preview về đúng config cũ
  DOM.app.style.opacity = appConfig.opacity / 100;
  
  // Khôi phục lại trạng thái mở bảng Vang nếu trước đó đang mở
  if (states.isFxPanelOpen) {
    DOM.fxPanel.classList.remove('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
    DOM.btnReverbToggle.classList.add('active');
    window.electronAPI.resizeWindow('expanded');
  } else {
    window.electronAPI.resizeWindow('collapsed');
  }
}

// -------------------------------------------------------------
// ĐỌC / GHI DỮ LIỆU TỪ TRANG SETTINGS FORM
// -------------------------------------------------------------
function loadConfigToForm() {
  // MIDI tab
  DOM.selectMidiOut.value = appConfig.midiOutPort;
  DOM.selectMidiIn.value = appConfig.midiInPort;
  DOM.inputMidiChannel.value = appConfig.midiChannel;
  
  // Mapping tab
  DOM.mapBeatVol.value = appConfig.midiMappings.beatVol;
  DOM.mapBeatMute.value = appConfig.midiMappings.beatMute;
  DOM.mapMicVol.value = appConfig.midiMappings.micVol;
  DOM.mapMicMute.value = appConfig.midiMappings.micMute;
  DOM.mapFxMute.value = appConfig.midiMappings.fxMute;
  DOM.mapReverbLong.value = appConfig.midiMappings.reverbLong;
  DOM.mapReverbShort.value = appConfig.midiMappings.reverbShort;
  DOM.mapDelay.value = appConfig.midiMappings.delay;
  DOM.mapAutotune.value = appConfig.midiMappings.autotune;
  DOM.mapFlex.value = appConfig.midiMappings.flex;
  
  // General tab
  DOM.inputProjectPath.value = appConfig.projectPath;
  DOM.chkAutoOpen.checked = appConfig.autoOpenProject;
  DOM.sliderOpacity.value = appConfig.opacity;
  DOM.valOpacity.innerText = appConfig.opacity + '%';
  
  // Preset tab
  DOM.presetReverbLong.value = appConfig.voicePreset.reverbLong;
  DOM.presetReverbShort.value = appConfig.voicePreset.reverbShort;
  DOM.presetDelay.value = appConfig.voicePreset.delay;
  DOM.presetMicChange.value = appConfig.voicePreset.micChange ?? appConfig.voicePreset.micVolChange ?? 10;
}

async function saveSettings() {
  const newConfig = {
    midiOutPort: DOM.selectMidiOut.value,
    midiInPort: DOM.selectMidiIn.value,
    midiChannel: parseInt(DOM.inputMidiChannel.value),
    autoOpenProject: DOM.chkAutoOpen.checked,
    projectPath: DOM.inputProjectPath.value,
    opacity: parseInt(DOM.sliderOpacity.value),
    scale: appConfig.scale, // giữ nguyên tỷ lệ hiện tại
    voicePreset: {
      reverbLong: parseInt(DOM.presetReverbLong.value),
      reverbShort: parseInt(DOM.presetReverbShort.value),
      delay: parseInt(DOM.presetDelay.value),
      micChange: parseInt(DOM.presetMicChange.value)
    },
    midiMappings: {
      beatVol: parseInt(DOM.mapBeatVol.value),
      beatMute: parseInt(DOM.mapBeatMute.value),
      micVol: parseInt(DOM.mapMicVol.value),
      micMute: parseInt(DOM.mapMicMute.value),
      fxMute: parseInt(DOM.mapFxMute.value),
      reverbLong: parseInt(DOM.mapReverbLong.value),
      reverbShort: parseInt(DOM.mapReverbShort.value),
      delay: parseInt(DOM.mapDelay.value),
      autotune: parseInt(DOM.mapAutotune.value),
      flex: parseInt(DOM.mapFlex.value),
      modeSingVoice: appConfig.midiMappings.modeSingVoice // giữ nguyên
    }
  };
  
  const success = await window.electronAPI.saveConfig(newConfig);
  if (success) {
    appConfig = newConfig;
    
    // Áp dụng các thay đổi cấu hình mới
    midi.setChannel(appConfig.midiChannel);
    connectMidi();
    DOM.app.style.opacity = appConfig.opacity / 100;
    
    // Đóng panel
    closeSettingsPanelUI();
    
    // Khôi phục lại trạng thái mở bảng Vang nếu trước đó mở
    if (states.isFxPanelOpen) {
      DOM.fxPanel.classList.remove('hidden');
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
      DOM.btnReverbToggle.classList.add('active');
      window.electronAPI.resizeWindow('expanded');
    } else {
      window.electronAPI.resizeWindow('collapsed');
    }
  } else {
    alert('Không thể lưu cấu hình, đã có lỗi xảy ra!');
  }
}

// -------------------------------------------------------------
// THIẾT LẬP SỰ KIỆN KHỞI TẠO VÀ LẮNG NGHE (EVENT LISTENERS)
// -------------------------------------------------------------
function setupEventListeners() {
  // Điều khiển cửa sổ từ Electron API
  DOM.btnMinimize.addEventListener('click', () => window.electronAPI.minimizeWindow());
  DOM.btnClose.addEventListener('click', () => window.electronAPI.closeWindow());
  DOM.btnSettingsToggle.addEventListener('click', () => {
    if (states.isSettingsOpen) {
      cancelSettings();
    } else {
      openSettingsPanel();
    }
  });
  
  // Xử lý Tabs trong phần cài đặt
  DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabButtons.forEach(b => b.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Các nút Mute
  DOM.btnBeatMute.addEventListener('click', toggleBeatMute);
  DOM.btnMicMute.addEventListener('click', toggleMicMute);
  DOM.btnFxMute.addEventListener('click', toggleFxMute);
  
  // Chuyển Mode Hát / Voice
  DOM.btnModeToggle.addEventListener('click', toggleSingVoiceMode);
  
  // Nút mở bảng vang
  DOM.btnReverbToggle.addEventListener('click', toggleFxPanel);
  
  // Nút trong Cài đặt
  DOM.btnSaveSettings.addEventListener('click', saveSettings);
  DOM.btnCloseSettings.addEventListener('click', cancelSettings);
  
  DOM.btnSelectProject.addEventListener('click', async () => {
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      DOM.inputProjectPath.value = filePath;
    }
  });
  
  // Sự kiện thay đổi Opacity tức thời (Real-time preview)
  DOM.sliderOpacity.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.valOpacity.innerText = val + '%';
    DOM.app.style.opacity = val / 100;
  });

  // Gắn sự kiện gửi MIDI cho các thanh trượt Vol chính
  DOM.sliderBeatVol.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    midi.sendCC(appConfig.midiMappings.beatVol, e.target.value);
  });
  DOM.sliderMicVol.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    midi.sendCC(appConfig.midiMappings.micVol, e.target.value);
  });
  
  // Gắn sự kiện gửi MIDI cho các thanh trượt bảng Vang
  DOM.sliders.reverbLong.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliders.reverbLong, DOM.fills.reverbLong, DOM.vals.reverbLong);
    midi.sendCC(appConfig.midiMappings.reverbLong, e.target.value);
  });
  DOM.sliders.reverbShort.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliders.reverbShort, DOM.fills.reverbShort, DOM.vals.reverbShort);
    midi.sendCC(appConfig.midiMappings.reverbShort, e.target.value);
  });
  DOM.sliders.delay.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliders.delay, DOM.fills.delay, DOM.vals.delay);
    midi.sendCC(appConfig.midiMappings.delay, e.target.value);
  });
  DOM.sliders.autotune.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliders.autotune, DOM.fills.autotune, DOM.vals.autotune);
    midi.sendCC(appConfig.midiMappings.autotune, e.target.value);
  });
  DOM.sliders.flex.addEventListener('input', (e) => {
    updateSliderFill(DOM.sliders.flex, DOM.fills.flex, DOM.vals.flex);
    midi.sendCC(appConfig.midiMappings.flex, e.target.value);
  });

  // Tự động lưu cấu hình khi người dùng nhả chuột kéo slider
  DOM.sliderBeatVol.addEventListener('change', autoSaveCurrentStates);
  DOM.sliderMicVol.addEventListener('change', autoSaveCurrentStates);
  DOM.sliders.reverbLong.addEventListener('change', autoSaveCurrentStates);
  DOM.sliders.reverbShort.addEventListener('change', autoSaveCurrentStates);
  DOM.sliders.delay.addEventListener('change', autoSaveCurrentStates);
  DOM.sliders.autotune.addEventListener('change', autoSaveCurrentStates);
  DOM.sliders.flex.addEventListener('change', autoSaveCurrentStates);
  
  // Sự kiện click thêm Preset mới
  DOM.btnAddPreset.addEventListener('click', saveCurrentAsPreset);
  
  // Sự kiện của Modal lưu Preset mới
  DOM.btnModalSave.addEventListener('click', submitNewPreset);
  DOM.btnModalCancel.addEventListener('click', () => DOM.presetModal.classList.add('hidden'));
  DOM.inputPresetName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitNewPreset();
  });
  
  // Sự kiện của Modal xác nhận xóa Preset
  DOM.btnConfirmYes.addEventListener('click', confirmDeletePreset);
  DOM.btnConfirmNo.addEventListener('click', () => DOM.confirmModal.classList.add('hidden'));
}

// -------------------------------------------------------------
// KHỞI CHẠY KHI TẢI XONG TRANG
// -------------------------------------------------------------
async function bootstrap() {
  try {
    // 1. Tải cấu hình từ file
    appConfig = await window.electronAPI.loadConfig();
    
    // Áp dụng các giá trị slider/mute được lưu từ phiên làm việc trước
    if (appConfig.lastValues) {
      DOM.sliderBeatVol.value = appConfig.lastValues.beatVol ?? 100;
      DOM.sliderMicVol.value = appConfig.lastValues.micVol ?? 100;
      DOM.sliders.reverbLong.value = appConfig.lastValues.reverbLong ?? 24;
      DOM.sliders.reverbShort.value = appConfig.lastValues.reverbShort ?? 24;
      DOM.sliders.delay.value = appConfig.lastValues.delay ?? 24;
      DOM.sliders.autotune.value = appConfig.lastValues.autotune ?? 20;
      DOM.sliders.flex.value = appConfig.lastValues.flex ?? 50;

      states.beatMuted = appConfig.lastValues.beatMuted ?? false;
      states.micMuted = appConfig.lastValues.micMuted ?? false;
      states.fxMuted = appConfig.lastValues.fxMuted ?? false;
      states.currentMode = appConfig.lastValues.currentMode ?? 'sing';
      states.activePreset = appConfig.lastValues.activePreset ?? 'Mặc định';

      // Cập nhật giao diện nút chế độ nếu trước đó đang ở Voice
      if (states.currentMode === 'voice') {
        DOM.btnModeToggle.className = 'action-btn btn-blue active';
        DOM.btnModeToggle.style.backgroundColor = 'var(--color-orange)';
        DOM.btnModeToggle.querySelector('.mode-text').innerText = 'VOICE ĐỐI THOẠI';
        DOM.btnModeToggle.querySelector('.mode-sub').innerText = 'Click để HÁT';
      }
    }
    
    // 2. Thiết lập sự kiện lắng nghe người dùng
    setupEventListeners();
    
    // Vẽ danh sách các Presets
    renderPresets();
    
    // 3. Đưa cấu hình lên UI chính
    DOM.app.style.opacity = appConfig.opacity / 100;
    
    // Cập nhật giá trị hiển thị và fill track cho các slider chính
    updateSliderFill(DOM.sliderBeatVol, DOM.fillBeatVol, DOM.valBeatVol);
    updateSliderFill(DOM.sliderMicVol, DOM.fillMicVol, DOM.valMicVol);
    
    // Cập nhật giá trị hiển thị và fill track cho các slider bảng vang
    Object.keys(DOM.sliders).forEach(key => {
      updateSliderFill(DOM.sliders[key], DOM.fills[key], DOM.vals[key]);
    });
    
    // Cập nhật nút bấm UI
    setBeatMuteUI(states.beatMuted);
    setMicMuteUI(states.micMuted);
    setFxMuteUI(states.fxMuted);
    
    // 4. Khởi chạy MIDI Engine
    await initMidi();
  } catch (error) {
    console.error('Lỗi trong quá trình khởi chạy phần mềm:', error);
    alert('Có lỗi xảy ra khi khởi động giao diện điều khiển: ' + error.message);
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
