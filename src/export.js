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
    xml += `<value><device>VST Mixer</device><chan>1</chan><name>${b.path}</name><flags>${b.flags}</flags></value>\n`;
    xml += `</entry>\n`;
  }
  xml += `</bank>\n`;
  
  xml += `</remotedescription>\n`;
  return xml;
}

export async function exportFeaturesXML() {
  const ctrls = [];
  const banks = [];
  
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
  
  const xml = buildXML('Cubase Live Controller - Tinh nang', ctrls, banks);
  const success = await window.electronAPI.saveXMLFile(xml, 'Cubase_Live_Features.xml');
  if (success) {
    alert('Xuất file XML Tính năng thành công!');
  }
}

export async function exportEffectsXML() {
  const ctrls = [];
  const banks = [];
  
  const effects = appConfig.effects || [];
  for (const fx of effects) {
    if (fx.ccValue >= 0) {
      // Remove vietnamese accents for XML compatibility
      const safeName = fx.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
      ctrls.push({ name: safeName, cc: fx.ccValue, flags: 3 });
      banks.push({ name: safeName, path: '', flags: 0 }); // Empty path
    }
    const isToggleOn = fx.isEnabled !== false;
    if (isToggleOn && fx.ccToggle >= 0) {
      const safeName = fx.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
      const toggleName = `Tat ${safeName}`;
      ctrls.push({ name: toggleName, cc: fx.ccToggle, flags: 3 });
      banks.push({ name: toggleName, path: '', flags: 2 }); // Empty path
    }
  }
  
  const xml = buildXML('Cubase Live Controller - Hieu ung', ctrls, banks);
  const success = await window.electronAPI.saveXMLFile(xml, 'Cubase_Live_Effects.xml');
  if (success) {
    alert('Xuất file XML Hiệu ứng thành công!');
  }
}
