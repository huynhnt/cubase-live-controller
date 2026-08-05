export const DEFAULT_CONFIG = {
  midiOutPort: '',
  midiInPort: '',
  midiChannel: 1,
  autoOpenProject: false,
  projectPath: '',
  opacity: 100,
  scale: 100,
  theme: 'dark',
  voicePreset: {
    reverbLong: 10,
    reverbShort: 25,
    delay: 0,
    autotune: 0,
    flex: 0,
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
    modeSingVoice: 30,
    autotuneKey: 31,
    autotuneScale: 32,
    getTone: 33,
    sendTone: 34,
    detectedKey: 35,
    detectedScale: 36
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
      const appEl = document.getElementById('app');
      if (appEl) {
        if (state === 'collapsed') appEl.style.height = '95px';
        else if (state === 'expanded') appEl.style.height = '310px';
        else if (state === 'settings') appEl.style.height = '430px';
      }
    }
  };
}

export let appConfig = null;

export function setAppConfig(config) {
  appConfig = config;
}

export let savedSingingValues = {
  micVol: 100,
  reverbLong: 24,
  reverbShort: 24,
  delay: 24,
  autotune: 20,
  flex: 50,
  fxMuted: false
};

export let states = {
  beatMuted: false,
  micMuted: false,
  fxMuted: false,
  currentMode: 'sing', // 'sing' | 'voice'
  isFxPanelOpen: false,
  isKeySelectorOpen: false,
  isSettingsOpen: false,
  isAboutOpen: false,
  activePreset: 'Mặc định',
  presetToDelete: '',
  presetToOverwrite: '',
  currentKey: 0, // 0 = C (Đô)
  currentScale: 0, // 0 = Major (Trưởng)
  detectedKey: null,
  detectedScale: null,
  isWaitingForAutoKey: false
};
