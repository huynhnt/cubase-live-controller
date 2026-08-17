import { appConfig } from './state.js';

function buildXML(name, ctrls, banks) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<remotedescription version="1.1">\n`;
  
  xml += `<ctrltable name="${name}">\n`;
  for (const c of ctrls) {
    xml += `<ctrl><name>${c.name}</name><stat>176</stat><chan>0</chan><addr>${c.cc}</addr><max>127</max><flags>${c.flags}</flags></ctrl>\n`;
  }
  xml += `</ctrltable>\n`;
  
  xml += `<bank name="${name} Bank">\n`;
  for (const b of banks) {
    xml += `<entry ctrl="${b.name}">\n`;
    if (b.path === 'EMPTY_EFFECT') {
      xml += `<value><device>VST Mixer</device><chan>1819440227</chan><tag>1</tag><flags>${b.flags}</flags></value>\n`;
    } else {
      xml += `<value><device>VST Mixer</device><chan>1</chan><name>${b.path}</name><flags>${b.flags}</flags></value>\n`;
    }
    xml += `</entry>\n`;
  }
  xml += `</bank>\n`;
  
  xml += `</remotedescription>\n`;
  return xml;
}

export async function exportCombinedXML() {
  const ctrls = [];
  const banks = [];
  
  // --- 1. Thêm Tính Năng (Features) ---
  const mappings = appConfig.midiMappings || {};
  const featureNames = {
    beatVol: 'Vol Nhac',
    beatMute: 'Tat Nhac',
    micVol: 'Vol Mic',
    micMute: 'Tat Mic',
    fxMute: 'Tat Auto-tune',
    modeSingVoice: 'Chuyen Mode',
    autotuneKey: 'Autotune Key',
    autotuneScale: 'Autotune Scale'
  };
  
  for (const [key, cc] of Object.entries(mappings)) {
    if (typeof cc === 'number' && cc >= 0 && featureNames.hasOwnProperty(key)) {
      const name = featureNames[key];
      const isMute = name.includes('Tat');
      ctrls.push({ name, cc, flags: isMute ? 3 : 1 });
      // Add empty path so user can map it
      banks.push({ name, path: isMute ? 'mute' : 'volume', flags: isMute ? 2 : 0 });
    }
  }

  // --- 2. Thêm Hiệu Ứng (Effects) ---
  const effects = appConfig.effects || [];
  const sortedEffects = [...effects].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0));

  sortedEffects.forEach((fx, idx) => {
    const channelNum = (fx.slotIndex !== undefined ? fx.slotIndex : idx) + 1;
    const safeName = fx.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    const fullName = `CH ${channelNum} (${safeName})`;
    
    if (fx.ccValue >= 0) {
      ctrls.push({ name: fullName, cc: fx.ccValue, flags: 3 });
      banks.push({ name: fullName, path: 'EMPTY_EFFECT', flags: 0 }); // Use EMPTY_EFFECT to generate correct Cubase tag
    }
    
    const isToggleOn = fx.isEnabled !== false;
    if (isToggleOn && fx.ccToggle >= 0) {
      const toggleName = `Tat CH ${channelNum} (${safeName})`;
      ctrls.push({ name: toggleName, cc: fx.ccToggle, flags: 3 });
      banks.push({ name: toggleName, path: 'EMPTY_EFFECT', flags: 2 }); // Use EMPTY_EFFECT to generate correct Cubase tag
    }
  });
  
  const xml = buildXML('Cubase Live Controller', ctrls, banks);
  const success = await window.electronAPI.saveXMLFile(xml, 'Cubase_Live_Controller.xml');
  if (success) {
    alert('Xuất file XML thành công!');
  }
}
