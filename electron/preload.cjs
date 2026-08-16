const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openCubaseProject: (filePath) => ipcRenderer.invoke('open-cubase-project', filePath),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  togglePin: (isPinned) => ipcRenderer.send('window-toggle-pin', isPinned),
  resizeWindow: (state, customHeight) => ipcRenderer.send('window-resize', state, customHeight),
  playPauseMedia: () => ipcRenderer.send('play-pause-media'),
  toggleApp: (targetName) => ipcRenderer.send('toggle-app', targetName),
  onShortcutPressed: (callback) => ipcRenderer.on('shortcut-pressed', (event, action) => callback(action)),
  onPinStateChanged: (callback) => ipcRenderer.on('pin-state-changed', (event, isPinned) => callback(isPinned)),
  getBrowserTitle: () => ipcRenderer.invoke('get-browser-title'),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  onPlaySoundboardSlot: (callback) => ipcRenderer.on('play-soundboard-slot', (event, slotId) => callback(slotId)),

  // Effect Edit Window
  openEffectEditWindow: (fxData) => ipcRenderer.send('open-effect-edit-window', fxData),
  closeEffectEditWindow: () => ipcRenderer.send('close-effect-edit-window'),
  saveEffectEdit: (fxData) => ipcRenderer.send('save-effect-edit', fxData),
  onSaveEffectEdit: (callback) => ipcRenderer.on('save-effect-edit-success', (event, fxData) => callback(fxData)),
  onLoadEffectEdit: (callback) => ipcRenderer.on('load-effect-edit', (event, fxData) => callback(fxData)),

  // Export
  saveXMLFile: (xmlString, defaultFileName) => ipcRenderer.invoke('save-xml-file', xmlString, defaultFileName),

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


