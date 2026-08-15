import { app, BrowserWindow, ipcMain, dialog, shell, session, globalShortcut, desktopCapturer, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import https from 'https';
import { fileURLToPath, pathToFileURL } from 'url';
import electronUpdaterPkg from 'electron-updater';
const { autoUpdater } = electronUpdaterPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bắt lỗi Unhandled Promise Rejection để tránh sập app hoặc văng log đỏ (do electron-updater gây ra khi thiếu file release)
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection caught:', reason);
});

// Bật logger để hiển thị log cập nhật trên terminal khi chạy dev/electron
autoUpdater.logger = console;

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
  settings: { width: 960, height: 430 },
  update: { width: 960, height: 230 }
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
    { id: 0, name: 'Chào Khán Giả', filePath: '', shortcut: 'num1', color: 'blue' },
    { id: 1, name: 'Tiếng Cười', filePath: '', shortcut: 'num2', color: 'purple' },
    { id: 2, name: 'Vỗ Tay', filePath: '', shortcut: 'num3', color: 'teal' },
    { id: 3, name: 'Drum Roll', filePath: '', shortcut: 'num4', color: 'orange' },
    { id: 4, name: 'Tiếng Chuông', filePath: '', shortcut: 'num5', color: 'red' },
    { id: 5, name: 'Còi Meme', filePath: '', shortcut: 'Chưa gán', color: 'yellow' },
    { id: 6, name: 'Kinh Ngạc', filePath: '', shortcut: 'Chưa gán', color: 'blue' },
    { id: 7, name: 'Tiếng Khóc', filePath: '', shortcut: 'Chưa gán', color: 'pink' },
    { id: 8, name: 'Thất Bại', filePath: '', shortcut: 'Chưa gán', color: 'grey' },
    { id: 9, name: 'Wow!', filePath: '', shortcut: 'Chưa gán', color: 'green' },
    { id: 10, name: 'Hồi Hộp', filePath: '', shortcut: 'Chưa gán', color: 'purple' },
    { id: 11, name: 'Gõ Búa', filePath: '', shortcut: 'Chưa gán', color: 'teal' }
  ],
  soundboardAudioOutputLabel: 'Mặc định'
};

const soundsDir = path.join(app.getPath('userData'), 'sounds');
const localSoundsDir = path.join(__dirname, 'sounds');

const DEFAULT_SOUNDS = [
  'welcome.mp3',
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
    
    const userDataPath = app.getPath('userData');
    
    const defaultFiles = ['welcome.mp3', 'laughter.mp3', 'applause.mp3', 'drumroll.mp3', 'bell.mp3'];
    for (let i = 0; i < 5; i++) {
      if (config.soundboard[i] && !config.soundboard[i].filePath) {
        config.soundboard[i].filePath = `sounds/${defaultFiles[i]}`;
      }
    }

    // Auto-migrate old absolute paths in config to relative paths
    if (config.soundboard && Array.isArray(config.soundboard)) {
      config.soundboard.forEach(slot => {
        if (slot.filePath && slot.filePath.startsWith(userDataPath)) {
          let relPath = slot.filePath.substring(userDataPath.length);
          // Loại bỏ dấu slash/backslash ở đầu
          relPath = relPath.replace(/^[/\\]/, '').replace(/\\/g, '/');
          slot.filePath = relPath;
        }
      });
    }

    return config;
  } catch (error) {
    const config = { ...DEFAULT_CONFIG };
    const defaultFiles = ['welcome.mp3', 'laughter.mp3', 'applause.mp3', 'drumroll.mp3', 'bell.mp3'];
    for (let i = 0; i < 5; i++) {
      if (config.soundboard[i] && !config.soundboard[i].filePath) {
        config.soundboard[i].filePath = `sounds/${defaultFiles[i]}`;
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
          } else {
            mainWindow.minimize();
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

  // Force the window to stay on top of fullscreen apps (like YouTube, games)
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

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

    // Tự động kiểm tra bản cập nhật khi giao diện UI đã sẵn sàng
    setTimeout(() => {
      console.log('[AutoUpdater] Bắt đầu tự động kiểm tra bản cập nhật trên GitHub...');
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        console.error("[AutoUpdater] Lỗi tự động kiểm tra cập nhật:", err.message);
      });
    }, 1500);
  });

  // Mở các liên kết web bên ngoài (Facebook, GitHub,...) bằng trình duyệt mặc định của hệ thống
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
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
    
    // Nếu là đường dẫn tương đối của âm thanh mặc định (vd: sounds/laughter.mp3)
    if (filePath.startsWith('sounds/')) {
      filePath = path.join(app.getPath('userData'), filePath);
    } else if (filePath.startsWith('/') && filePath.match(/^\/[a-zA-Z]:/)) {
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

  ipcMain.on('play-pause-media', () => {
    try {
      const execPath = require('path').join(__dirname, 'PlayPause.exe');
      require('child_process').execFile(execPath, (err) => {
        if (err) console.error('Lỗi khi chạy PlayPause.exe:', err);
      });
    } catch (err) {
      console.error('Lỗi khi kích hoạt Media Play/Pause:', err);
    }
  });

  ipcMain.on('window-toggle-pin', (event, isPinned) => {
    if (mainWindow) {
      if (isPinned) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        mainWindow.setAlwaysOnTop(false);
      }
    }
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

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  let updateWindow = null;

  function createUpdateWindow(info) {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.focus();
      return;
    }

    updateWindow = new BrowserWindow({
      width: 440,
      height: 210,
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

    const updateHtmlPath = path.join(__dirname, 'update-window.html');
    updateWindow.loadFile(updateHtmlPath);

    updateWindow.webContents.on('did-finish-load', () => {
      if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send('update-available', info);
      }
    });

    updateWindow.on('closed', () => {
      updateWindow = null;
    });
  }

  // Cấu hình kiểm tra bản cập nhật (Không tự động tải mà chờ người dùng bấm Tải)
  autoUpdater.autoDownload = false;
  autoUpdater.forceDevUpdateConfig = true;

  ipcMain.on('download-update', () => {
    console.log('[AutoUpdater] Người dùng đồng ý tải bản cập nhật...');
    autoUpdater.downloadUpdate().catch(err => {
      console.error('[AutoUpdater] Lỗi bắt đầu tải cập nhật:', err.message);
    });
  });

  ipcMain.on('close-update-window', () => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.close();
      updateWindow = null;
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Tìm thấy bản cập nhật mới:', info.version);
    createUpdateWindow(info);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Không có bản cập nhật mới. Bạn đang chạy phiên bản mới nhất (hoặc trùng version với GitHub).');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-not-available', info);
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Báo lỗi:', err.message);
    const isMissingRelease = err.message && (err.message.includes('404') || err.message.includes('406') || err.message.includes('Unable to find latest version'));
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (isMissingRelease) {
        mainWindow.webContents.send('update-not-available', null);
      } else {
        mainWindow.webContents.send('update-error', err.message);
      }
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (updateWindow && !updateWindow.isDestroyed()) updateWindow.webContents.send('update-progress', progressObj);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (updateWindow && !updateWindow.isDestroyed()) updateWindow.webContents.send('update-downloaded', info);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-downloaded', info);
  });

  ipcMain.on('quit-and-install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.on('check-for-updates', async () => {
    try {
      console.log("Main process: Bắt đầu kiểm tra cập nhật thủ công...");
      const result = await autoUpdater.checkForUpdates();
      // Nếu không có result (bị cache hoặc return null), giả lập kết quả
      if (!result) {
        if (mainWindow) mainWindow.webContents.send('update-not-available');
      }
    } catch (err) {
      console.error("Lỗi kiểm tra cập nhật thủ công:", err.message);
      const isMissingRelease = err.message && (err.message.includes('404') || err.message.includes('406') || err.message.includes('Unable to find latest version'));
      
      if (mainWindow) {
        if (isMissingRelease) {
          mainWindow.webContents.send('update-not-available');
        } else {
          mainWindow.webContents.send('update-error', "Lỗi kiểm tra cập nhật: " + err.message);
        }
      }
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
