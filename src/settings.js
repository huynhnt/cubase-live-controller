import { DOM } from './dom.js';
import { states, appConfig, setAppConfig } from './state.js';
import { midi } from './midi.js';
import { closeSettingsPanelUI, renderEffects } from './ui.js';
import { connectMidi } from './main.js';

let pendingMidiMappings = {};
let pendingEffects = [];

const FEATURE_NAMES = {
  beatVol: 'Vol Nhạc',
  beatMute: 'Tắt Nhạc',
  micVol: 'Vol Mic',
  micMute: 'Tắt Mic',
  fxMute: 'Tắt Auto-tune',
  modeSingVoice: 'Chuyển Mode',
  autotuneKey: 'Autotune Key',
  autotuneScale: 'Autotune Scale'
};

export function loadConfigToForm() {
  if (DOM.selectMidiOut) DOM.selectMidiOut.value = appConfig.midiOutPort || '';
  if (DOM.selectMidiIn) DOM.selectMidiIn.value = appConfig.midiInPort || '';
  if (DOM.inputMidiChannel) DOM.inputMidiChannel.value = appConfig.midiChannel || 1;
  
  pendingMidiMappings = { ...(appConfig.midiMappings || {}) };
  pendingEffects = JSON.parse(JSON.stringify(appConfig.effects || []));
  renderCubaseTables();

  if (DOM.selectAutotuneVersion) DOM.selectAutotuneVersion.value = appConfig.autotuneVersion || 'pro';
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
  
  if (DOM.selectVoicePreset) {
    DOM.selectVoicePreset.innerHTML = '';
    const presetNames = appConfig.presets ? Object.keys(appConfig.presets) : [];
    if (!presetNames.includes('Voice')) presetNames.push('Voice');
    presetNames.forEach(pName => {
      const option = document.createElement('option');
      option.value = pName;
      option.innerText = pName;
      DOM.selectVoicePreset.appendChild(option);
    });
    DOM.selectVoicePreset.value = appConfig.voicePreset?.presetName || 'Voice';
  }
  
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
  
  // (Tables are rendered by renderCubaseTables)
}

function renderCubaseTables() {
  const midiChannel = parseInt(DOM.inputMidiChannel?.value) || appConfig.midiChannel || 1;
  
  if (DOM.featuresMappingTable) {
    const tbody = DOM.featuresMappingTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
      Object.keys(FEATURE_NAMES).forEach(key => {
        const ccVal = pendingMidiMappings[key] ?? 0;
        const tr = document.createElement('tr');
        
        const tdName = document.createElement('td');
        tdName.innerText = FEATURE_NAMES[key];
        // Không cho phép sửa tên Tính năng hệ thống
        
        const tdStatus = document.createElement('td');
        tdStatus.innerText = 'Controller';
        
        const tdChannel = document.createElement('td');
        tdChannel.innerText = midiChannel;
        
        const tdAddress = document.createElement('td');
        tdAddress.innerText = ccVal;
        tdAddress.className = 'editable';
        setupInlineEdit(tdAddress, key, 'address', 'features');
        
        const tdMax = document.createElement('td');
        tdMax.innerText = '127';
        
        const tdFlags = document.createElement('td');
        tdFlags.innerText = 'R, , , ';
        
        tr.append(tdName, tdStatus, tdChannel, tdAddress, tdMax, tdFlags);
        tbody.appendChild(tr);
      });
    }
  }

  if (DOM.effectsMappingTable) {
    const tbody = DOM.effectsMappingTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
      pendingEffects.forEach((fx, index) => {
        const tr1 = document.createElement('tr');
        
        const tdName1 = document.createElement('td');
        tdName1.innerText = fx.name + ' (Giá trị)';
        tdName1.className = 'editable';
        setupInlineEdit(tdName1, index, 'name', 'effects');
        
        const tdStatus1 = document.createElement('td');
        tdStatus1.innerText = 'Controller';
        
        const tdChannel1 = document.createElement('td');
        tdChannel1.innerText = midiChannel;
        
        const tdAddress1 = document.createElement('td');
        tdAddress1.innerText = fx.ccValue;
        tdAddress1.className = 'editable';
        setupInlineEdit(tdAddress1, index, 'address', 'effects');
        
        const tdMax1 = document.createElement('td');
        tdMax1.innerText = '127';
        
        const tdFlags1 = document.createElement('td');
        tdFlags1.innerText = 'R, , , ';
        
        tr1.append(tdName1, tdStatus1, tdChannel1, tdAddress1, tdMax1, tdFlags1);
        tbody.appendChild(tr1);
        
        if (fx.isEnabled && fx.ccToggle >= 0) {
          const tr2 = document.createElement('tr');
          
          const tdName2 = document.createElement('td');
          tdName2.innerText = fx.name + ' (Tắt/Bật)';
          
          const tdStatus2 = document.createElement('td');
          tdStatus2.innerText = 'Controller';
          
          const tdChannel2 = document.createElement('td');
          tdChannel2.innerText = midiChannel;
          
          const tdAddress2 = document.createElement('td');
          tdAddress2.innerText = fx.ccToggle;
          tdAddress2.className = 'editable';
          setupInlineEdit(tdAddress2, index, 'toggleAddress', 'effects');
          
          const tdMax2 = document.createElement('td');
          tdMax2.innerText = '127';
          
          const tdFlags2 = document.createElement('td');
          tdFlags2.innerText = 'R, T, , ';
          
          tr2.append(tdName2, tdStatus2, tdChannel2, tdAddress2, tdMax2, tdFlags2);
          tbody.appendChild(tr2);
        }
      });
      
      if (pendingEffects.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.innerText = 'Chưa có hiệu ứng nào. Hãy thêm hiệu ứng ở màn hình chính.';
        td.style.textAlign = 'center';
        td.style.color = 'var(--text-secondary)';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
    }
  }
}

function setupInlineEdit(td, key, field, type) {
  td.addEventListener('dblclick', () => {
    if (td.querySelector('input')) return;
    
    const currentValue = field === 'name' ? td.innerText.replace(' (Giá trị)', '') : td.innerText;
    td.innerHTML = '';
    
    const input = document.createElement('input');
    input.type = field === 'name' ? 'text' : 'number';
    if (field !== 'name') {
      input.min = '0';
      input.max = '127';
    }
    input.value = currentValue;
    input.className = 'inline-edit';
    
    const commitEdit = () => {
      let newVal = input.value;
      if (field !== 'name') newVal = parseInt(newVal) || 0;
      
      if (type === 'features') {
        if (field === 'address') pendingMidiMappings[key] = newVal;
      } else if (type === 'effects') {
        if (field === 'name') pendingEffects[key].name = newVal;
        if (field === 'address') pendingEffects[key].ccValue = newVal;
        if (field === 'toggleAddress') pendingEffects[key].ccToggle = newVal;
      }
      
      renderCubaseTables();
    };
    
    input.addEventListener('blur', commitEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        renderCubaseTables();
      }
    });
    
    td.appendChild(input);
    input.focus();
    input.select();
  });
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
    autotuneVersion: DOM.selectAutotuneVersion?.value || 'pro',
    customAutotuneKeys: (DOM.inputCustomKeys?.value || '').split(',').map(v => parseInt(v.trim()) || 0),
    customAutotuneScales: (DOM.inputCustomScales?.value || '').split(',').map(v => parseInt(v.trim()) || 0),
    autoOpenProject: DOM.chkAutoOpen ? DOM.chkAutoOpen.checked : (appConfig.autoOpenProject ?? false),
    projectPath: DOM.inputProjectPath?.value ?? (appConfig.projectPath ?? ''),
    opacity: parseInt(DOM.sliderOpacity?.value) || (appConfig.opacity ?? 85),
    customAppTarget: DOM.inputCustomAppTarget?.value || 'YouTube',
    voicePreset: {
      presetName: DOM.selectVoicePreset?.value || 'Voice',
      micChange: parseInt(DOM.presetMicChange?.value) || 10,
      beatChange: parseInt(DOM.presetBeatChange?.value) || -20
    },
    midiMappings: pendingMidiMappings,
    effects: pendingEffects,
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
    renderEffects();
    
    if (states.isFxPanelOpen) {
      DOM.fxPanel.classList.remove('hidden');
      DOM.btnReverbToggle.innerText = 'Hiệu ứng ▴';
      DOM.btnReverbToggle.classList.add('active');
      
      const fxContainer = DOM.fxPanel.querySelector('.fx-container');
      const presetsContainer = DOM.fxPanel.querySelector('.presets-container');
      if (fxContainer) fxContainer.classList.remove('hidden');
      if (presetsContainer) presetsContainer.classList.remove('hidden');
      
      const fxCount = appConfig.effects ? appConfig.effects.length : 0;
      const addBtnHeight = fxCount >= 10 ? 0 : 40;
      const customHeight = 120 + (fxCount * 40) + addBtnHeight;
      window.electronAPI.resizeWindow('expanded', customHeight);
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
    DOM.btnReverbToggle.innerText = 'Hiệu ứng ▴';
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
