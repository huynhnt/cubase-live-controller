export const DOM = {
  get app() { return document.getElementById('app'); },
  
  // Nút điều khiển cửa sổ
  get btnMinimize() { return document.getElementById('btn-minimize'); },
  get btnClose() { return document.getElementById('btn-close'); },
  get btnSettingsToggle() { return document.getElementById('btn-settings-toggle'); },
  get btnAboutToggle() { return document.getElementById('btn-about-toggle'); },
  get btnPinToggle() { return document.getElementById('btn-pin-toggle'); },
  get btnThemeToggle() { return document.getElementById('btn-theme-toggle'); },
  
  // Nút chức năng chính
  get btnBeatMute() { return document.getElementById('btn-beat-mute'); },
  get btnMicMute() { return document.getElementById('btn-mic-mute'); },
  get btnFxMute() { return document.getElementById('btn-fx-mute'); },
  get btnModeToggle() { return document.getElementById('btn-mode-toggle'); },
  get btnReverbToggle() { return document.getElementById('btn-reverb-toggle'); },
  get btnToneToggle() { return document.getElementById('btn-tone-toggle'); },
  
  // Thanh trượt chính
  get sliderBeatVol() { return document.getElementById('slider-beat-vol'); },
  get sliderMicVol() { return document.getElementById('slider-mic-vol'); },
  get valBeatVol() { return document.getElementById('val-beat-vol'); },
  get valMicVol() { return document.getElementById('val-mic-vol'); },
  get fillBeatVol() { return document.getElementById('fill-beat-vol'); },
  get fillMicVol() { return document.getElementById('fill-mic-vol'); },
  
  // Panel chỉnh vang & sliders
  get fxPanel() { return document.getElementById('fx-panel'); },
  get keySelectorPanel() { return document.getElementById('key-selector-panel'); },
  get keySelectorContainer() { return document.getElementById('key-selector-container'); },
  get currentKeyDisplay() { return document.getElementById('current-key-display'); },
  get detectedKeyDisplay() { return document.getElementById('detected-key-display'); },
  get btnGetTone() { return document.getElementById('btn-get-tone'); },
  get sliders() {
    return {
      reverbLong: document.getElementById('slider-reverb-long'),
      reverbShort: document.getElementById('slider-reverb-short'),
      delay: document.getElementById('slider-delay'),
      autotune: document.getElementById('slider-autotune'),
      flex: document.getElementById('slider-flex')
    };
  },
  get vals() {
    return {
      reverbLong: document.getElementById('val-reverb-long'),
      reverbShort: document.getElementById('val-reverb-short'),
      delay: document.getElementById('val-delay'),
      autotune: document.getElementById('val-autotune'),
      flex: document.getElementById('val-flex')
    };
  },
  get fills() {
    return {
      reverbLong: document.querySelector('.fill-orange'),
      reverbShort: document.querySelector('.fill-yellow'),
      delay: document.querySelector('.fill-purple'),
      autotune: document.querySelector('.fill-red'),
      flex: document.querySelector('.fill-blue')
    };
  },
  
  // Panel cài đặt & inputs
  get settingsPanel() { return document.getElementById('settings-panel'); },
  get aboutPanel() { return document.getElementById('about-panel'); },
  get btnCloseAbout() { return document.getElementById('btn-close-about'); },
  get tabButtons() { return document.querySelectorAll('.tab-btn'); },
  get tabContents() { return document.querySelectorAll('.tab-content'); },
  get selectMidiOut() { return document.getElementById('select-midi-out'); },
  get selectMidiIn() { return document.getElementById('select-midi-in'); },
  get inputMidiChannel() { return document.getElementById('input-midi-channel'); },
  get selectAutotuneVersion() { return document.getElementById('select-autotune-version'); },
  
  // Mapping inputs
  get mapBeatVol() { return document.getElementById('map-beat-vol'); },
  get mapBeatMute() { return document.getElementById('map-beat-mute'); },
  get mapMicVol() { return document.getElementById('map-mic-vol'); },
  get mapMicMute() { return document.getElementById('map-mic-mute'); },
  get mapFxMute() { return document.getElementById('map-fx-mute'); },
  get mapReverbLong() { return document.getElementById('map-reverb-long'); },
  get mapReverbShort() { return document.getElementById('map-reverb-short'); },
  get mapDelay() { return document.getElementById('map-delay'); },
  get mapAutotune() { return document.getElementById('map-autotune'); },
  get mapFlex() { return document.getElementById('map-flex'); },
  get mapModeSingVoice() { return document.getElementById('map-mode-sing-voice'); },
  get mapAutotuneKey() { return document.getElementById('map-autotune-key'); },
  get mapAutotuneScale() { return document.getElementById('map-autotune-scale'); },
  
  get inputCustomKeys() { return document.getElementById('input-custom-keys'); },
  get inputCustomScales() { return document.getElementById('input-custom-scales'); },
  get scannerKey() { return document.getElementById('scanner-key'); },
  get scannerScale() { return document.getElementById('scanner-scale'); },
  get valScannerKey() { return document.getElementById('val-scanner-key'); },
  get valScannerScale() { return document.getElementById('val-scanner-scale'); },

  // General inputs
  get inputProjectPath() { return document.getElementById('input-project-path'); },
  get btnSelectProject() { return document.getElementById('btn-select-project'); },
  get chkAutoOpen() { return document.getElementById('chk-auto-open'); },
  get sliderOpacity() { return document.getElementById('slider-opacity'); },
  get valOpacity() { return document.getElementById('val-opacity'); },
  get inputAudioDuration() { return document.getElementById('input-audio-duration'); },
  get inputAudioMinFreq() { return document.getElementById('input-audio-minfreq'); },
  
  // Shortcut inputs
  get shortcutToggleMusic() { return document.getElementById('shortcut-toggle-music'); },
  get shortcutToggleMic() { return document.getElementById('shortcut-toggle-mic'); },
  get shortcutToggleFx() { return document.getElementById('shortcut-toggle-fx'); },
  get shortcutToggleWindow() { return document.getElementById('shortcut-toggle-window'); },
  get shortcutSetSingMode() { return document.getElementById('shortcut-set-sing'); },
  get shortcutSetVoiceMode() { return document.getElementById('shortcut-set-voice'); },
  
  // Voice Presets inputs
  get presetReverbLong() { return document.getElementById('preset-reverb-long'); },
  get presetReverbShort() { return document.getElementById('preset-reverb-short'); },
  get presetDelay() { return document.getElementById('preset-delay'); },
  get presetAutotune() { return document.getElementById('preset-autotune'); },
  get presetFlex() { return document.getElementById('preset-flex'); },
  get presetMicChange() { return document.getElementById('preset-mic-change'); },
  get presetBeatChange() { return document.getElementById('preset-beat-change'); },
  
  // Cấu hình Preset
  get presetsSystemList() { return document.getElementById('presets-system-list'); },
  get presetsCustomList() { return document.getElementById('presets-custom-list'); },
  get btnAddPreset() { return document.getElementById('btn-add-preset'); },
  get presetModal() { return document.getElementById('preset-modal'); },
  get inputPresetName() { return document.getElementById('input-preset-name'); },
  get btnModalSave() { return document.getElementById('btn-modal-save'); },
  get btnModalCancel() { return document.getElementById('btn-modal-cancel'); },
  get confirmModal() { return document.getElementById('confirm-modal'); },
  get confirmModalText() { return document.getElementById('confirm-modal-text'); },
  get btnConfirmYes() { return document.getElementById('btn-confirm-yes'); },
  get btnConfirmNo() { return document.getElementById('btn-confirm-no'); },
  
  get overwriteModal() { return document.getElementById('overwrite-modal'); },
  get overwriteModalText() { return document.getElementById('overwrite-modal-text'); },
  get btnOverwriteYes() { return document.getElementById('btn-overwrite-yes'); },
  get btnOverwriteNo() { return document.getElementById('btn-overwrite-no'); },
  
  get btnSaveSettings() { return document.getElementById('btn-save-settings'); },
  get btnCloseSettings() { return document.getElementById('btn-close-settings'); },
  
  // Status Bar
  get statusIndicator() { return document.getElementById('status-indicator'); },
  get statusText() { return document.getElementById('status-text'); },

  // Soundboard
  get btnSoundboardToggle() { return document.getElementById('btn-soundboard-toggle'); },
  get soundboardPanel() { return document.getElementById('soundboard-panel'); },
  get selectAudioOutput() { return document.getElementById('select-audio-output'); },
  get btnSoundboardEditMode() { return document.getElementById('btn-soundboard-edit-mode'); },
  get soundboardGrid() { return document.getElementById('soundboard-grid'); },
  get soundboardEditModal() { return document.getElementById('soundboard-edit-modal'); },
  get inputSbName() { return document.getElementById('input-sb-name'); },
  get inputSbFile() { return document.getElementById('input-sb-file'); },
  get btnSbSelectFile() { return document.getElementById('btn-sb-select-file'); },
  get inputSbShortcut() { return document.getElementById('input-sb-shortcut'); },
  get btnSbClearShortcut() { return document.getElementById('btn-sb-clear-shortcut'); },
  get selectSbColor() { return document.getElementById('select-sb-color'); },
  get btnSbModalSave() { return document.getElementById('btn-sb-modal-save'); },
  get btnSbModalCancel() { return document.getElementById('btn-sb-modal-cancel'); }
};
