export const DOM = {
  app: document.getElementById('app'),
  
  // Nút điều khiển cửa sổ
  btnMinimize: document.getElementById('btn-minimize'),
  btnClose: document.getElementById('btn-close'),
  btnSettingsToggle: document.getElementById('btn-settings-toggle'),
  btnAboutToggle: document.getElementById('btn-about-toggle'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  
  // Nút chức năng chính
  btnBeatMute: document.getElementById('btn-beat-mute'),
  btnMicMute: document.getElementById('btn-mic-mute'),
  btnFxMute: document.getElementById('btn-fx-mute'),
  btnModeToggle: document.getElementById('btn-mode-toggle'),
  btnReverbToggle: document.getElementById('btn-reverb-toggle'),
  btnToneToggle: document.getElementById('btn-tone-toggle'),
  
  // Thanh trượt chính
  sliderBeatVol: document.getElementById('slider-beat-vol'),
  sliderMicVol: document.getElementById('slider-mic-vol'),
  valBeatVol: document.getElementById('val-beat-vol'),
  valMicVol: document.getElementById('val-mic-vol'),
  fillBeatVol: document.getElementById('fill-beat-vol'),
  fillMicVol: document.getElementById('fill-mic-vol'),
  
  // Panel chỉnh vang & sliders
  fxPanel: document.getElementById('fx-panel'),
  keySelectorContainer: document.getElementById('key-selector-container'),
  currentKeyDisplay: document.getElementById('current-key-display'),
  detectedKeyDisplay: document.getElementById('detected-key-display'),
  btnGetTone: document.getElementById('btn-get-tone'),
  btnSendTone: document.getElementById('btn-send-tone'),
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
  aboutPanel: document.getElementById('about-panel'),
  btnCloseAbout: document.getElementById('btn-close-about'),
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
  mapAutotuneKey: document.getElementById('map-autotune-key'),
  mapAutotuneScale: document.getElementById('map-autotune-scale'),
  mapGetTone: document.getElementById('map-get-tone'),
  mapSendTone: document.getElementById('map-send-tone'),
  mapDetectedKey: document.getElementById('map-detected-key'),
  mapDetectedScale: document.getElementById('map-detected-scale'),
  
  // General inputs
  inputProjectPath: document.getElementById('input-project-path'),
  btnSelectProject: document.getElementById('btn-select-project'),
  chkAutoOpen: document.getElementById('chk-auto-open'),
  sliderOpacity: document.getElementById('slider-opacity'),
  valOpacity: document.getElementById('val-opacity'),
  
  // Shortcut inputs
  shortcutToggleMusic: document.getElementById('shortcut-toggle-music'),
  shortcutToggleMic: document.getElementById('shortcut-toggle-mic'),
  shortcutToggleFx: document.getElementById('shortcut-toggle-fx'),
  shortcutToggleWindow: document.getElementById('shortcut-toggle-window'),
  
  // Voice Presets inputs
  presetReverbLong: document.getElementById('preset-reverb-long'),
  presetReverbShort: document.getElementById('preset-reverb-short'),
  presetDelay: document.getElementById('preset-delay'),
  presetAutotune: document.getElementById('preset-autotune'),
  presetFlex: document.getElementById('preset-flex'),
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
  
  overwriteModal: document.getElementById('overwrite-modal'),
  overwriteModalText: document.getElementById('overwrite-modal-text'),
  btnOverwriteYes: document.getElementById('btn-overwrite-yes'),
  btnOverwriteNo: document.getElementById('btn-overwrite-no'),
  
  btnSaveSettings: document.getElementById('btn-save-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  
  // Status Bar
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text')
};
