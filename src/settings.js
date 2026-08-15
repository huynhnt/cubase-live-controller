import { DOM } from './dom.js';
import { states, appConfig, setAppConfig } from './state.js';
import { midi } from './midi.js';
import { closeSettingsPanelUI } from './ui.js';
import { connectMidi } from './main.js';

export function loadConfigToForm() {
  if (DOM.selectMidiOut) DOM.selectMidiOut.value = appConfig.midiOutPort || '';
  if (DOM.selectMidiIn) DOM.selectMidiIn.value = appConfig.midiInPort || '';
  if (DOM.inputMidiChannel) DOM.inputMidiChannel.value = appConfig.midiChannel || 1;
  
  if (DOM.mapBeatVol) DOM.mapBeatVol.value = appConfig.midiMappings?.beatVol ?? 20;
  if (DOM.mapBeatMute) DOM.mapBeatMute.value = appConfig.midiMappings?.beatMute ?? 21;
  if (DOM.mapMicVol) DOM.mapMicVol.value = appConfig.midiMappings?.micVol ?? 22;
  if (DOM.mapMicMute) DOM.mapMicMute.value = appConfig.midiMappings?.micMute ?? 23;
  if (DOM.mapFxMute) DOM.mapFxMute.value = appConfig.midiMappings?.fxMute ?? 24;
  if (DOM.mapReverbLong) DOM.mapReverbLong.value = appConfig.midiMappings?.reverbLong ?? 25;
  if (DOM.mapReverbShort) DOM.mapReverbShort.value = appConfig.midiMappings?.reverbShort ?? 26;
  if (DOM.mapDelay) DOM.mapDelay.value = appConfig.midiMappings?.delay ?? 27;
  if (DOM.mapAutotune) DOM.mapAutotune.value = appConfig.midiMappings?.autotune ?? 28;
  if (DOM.mapFlex) DOM.mapFlex.value = appConfig.midiMappings?.flex ?? 29;
  if (DOM.mapModeSingVoice) DOM.mapModeSingVoice.value = appConfig.midiMappings?.modeSingVoice ?? 30;
  if (DOM.mapAutotuneKey) DOM.mapAutotuneKey.value = appConfig.midiMappings?.autotuneKey ?? 31;
  if (DOM.mapAutotuneScale) DOM.mapAutotuneScale.value = appConfig.midiMappings?.autotuneScale ?? 32;

  if (DOM.selectAutotuneVersion) DOM.selectAutotuneVersion.value = appConfig.autotuneVersion || 'efx';
  if (DOM.inputCustomKeys) {
    DOM.inputCustomKeys.value = (appConfig.customAutotuneKeys || [0, 12, 24, 35, 47, 58, 70, 82, 93, 104, 125, 127]).join(', ');
  }
  if (DOM.inputCustomScales) {
    DOM.inputCustomScales.value = (appConfig.customAutotuneScales || [0, 5]).join(', ');
  }
  
  if (DOM.inputProjectPath) DOM.inputProjectPath.value = appConfig.projectPath || '';
  if (DOM.chkAutoOpen) DOM.chkAutoOpen.checked = !!appConfig.autoOpenProject;
  if (DOM.sliderOpacity) DOM.sliderOpacity.value = appConfig.opacity ?? 85;
  if (DOM.valOpacity) DOM.valOpacity.innerText = (appConfig.opacity ?? 85) + '%';
  if (DOM.inputCustomAppTarget) DOM.inputCustomAppTarget.value = appConfig.customAppTarget || 'YouTube';
  
  if (DOM.presetReverbLong) DOM.presetReverbLong.value = appConfig.voicePreset?.reverbLong ?? 0;
  if (DOM.presetReverbShort) DOM.presetReverbShort.value = appConfig.voicePreset?.reverbShort ?? 0;
  if (DOM.presetDelay) DOM.presetDelay.value = appConfig.voicePreset?.delay ?? 0;
  if (DOM.presetAutotune) DOM.presetAutotune.value = appConfig.voicePreset?.autotune ?? 0;
  if (DOM.presetFlex) DOM.presetFlex.value = appConfig.voicePreset?.flex ?? 0;
  if (DOM.presetMicChange) DOM.presetMicChange.value = appConfig.voicePreset?.micChange ?? appConfig.voicePreset?.micVolChange ?? 10;
  if (DOM.presetBeatChange) DOM.presetBeatChange.value = appConfig.voicePreset?.beatChange ?? -20;
  
  if (DOM.shortcutToggleMusic) DOM.shortcutToggleMusic.value = appConfig.shortcuts?.toggleMusic || 'Chưa gán';
  if (DOM.shortcutToggleMic) DOM.shortcutToggleMic.value = appConfig.shortcuts?.toggleMic || 'Chưa gán';
  if (DOM.shortcutToggleFx) DOM.shortcutToggleFx.value = appConfig.shortcuts?.toggleFx || 'Chưa gán';
  if (DOM.shortcutToggleWindow) DOM.shortcutToggleWindow.value = appConfig.shortcuts?.toggleWindow || 'Chưa gán';
  if (DOM.shortcutSetSingMode) DOM.shortcutSetSingMode.value = appConfig.shortcuts?.setSingMode || 'Chưa gán';
  if (DOM.shortcutSetVoiceMode) DOM.shortcutSetVoiceMode.value = appConfig.shortcuts?.setVoiceMode || 'Chưa gán';
  if (DOM.shortcutPlayMedia) DOM.shortcutPlayMedia.value = appConfig.shortcuts?.playMedia || 'Chưa gán';

  if (appConfig.audioAnalyzer) {
    if (DOM.inputAudioDuration) DOM.inputAudioDuration.value = appConfig.audioAnalyzer.duration || 8;
    if (DOM.inputAudioMinFreq) DOM.inputAudioMinFreq.value = appConfig.audioAnalyzer.minFreq || 27.5;
  }
}

export async function saveSettings() {
  let newMidiOutPort = appConfig.midiOutPort || '';
  if (DOM.selectMidiOut) {
    if (DOM.selectMidiOut.options.length > 1 || DOM.selectMidiOut.value !== '') {
      newMidiOutPort = DOM.selectMidiOut.value;
    }
  }

  let newMidiInPort = appConfig.midiInPort || '';
  if (DOM.selectMidiIn) {
    if (DOM.selectMidiIn.options.length > 1 || DOM.selectMidiIn.value !== '') {
      newMidiInPort = DOM.selectMidiIn.value;
    }
  }

  const newConfig = {
    ...appConfig,
    midiOutPort: newMidiOutPort,
    midiInPort: newMidiInPort,
    midiChannel: parseInt(DOM.inputMidiChannel?.value) || (appConfig.midiChannel ?? 1),
    autotuneVersion: DOM.selectAutotuneVersion?.value || 'efx',
    customAutotuneKeys: (DOM.inputCustomKeys?.value || '').split(',').map(v => parseInt(v.trim()) || 0),
    customAutotuneScales: (DOM.inputCustomScales?.value || '').split(',').map(v => parseInt(v.trim()) || 0),
    autoOpenProject: DOM.chkAutoOpen ? DOM.chkAutoOpen.checked : (appConfig.autoOpenProject ?? false),
    projectPath: DOM.inputProjectPath?.value ?? (appConfig.projectPath ?? ''),
    opacity: parseInt(DOM.sliderOpacity?.value) || (appConfig.opacity ?? 85),
    customAppTarget: DOM.inputCustomAppTarget?.value || 'YouTube',
    voicePreset: {
      reverbLong: parseInt(DOM.presetReverbLong?.value) || 0,
      reverbShort: parseInt(DOM.presetReverbShort?.value) || 0,
      delay: parseInt(DOM.presetDelay?.value) || 0,
      autotune: parseInt(DOM.presetAutotune?.value) || 0,
      flex: parseInt(DOM.presetFlex?.value) || 0,
      micChange: parseInt(DOM.presetMicChange?.value) || 10,
      beatChange: parseInt(DOM.presetBeatChange?.value) || -20
    },
    midiMappings: {
      beatVol: parseInt(DOM.mapBeatVol?.value) || 20,
      beatMute: parseInt(DOM.mapBeatMute?.value) || 21,
      micVol: parseInt(DOM.mapMicVol?.value) || 22,
      micMute: parseInt(DOM.mapMicMute?.value) || 23,
      fxMute: parseInt(DOM.mapFxMute?.value) || 24,
      reverbLong: parseInt(DOM.mapReverbLong?.value) || 25,
      reverbShort: parseInt(DOM.mapReverbShort?.value) || 26,
      delay: parseInt(DOM.mapDelay?.value) || 27,
      autotune: parseInt(DOM.mapAutotune?.value) || 28,
      flex: parseInt(DOM.mapFlex?.value) || 29,
      modeSingVoice: parseInt(DOM.mapModeSingVoice?.value) || 30,
      autotuneKey: parseInt(DOM.mapAutotuneKey?.value) || 31,
      autotuneScale: parseInt(DOM.mapAutotuneScale?.value) || 32
    },
    shortcuts: {
      toggleMusic: DOM.shortcutToggleMusic?.value === 'Chưa gán' ? '' : (DOM.shortcutToggleMusic?.value ?? ''),
      toggleMic: DOM.shortcutToggleMic?.value === 'Chưa gán' ? '' : (DOM.shortcutToggleMic?.value ?? ''),
      toggleFx: DOM.shortcutToggleFx?.value === 'Chưa gán' ? '' : (DOM.shortcutToggleFx?.value ?? ''),
      toggleWindow: DOM.shortcutToggleWindow?.value === 'Chưa gán' ? '' : (DOM.shortcutToggleWindow?.value ?? ''),
      setSingMode: DOM.shortcutSetSingMode?.value === 'Chưa gán' ? '' : (DOM.shortcutSetSingMode?.value ?? ''),
      setVoiceMode: DOM.shortcutSetVoiceMode?.value === 'Chưa gán' ? '' : (DOM.shortcutSetVoiceMode?.value ?? ''),
      playMedia: DOM.shortcutPlayMedia?.value === 'Chưa gán' ? '' : (DOM.shortcutPlayMedia?.value ?? '')
    },
    audioAnalyzer: {
      duration: parseInt(DOM.inputAudioDuration?.value) || 8,
      minFreq: parseFloat(DOM.inputAudioMinFreq?.value) || 27.5
    }
  };
  
  const success = await window.electronAPI.saveConfig(newConfig);
  if (success) {
    setAppConfig(newConfig);
    midi.setChannel(newConfig.midiChannel);
    connectMidi();
    if (typeof populateMidiPorts === 'function') {
      populateMidiPorts();
    }
    DOM.app.style.setProperty('--bg-opacity', newConfig.opacity / 100);
    
    closeSettingsPanelUI();
    
    if (states.isFxPanelOpen) {
      DOM.fxPanel.classList.remove('hidden');
      DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
      DOM.btnReverbToggle.classList.add('active');
      
      const fxContainer = DOM.fxPanel.querySelector('.fx-container');
      const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
      if (fxContainer) fxContainer.classList.remove('hidden');
      if (presetsContainer) presetsContainer.classList.remove('hidden');
      
      window.electronAPI.resizeWindow('expanded');
    } else if (states.isKeySelectorOpen) {
      DOM.fxPanel.classList.remove('hidden');
      DOM.keySelectorContainer.classList.remove('hidden');
      DOM.btnToneToggle.innerText = 'Chọn Tone ▴';
      DOM.btnToneToggle.classList.add('active');
      
      const fxContainer = DOM.fxPanel.querySelector('.fx-container');
      const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
      if (fxContainer) fxContainer.classList.add('hidden');
      if (presetsContainer) presetsContainer.classList.add('hidden');
      
      window.electronAPI.resizeWindow('expanded_tone_only');
    } else {
      window.electronAPI.resizeWindow('collapsed');
    }
  } else {
    alert('Không thể lưu cấu hình, đã có lỗi xảy ra!');
  }
}

export function cancelSettings() {
  closeSettingsPanelUI();
  
  DOM.app.style.setProperty('--bg-opacity', appConfig.opacity / 100);
  
  if (states.isFxPanelOpen) {
    DOM.fxPanel.classList.remove('hidden');
    DOM.btnReverbToggle.innerText = 'Chỉnh Vang ▴';
    DOM.btnReverbToggle.classList.add('active');
    
    const fxContainer = DOM.fxPanel.querySelector('.fx-container');
    const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
    if (fxContainer) fxContainer.classList.remove('hidden');
    if (presetsContainer) presetsContainer.classList.remove('hidden');
    
    window.electronAPI.resizeWindow('expanded');
  } else if (states.isKeySelectorOpen) {
    DOM.fxPanel.classList.remove('hidden');
    DOM.keySelectorContainer.classList.remove('hidden');
    DOM.btnToneToggle.innerText = 'Chọn Tone ▴';
    DOM.btnToneToggle.classList.add('active');
    
    const fxContainer = DOM.fxPanel.querySelector('.fx-container');
    const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
    if (fxContainer) fxContainer.classList.add('hidden');
    if (presetsContainer) presetsContainer.classList.add('hidden');
    
    window.electronAPI.resizeWindow('expanded_tone_only');
  } else {
    window.electronAPI.resizeWindow('collapsed');
  }
}
