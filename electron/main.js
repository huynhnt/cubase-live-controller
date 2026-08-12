import { app, BrowserWindow, ipcMain, dialog, shell, session, globalShortcut, desktopCapturer, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import https from 'https';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đăng ký giao thức local-media trước khi app ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-media', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true, stream: true } }
]);

let mainWindow = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Cấu hình kích thước mặc định cho các trạng thái cửa sổ
const WINDOW_SIZES = {
  collapsed: { width: 960, height: 95 },
  expanded: { width: 960, height: 310 },
  expanded_tone_only: { width: 960, height: 165 },
  settings: { width: 960, height: 430 }
};

const DEFAULT_CONFIG = {
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
  opacity: 100,
  theme: 'dark',
  voicePreset: {
    reverbLong: 10,
    reverbShort: 25,
    delay: 0,
    autotune: 0,
    flex: 0,
    micChange: 10,
    beatChange: -20
  },
  audioAnalyzer: {
    duration: 8,
    minFreq: 27.5
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
    autotuneScale: 32
  },
  presets: {
    "Mặc định": { reverbLong: 24, reverbShort: 24, delay: 24, autotune: 20, flex: 50 },
    "Bolero": { reverbLong: 45, reverbShort: 30, delay: 40, autotune: 15, flex: 60 },
    "Remix": { reverbLong: 15, reverbShort: 10, delay: 15, autotune: 40, flex: 20 },
    "Lofi": { reverbLong: 35, reverbShort: 25, delay: 35, autotune: 5, flex: 80 }
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

const soundsDir = path.join(app.getPath('userData'), 'sounds');
const localSoundsDir = path.join(__dirname, 'sounds');

const DEFAULT_SOUNDS = [
  'laughter.mp3',
  'applause.mp3',
  'drumroll.mp3',
  'bell.mp3'
];

async function ensureDefaultSounds() {
  try {
    await fs.mkdir(soundsDir, { recursive: true });
    for (const name of DEFAULT_SOUNDS) {
      const dest = path.join(soundsDir, name);
      try {
        await fs.access(dest); // File đã tồn tại ở userdata thì bỏ qua
      } catch (err) {
        // File chưa có, thử copy từ resource đóng gói (electron/sounds)
        const src = path.join(localSoundsDir, name);
        try {
          await fs.access(src); // Kiểm tra xem dev có để file trong source code không
          await fs.copyFile(src, dest);
          console.log(`Đã copy âm thanh mặc định: ${name}`);
        } catch (srcErr) {
          console.warn(`Không tìm thấy file nguồn ${src}. Bạn hãy tải file MP3 và ném vào thư mục electron/sounds nhé.`);
        }
      }
    }
  } catch (err) {
    console.error('Lỗi khởi tạo âm thanh mặc định:', err);
  }
}

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const loaded = JSON.parse(data);
    
    const config = {
      ...DEFAULT_CONFIG,
      ...loaded,
      midiMappings: { ...DEFAULT_CONFIG.midiMappings, ...loaded.midiMappings },
      audioAnalyzer: { ...DEFAULT_CONFIG.audioAnalyzer, ...loaded.audioAnalyzer },
      voicePreset: { ...DEFAULT_CONFIG.voicePreset, ...loaded.voicePreset },
      presets: loaded.presets ? loaded.presets : DEFAULT_CONFIG.presets,
      shortcuts: { ...DEFAULT_CONFIG.shortcuts, ...loaded.shortcuts },
      soundboard: loaded.soundboard ? loaded.soundboard : DEFAULT_CONFIG.soundboard,
      soundboardAudioOutputLabel: loaded.soundboardAudioOutputLabel || DEFAULT_CONFIG.soundboardAudioOutputLabel
    };
    
    const defaultFiles = ['laughter.mp3', 'applause.mp3', 'drumroll.mp3', 'bell.mp3'];
    for (let i = 0; i < 4; i++) {
      if (config.soundboard[i] && !config.soundboard[i].filePath) {
        config.soundboard[i].filePath = path.join(soundsDir, defaultFiles[i]);
      }
    }
    return config;
  } catch (error) {
    const config = { ...DEFAULT_CONFIG };
    const defaultFiles = ['laughter.mp3', 'applause.mp3', 'drumroll.mp3', 'bell.mp3'];
    for (let i = 0; i < 4; i++) {
      if (config.soundboard[i] && !config.soundboard[i].filePath) {
        config.soundboard[i].filePath = path.join(soundsDir, defaultFiles[i]);
      }
    }
    return config;
  }
}

function registerGlobalShortcuts(config) {
  globalShortcut.unregisterAll();
  
  if (!config || !config.shortcuts) return;
  
  const { toggleMusic, toggleMic, toggleFx, toggleWindow, setSingMode, setVoiceMode } = config.shortcuts;
  
  if (toggleMusic && toggleMusic !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(toggleMusic, () => {
        if (mainWindow && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('shortcut-pressed', 'toggleMusic');
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Nhạc: ${toggleMusic}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Nhạc (${toggleMusic}):`, err);
    }
  }
  
  if (toggleMic && toggleMic !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(toggleMic, () => {
        if (mainWindow && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('shortcut-pressed', 'toggleMic');
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Mic: ${toggleMic}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Mic (${toggleMic}):`, err);
    }
  }
  
  if (toggleFx && toggleFx !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(toggleFx, () => {
        if (mainWindow && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('shortcut-pressed', 'toggleFx');
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Vang: ${toggleFx}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Vang (${toggleFx}):`, err);
    }
  }
  
  if (toggleWindow && toggleWindow !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(toggleWindow, () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
            mainWindow.focus();
            mainWindow.setAlwaysOnTop(true);
          } else if (mainWindow.isFocused()) {
            mainWindow.minimize();
          } else {
            mainWindow.focus();
            mainWindow.setAlwaysOnTop(true);
          }
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Cửa sổ: ${toggleWindow}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Cửa sổ (${toggleWindow}):`, err);
    }
  }
  
  if (setSingMode && setSingMode !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(setSingMode, () => {
        if (mainWindow && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('shortcut-pressed', 'setSingMode');
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Hát Live: ${setSingMode}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Hát Live (${setSingMode}):`, err);
    }
  }

  if (setVoiceMode && setVoiceMode !== 'Chưa gán') {
    try {
      const ok = globalShortcut.register(setVoiceMode, () => {
        if (mainWindow && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('shortcut-pressed', 'setVoiceMode');
        }
      });
      if (!ok) console.warn(`Không thể đăng ký phím tắt cho Voice: ${setVoiceMode}`);
    } catch (err) {
      console.error(`Lỗi đăng ký phím tắt Voice (${setVoiceMode}):`, err);
    }
  }

  // Đăng ký phím tắt cho các ô Soundboard
  if (config && config.soundboard && Array.isArray(config.soundboard)) {
    config.soundboard.forEach(slot => {
      if (slot.shortcut && slot.shortcut !== 'Chưa gán') {
        try {
          const ok = globalShortcut.register(slot.shortcut, () => {
            if (mainWindow && !mainWindow.webContents.isDestroyed()) {
              mainWindow.webContents.send('play-soundboard-slot', slot.id);
            }
          });
          if (!ok) console.warn(`Không thể đăng ký phím tắt cho Soundboard slot ${slot.id}: ${slot.shortcut}`);
        } catch (err) {
          console.error(`Lỗi đăng ký phím tắt Soundboard slot ${slot.id} (${slot.shortcut}):`, err);
        }
      }
    });
  }
}

async function saveConfig(config) {
  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Lỗi khi lưu config:', error);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_SIZES.collapsed.width,
    height: WINDOW_SIZES.collapsed.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Cho phép phân quyền truy cập Web MIDI, Media và Screen Capture trong Electron
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (['midi', 'midiSysex', 'media', 'display-capture', 'audioCapture'].includes(permission)) return true;
    return false;
  });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (['midi', 'midiSysex', 'media', 'display-capture', 'audioCapture'].includes(permission)) callback(true);
    else callback(false);
  });

  // Tự động cấp quyền và chọn màn hình đầu tiên kèm âm thanh hệ thống (loopback)
  // Tính năng này giúp getDisplayMedia hoạt động mà KHÔNG CẦN hiện popup phức tạp cho người dùng
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources && sources.length > 0) {
        callback({ video: sources[0], audio: 'loopback' });
      } else {
        callback(null);
      }
    }).catch(err => {
      console.error('Lỗi lấy source màn hình:', err);
      callback(null);
    });
  });

  const isDev = process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Tự động mở dự án Cubase và đăng ký phím tắt toàn cục nếu được cấu hình
  mainWindow.webContents.on('did-finish-load', async () => {
    const config = await loadConfig();
    registerGlobalShortcuts(config);
    if (config.autoOpenProject && config.projectPath) {
      try {
        await shell.openPath(config.projectPath);
      } catch (err) {
        console.error('Không thể mở Cubase Project tự động:', err);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Xử lý các sự kiện IPC từ Renderer
app.whenReady().then(() => {
  // Đăng ký handle giao thức local-media
  protocol.handle('local-media', (request) => {
    const urlStr = request.url;
    let filePath = decodeURIComponent(urlStr.replace('local-media://', ''));
    if (filePath.startsWith('/') && filePath.match(/^\/[a-zA-Z]:/)) {
      filePath = filePath.substring(1);
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  // Đảm bảo có âm thanh mẫu tải về
  ensureDefaultSounds().catch(err => console.error('Lỗi đảm bảo âm thanh mẫu:', err));

  ipcMain.handle('select-audio-file', async () => {
    if (!mainWindow) return '';
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn file âm thanh',
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return '';
    }
    return result.filePaths[0];
  });

  // Lắng nghe resize cửa sổ từ renderer
  ipcMain.on('window-resize', (event, state) => {
    if (!mainWindow) return;
    const size = WINDOW_SIZES[state] || WINDOW_SIZES.collapsed;
    mainWindow.setResizable(true);
    mainWindow.setSize(size.width, size.height);
    mainWindow.setResizable(false);
  });

  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-close', () => {
    app.quit();
  });

  ipcMain.handle('load-config', async () => {
    return await loadConfig();
  });

  ipcMain.handle('save-config', async (event, config) => {
    const success = await saveConfig(config);
    if (success) {
      registerGlobalShortcuts(config);
    }
    return success;
  });

  ipcMain.handle('select-file', async () => {
    if (!mainWindow) return '';
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Chọn file Cubase Project',
      filters: [
        { name: 'Cubase Project', extensions: ['cpr'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return '';
    }
    return result.filePaths[0];
  });

  ipcMain.handle('open-cubase-project', async (event, filePath) => {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Lấy tiêu đề các cửa sổ trình duyệt đang mở (phục vụ Tier 1 detect tone)
  ipcMain.handle('get-browser-title', async () => {
    try {
      const sources = await desktopCapturer.getSources({ 
        types: ['window'],
        fetchWindowIcons: false,
        thumbnailSize: { width: 0, height: 0 }
      });
      // Tìm cửa sổ Chrome/Edge/Firefox có "YouTube" trong tiêu đề
      const ytWindow = sources.find(s =>
        /youtube/i.test(s.name) &&
        /chrome|edge|firefox|brave|opera/i.test(s.name)
      ) || sources.find(s => /youtube/i.test(s.name));
      return ytWindow ? ytWindow.name : null;
    } catch (err) {
      console.error('Lỗi get-browser-title:', err);
      return null;
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
