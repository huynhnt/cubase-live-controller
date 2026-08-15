import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openCubaseProject: (filePath) => ipcRenderer.invoke('open-cubase-project', filePath),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  resizeWindow: (state) => ipcRenderer.send('window-resize', state),
  playPauseMedia: () => ipcRenderer.send('play-pause-media'),
  onShortcutPressed: (callback) => ipcRenderer.on('shortcut-pressed', (event, action) => callback(action)),
  getBrowserTitle: () => ipcRenderer.invoke('get-browser-title'),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  onPlaySoundboardSlot: (callback) => ipcRenderer.on('play-soundboard-slot', (event, slotId) => callback(slotId)),
  
  // Auto Updater
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (event, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (event, errMessage) => callback(errMessage)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, progressObj) => callback(progressObj)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
  quitAndInstallUpdate: () => ipcRenderer.send('quit-and-install-update'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  closeUpdateWindow: () => ipcRenderer.send('close-update-window'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
