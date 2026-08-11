import { DOM } from './dom.js';
import { states, appConfig, setAppConfig } from './state.js';
import { midi } from './midi.js';
import { closeSettingsPanelUI } from './ui.js';
import { connectMidi } from './main.js';

export function loadConfigToForm() {
  DOM.selectMidiOut.value = appConfig.midiOutPort;
  DOM.selectMidiIn.value = appConfig.midiInPort;
  DOM.inputMidiChannel.value = appConfig.midiChannel;
  
  DOM.mapBeatVol.value = appConfig.midiMappings.beatVol;
  DOM.mapBeatMute.value = appConfig.midiMappings.beatMute;
  DOM.mapMicVol.value = appConfig.midiMappings.micVol;
  DOM.mapMicMute.value = appConfig.midiMappings.micMute;
  DOM.mapFxMute.value = appConfig.midiMappings.fxMute;
  DOM.mapReverbLong.value = appConfig.midiMappings.reverbLong;
  DOM.mapReverbShort.value = appConfig.midiMappings.reverbShort;
  DOM.mapDelay.value = appConfig.midiMappings.delay;
  DOM.mapAutotune.value = appConfig.midiMappings.autotune;
  DOM.mapFlex.value = appConfig.midiMappings.flex;
  DOM.mapAutotuneKey.value = appConfig.midiMappings.autotuneKey ?? 31;
  DOM.mapAutotuneScale.value = appConfig.midiMappings.autotuneScale ?? 32;
  DOM.mapGetTone.value = appConfig.midiMappings.getTone ?? 33;
  DOM.mapSendTone.value = appConfig.midiMappings.sendTone ?? 34;
  DOM.mapDetectedKey.value = appConfig.midiMappings.detectedKey ?? 35;
  DOM.mapDetectedScale.value = appConfig.midiMappings.detectedScale ?? 36;
  
  DOM.inputProjectPath.value = appConfig.projectPath;
  DOM.chkAutoOpen.checked = appConfig.autoOpenProject;
  DOM.sliderOpacity.value = appConfig.opacity;
  DOM.valOpacity.innerText = appConfig.opacity + '%';
  
  DOM.presetReverbLong.value = appConfig.voicePreset.reverbLong;
  DOM.presetReverbShort.value = appConfig.voicePreset.reverbShort;
  DOM.presetDelay.value = appConfig.voicePreset.delay;
  DOM.presetAutotune.value = appConfig.voicePreset.autotune ?? 0;
  DOM.presetFlex.value = appConfig.voicePreset.flex ?? 0;
  DOM.presetMicChange.value = appConfig.voicePreset.micChange ?? appConfig.voicePreset.micVolChange ?? 10;
  DOM.presetBeatChange.value = appConfig.voicePreset.beatChange ?? -20;
  
  DOM.shortcutToggleMusic.value = appConfig.shortcuts?.toggleMusic || 'Chưa gán';
  DOM.shortcutToggleMic.value = appConfig.shortcuts?.toggleMic || 'Chưa gán';
  DOM.shortcutToggleFx.value = appConfig.shortcuts?.toggleFx || 'Chưa gán';
  DOM.shortcutToggleWindow.value = appConfig.shortcuts?.toggleWindow || 'Chưa gán';
  DOM.shortcutSetSingMode.value = appConfig.shortcuts?.setSingMode || 'Chưa gán';
  DOM.shortcutSetVoiceMode.value = appConfig.shortcuts?.setVoiceMode || 'Chưa gán';

  if (DOM.inputSpotifyClientId) DOM.inputSpotifyClientId.value = appConfig.spotifyClientId || '';
  if (DOM.inputSpotifyClientSecret) DOM.inputSpotifyClientSecret.value = appConfig.spotifyClientSecret || '';

  if (appConfig.audioAnalyzer) {
    DOM.inputAudioDuration.value = appConfig.audioAnalyzer.duration || 8;
    DOM.inputAudioMinFreq.value = appConfig.audioAnalyzer.minFreq || 27.5;
  }
}

export async function saveSettings() {
  const newConfig = {
    ...appConfig,
    midiOutPort: DOM.selectMidiOut.value,
    midiInPort: DOM.selectMidiIn.value,
    midiChannel: parseInt(DOM.inputMidiChannel.value),
    autoOpenProject: DOM.chkAutoOpen.checked,
    projectPath: DOM.inputProjectPath.value,
    opacity: parseInt(DOM.sliderOpacity.value),
    voicePreset: {
      reverbLong: parseInt(DOM.presetReverbLong.value),
      reverbShort: parseInt(DOM.presetReverbShort.value),
      delay: parseInt(DOM.presetDelay.value),
      autotune: parseInt(DOM.presetAutotune.value),
      flex: parseInt(DOM.presetFlex.value),
      micChange: parseInt(DOM.presetMicChange.value),
      beatChange: parseInt(DOM.presetBeatChange.value)
    },
    midiMappings: {
      beatVol: parseInt(DOM.mapBeatVol.value),
      beatMute: parseInt(DOM.mapBeatMute.value),
      micVol: parseInt(DOM.mapMicVol.value),
      micMute: parseInt(DOM.mapMicMute.value),
      fxMute: parseInt(DOM.mapFxMute.value),
      reverbLong: parseInt(DOM.mapReverbLong.value),
      reverbShort: parseInt(DOM.mapReverbShort.value),
      delay: parseInt(DOM.mapDelay.value),
      autotune: parseInt(DOM.mapAutotune.value),
      flex: parseInt(DOM.mapFlex.value),
      modeSingVoice: appConfig.midiMappings.modeSingVoice,
      autotuneKey: parseInt(DOM.mapAutotuneKey.value),
      autotuneScale: parseInt(DOM.mapAutotuneScale.value),
      getTone: parseInt(DOM.mapGetTone.value),
      sendTone: parseInt(DOM.mapSendTone.value),
      detectedKey: parseInt(DOM.mapDetectedKey.value),
      detectedScale: parseInt(DOM.mapDetectedScale.value)
    },
    shortcuts: {
      toggleMusic: DOM.shortcutToggleMusic.value === 'Chưa gán' ? '' : DOM.shortcutToggleMusic.value,
      toggleMic: DOM.shortcutToggleMic.value === 'Chưa gán' ? '' : DOM.shortcutToggleMic.value,
      toggleFx: DOM.shortcutToggleFx.value === 'Chưa gán' ? '' : DOM.shortcutToggleFx.value,
      toggleWindow: DOM.shortcutToggleWindow.value === 'Chưa gán' ? '' : DOM.shortcutToggleWindow.value,
      setSingMode: DOM.shortcutSetSingMode.value === 'Chưa gán' ? '' : DOM.shortcutSetSingMode.value,
      setVoiceMode: DOM.shortcutSetVoiceMode.value === 'Chưa gán' ? '' : DOM.shortcutSetVoiceMode.value
    },
    audioAnalyzer: {
      duration: parseInt(DOM.inputAudioDuration.value) || 8,
      minFreq: parseFloat(DOM.inputAudioMinFreq.value) || 27.5
    },
    spotifyClientId: DOM.inputSpotifyClientId ? DOM.inputSpotifyClientId.value.trim() : (appConfig.spotifyClientId || ''),
    spotifyClientSecret: DOM.inputSpotifyClientSecret ? DOM.inputSpotifyClientSecret.value.trim() : (appConfig.spotifyClientSecret || ''),
  };
  
  const success = await window.electronAPI.saveConfig(newConfig);
  if (success) {
    setAppConfig(newConfig);
    
    midi.setChannel(appConfig.midiChannel);
    connectMidi();
    DOM.app.style.setProperty('--bg-opacity', appConfig.opacity / 100);
    
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
