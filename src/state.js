export const DEFAULT_CONFIG = {
  midiOutPort: '',
  midiInPort: '',
  shortcuts: {
    toggleMusic: 'Alt+F9',
    toggleMic: 'Alt+F10',
    toggleFx: 'Alt+F11',
    toggleWindow: 'Alt+F12',
    setSingMode: 'Alt+F7',
    setVoiceMode: 'Alt+F8'
  },
  midiChannel: 1,
  autoOpenProject: false,
  projectPath: '',
  opacity: 85,
  customAppTarget: 'YouTube',
  theme: 'dark',
  spotifyClientId: '',
  spotifyClientSecret: '',
  voicePreset: {
    presetName: 'Voice',
    micChange: 10,
    beatChange: -20
  },
  autotuneVersion: 'pro',
  effects: [
    { id: 'fx1', name: 'VANG DÀI', color: 'orange', ccValue: 25, ccToggle: 0, format: 'db' },
    { id: 'fx2', name: 'VANG NGẮN', color: 'yellow', ccValue: 26, ccToggle: 0, format: 'db' },
    { id: 'fx3', name: 'DELAY', color: 'purple', ccValue: 27, ccToggle: 0, format: 'db' },
    { id: 'fx4', name: 'RETUNE SPEED', color: 'red', ccValue: 28, ccToggle: 0, format: 'custom', min: 400, max: 0 },
    { id: 'fx5', name: 'HUMANIZE', color: 'blue', ccValue: 29, ccToggle: 0, format: 'percent' }
  ],
  midiMappings: {
    beatVol: 20,
    beatMute: 21,
    micVol: 22,
    micMute: 23,
    fxMute: 24,
    modeSingVoice: 30,
    autotuneKey: 31,
    autotuneScale: 32
  },
  presets: {
    "Mặc định": { fx1: { val: 24, enabled: true }, fx2: { val: 24, enabled: true }, fx3: { val: 15, enabled: true }, fx4: { val: 20, enabled: true }, fx5: { val: 50, enabled: true } },
    "Nhạc Trẻ": { fx1: { val: 30, enabled: true }, fx2: { val: 20, enabled: true }, fx3: { val: 18, enabled: true }, fx4: { val: 10, enabled: true }, fx5: { val: 30, enabled: true } },
    "Bolero": { fx1: { val: 45, enabled: true }, fx2: { val: 35, enabled: true }, fx3: { val: 40, enabled: true }, fx4: { val: 35, enabled: true }, fx5: { val: 60, enabled: true } },
    "Voice": { fx1: { val: 0, enabled: false }, fx2: { val: 10, enabled: true }, fx3: { val: 0, enabled: false }, fx4: { val: 0, enabled: false }, fx5: { val: 0, enabled: false } }
  },
  soundboard: [
    { id: 0, name: 'Tiếng Cười', filePath: '', shortcut: 'num1', color: 'purple' },
    { id: 1, name: 'Vỗ Tay', filePath: '', shortcut: 'num2', color: 'teal' },
    { id: 2, name: 'Drum Roll', filePath: '', shortcut: 'num3', color: 'orange' },
    { id: 3, name: 'Tiếng Chuông', filePath: '', shortcut: 'num4', color: 'red' },
    { id: 4, name: 'Còi Meme', filePath: '', shortcut: 'Chưa gán', color: 'yellow' },
    { id: 5, name: 'Kinh Ngạc', filePath: '', shortcut: 'Chưa gán', color: 'blue' },
    { id: 6, name: 'Tiếng Khóc', filePath: '', shortcut: 'Chưa gán', color: 'pink' },
    { id: 7, name: 'Thất Bại', filePath: '', shortcut: 'Chưa gán', color: 'grey' },
    { id: 8, name: 'Wow!', filePath: '', shortcut: 'Chưa gán', color: 'green' },
    { id: 9, name: 'Yeah!', filePath: '', shortcut: 'Chưa gán', color: 'purple' },
    { id: 10, name: 'Hồi Hộp', filePath: '', shortcut: 'Chưa gán', color: 'teal' },
    { id: 11, name: 'Gõ Búa', filePath: '', shortcut: 'Chưa gán', color: 'orange' }
  ],
  soundboardAudioOutputLabel: 'Mặc định'
};

// Giả lập API Electron nếu chạy trên trình duyệt web thông thường
if (!window.electronAPI) {
  console.warn("Đang chạy ở môi trường ngoài Electron. Kích hoạt chế độ giả lập.");
  document.body.classList.add('web-mode');
  window.electronAPI = {
    loadConfig: async () => {
      const data = localStorage.getItem('cubase_live_config');
      const loaded = data ? JSON.parse(data) : {};
      return {
        ...DEFAULT_CONFIG,
        ...loaded,
        midiMappings: { ...DEFAULT_CONFIG.midiMappings, ...loaded.midiMappings },
        voicePreset: { ...DEFAULT_CONFIG.voicePreset, ...loaded.voicePreset },
        effects: loaded.effects ? loaded.effects : DEFAULT_CONFIG.effects,
        presets: loaded.presets ? loaded.presets : DEFAULT_CONFIG.presets,
        shortcuts: { ...DEFAULT_CONFIG.shortcuts, ...loaded.shortcuts },
        soundboard: loaded.soundboard ? loaded.soundboard : DEFAULT_CONFIG.soundboard,
        soundboardAudioOutputLabel: loaded.soundboardAudioOutputLabel || DEFAULT_CONFIG.soundboardAudioOutputLabel
      };
    },
    saveConfig: async (config) => {
      localStorage.setItem('cubase_live_config', JSON.stringify(config));
      return true;
    },
    selectFile: async () => {
      return 'C:\\mock-path\\project.cpr';
    },
    selectAudioFile: async () => {
      return 'C:\\mock-path\\beep.mp3';
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
      const appEl = document.getElementById('app');
      if (appEl) {
        if (document.body.classList.contains('web-mode')) {
          appEl.style.height = 'auto';
        } else {
          if (state === 'collapsed') appEl.style.height = '95px';
          else if (state === 'expanded') appEl.style.height = '310px';
          else if (state === 'expanded_tone_only') appEl.style.height = '165px';
          else if (state === 'settings') appEl.style.height = '520px';
        }
      }
    },
    getBrowserTitle: async () => {
      // Giả lập: trả về tiêu đề document hiện tại
      return document.title || null;
    },
    onShortcutPressed: (callback) => {
      console.log('Giả lập đăng ký lắng nghe phím tắt');
      window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'F9') {
          callback('toggleMusic');
        } else if (e.altKey && e.key === 'F10') {
          callback('toggleMic');
        } else if (e.altKey && e.key === 'F11') {
          callback('toggleFx');
        } else if (e.altKey && e.key === 'F12') {
          console.log('Giả lập phím tắt toggleWindow (Alt+F12)');
        } else if (e.altKey && e.key === 'F7') {
          callback('setSingMode');
        } else if (e.altKey && e.key === 'F8') {
          callback('setVoiceMode');
        }
      });
    },
    onPlaySoundboardSlot: (callback) => {
      console.log('Giả lập đăng ký lắng nghe phím tắt soundboard');
      window.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '4') {
          callback(parseInt(e.key) - 1);
        }
      });
    }
  };
}

export let appConfig = null;

export function setAppConfig(config) {
  if (!appConfig) {
    appConfig = config;
  } else {
    Object.assign(appConfig, config);
  }
}

export let savedSingingValues = {
  beatVol: 100,
  micVol: 100,
  fx1: 24,
  fx2: 24,
  fx3: 24,
  fx4: 20,
  fx5: 50,
  fxMuted: false
};

// Lưu trạng thái on/off của từng hiệu ứng (true = on, false = off)
export let effectToggleStates = {};

export let states = {
  beatMuted: false,
  micMuted: false,
  fxMuted: false,
  currentMode: 'sing', // 'sing' | 'voice'
  isFxPanelOpen: false,
  isKeySelectorOpen: false,
  isSettingsOpen: false,
  isAboutOpen: false,
  isSoundboardOpen: false,
  isSoundboardEditMode: false,
  isPinned: true,
  activePreset: 'Mặc định',
  presetToDelete: '',
  presetToOverwrite: '',
  currentKey: 0, // 0 = C (Đô)
  currentScale: 0, // 0 = Major (Trưởng)
  detectedKey: null,
  detectedScale: null,
  detectedConfidence: null,
  candidateKeys: [],
  detectedVoteDetails: [],
  detectedSessionTime: '',
  isWaitingForAutoKey: false,
  detectionMethod: null, // 'title' | 'spotify' | 'audio' | null
};
