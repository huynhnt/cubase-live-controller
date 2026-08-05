const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openCubaseProject: (filePath) => ipcRenderer.invoke('open-cubase-project', filePath),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  resizeWindow: (state) => ipcRenderer.send('window-resize', state),
  onShortcutPressed: (callback) => ipcRenderer.on('shortcut-pressed', (event, action) => callback(action)),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  onPlaySoundboardSlot: (callback) => ipcRenderer.on('play-soundboard-slot', (event, slotId) => callback(slotId))
});
