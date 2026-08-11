import { app, BrowserWindow, ipcMain, dialog, shell, session, globalShortcut, desktopCapturer } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const loaded = JSON.parse(data);
    // Tự động trộn cấu hình cũ với các cấu hình mới thêm (như presets và shortcuts) để tránh mất file hoặc thiếu trường
    return {
      ...DEFAULT_CONFIG,
      ...loaded,
      midiMappings: { ...DEFAULT_CONFIG.midiMappings, ...loaded.midiMappings },
      audioAnalyzer: { ...DEFAULT_CONFIG.audioAnalyzer, ...loaded.audioAnalyzer },
      voicePreset: { ...DEFAULT_CONFIG.voicePreset, ...loaded.voicePreset },
      presets: loaded.presets ? loaded.presets : DEFAULT_CONFIG.presets,
      shortcuts: { ...DEFAULT_CONFIG.shortcuts, ...loaded.shortcuts }
    };
  } catch (error) {
    return DEFAULT_CONFIG;
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
    if (['midi', 'midiSysex', 'media', 'display-capture'].includes(permission)) return true;
    return false;
  });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (['midi', 'midiSysex', 'media', 'display-capture'].includes(permission)) callback(true);
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
      const sources = await desktopCapturer.getSources({ types: ['window'] });
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
