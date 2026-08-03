import { app, BrowserWindow, ipcMain, dialog, shell, session } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const configPath = path.join(app.getPath('userData'), 'config.json');

// Cấu hình kích thước mặc định cho các trạng thái cửa sổ
const WINDOW_SIZES = {
  collapsed: { width: 920, height: 90 },
  expanded: { width: 920, height: 260 },
  settings: { width: 920, height: 380 }
};

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
    autoTune: 10,
    flex: 20,
    micVolChange: 10
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
    autoTune: 28,
    flex: 29,
    modeSingVoice: 30
  }
};

async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return DEFAULT_CONFIG;
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

  // Cho phép phân quyền truy cập Web MIDI trong Electron
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'midi' || permission === 'midiSysex') return true;
    return false;
  });
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'midi' || permission === 'midiSysex') callback(true);
    else callback(false);
  });

  const isDev = process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Tự động mở dự án Cubase nếu được cấu hình
  mainWindow.webContents.on('did-finish-load', async () => {
    const config = await loadConfig();
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
    return await saveConfig(config);
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
