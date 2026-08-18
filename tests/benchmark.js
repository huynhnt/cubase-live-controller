import { detectKeyFromChroma } from '../src/audio-analyzer.js';

// Danh sách 24 tone chuẩn để test
const ALL_KEYS = [
  { name: 'C',   key: 0,  scale: 0 }, { name: 'Cm',  key: 0,  scale: 1 },
  { name: 'C#',  key: 1,  scale: 0 }, { name: 'C#m', key: 1,  scale: 1 },
  { name: 'D',   key: 2,  scale: 0 }, { name: 'Dm',  key: 2,  scale: 1 },
  { name: 'Eb',  key: 3,  scale: 0 }, { name: 'Ebm', key: 3,  scale: 1 },
  { name: 'E',   key: 4,  scale: 0 }, { name: 'Em',  key: 4,  scale: 1 },
  { name: 'F',   key: 5,  scale: 0 }, { name: 'Fm',  key: 5,  scale: 1 },
  { name: 'F#',  key: 6,  scale: 0 }, { name: 'F#m', key: 6,  scale: 1 },
  { name: 'G',   key: 7,  scale: 0 }, { name: 'Gm',  key: 7,  scale: 1 },
  { name: 'Ab',  key: 8,  scale: 0 }, { name: 'G#m', key: 8,  scale: 1 },
  { name: 'A',   key: 9,  scale: 0 }, { name: 'Am',  key: 9,  scale: 1 },
  { name: 'Bb',  key: 10, scale: 0 }, { name: 'Bbm', key: 10, scale: 1 },
  { name: 'B',   key: 11, scale: 0 }, { name: 'Bm',  key: 11, scale: 1 },
];

/**
 * Giả lập Chromagram cho 1 tone cụ thể (Root note + Bass + Triad notes + Harmonics)
 */
function generateSyntheticChroma(keyIndex, scaleIndex) {
  const bassChroma = new Array(12).fill(0.1);
  const midHighChroma = new Array(12).fill(0.1);

  // Nốt Root (Bass)
  bassChroma[keyIndex] = 10.0;

  // Triad notes: Major (0, 4, 7) vs Minor (0, 3, 7)
  const thirdOffset = scaleIndex === 0 ? 4 : 3;
  const root = keyIndex;
  const third = (keyIndex + thirdOffset) % 12;
  const fifth = (keyIndex + 7) % 12;

  midHighChroma[root] = 8.0;
  midHighChroma[third] = 6.5;
  midHighChroma[fifth] = 7.0;

  // Bồi âm bớt nhiễu
  midHighChroma[(keyIndex + 2) % 12] += 1.5; // 2nd
  midHighChroma[(keyIndex + 9) % 12] += 1.2; // 6th

  const fullChroma = bassChroma.map((b, i) => b + midHighChroma[i]);
  return { bassChroma, midHighChroma, fullChroma };
}

console.log('====================================================');
console.log(' 🧪 SMART TONE ENGINE V2 — ACCURACY BENCHMARK SUITE');
console.log('====================================================\n');

let exactMatches = 0;
let relativeErrors = 0;
let totalTests = ALL_KEYS.length;

ALL_KEYS.forEach(target => {
  const chromaData = generateSyntheticChroma(target.key, target.scale);
  const result = detectKeyFromChroma(chromaData);

  const isExact = result.key === target.key && result.scale === target.scale;
  
  // Relative key check (ví dụ C Major vs A Minor)
  const isRelative = (
    (target.scale === 0 && result.scale === 1 && result.key === (target.key + 9) % 12) ||
    (target.scale === 1 && result.scale === 0 && result.key === (target.key + 3) % 12)
  );

  if (isExact) exactMatches++;
  if (isRelative) relativeErrors++;

  const statusSymbol = isExact ? '✅ PASS' : (isRelative ? '⚠️ RELATIVE KEY' : '❌ FAIL');
  console.log(`Tone [${target.name.padEnd(4)}] → Đoán: [${result.name.padEnd(4)}] | Confidence: ${result.confidence}% | Status: ${statusSymbol}`);
});

const accuracyPercent = Math.round((exactMatches / totalTests) * 100);

console.log('\n----------------------------------------------------');
console.log(`📊 TỔNG KẾT KẾT QUẢ BENCHMARK:`);
console.log(`   - Tổng số test case: ${totalTests}`);
console.log(`   - Số case chính xác (Exact Match): ${exactMatches}/${totalTests}`);
console.log(`   - Số case nhầm Relative Key: ${relativeErrors}/${totalTests}`);
console.log(`   - ĐỘ CHÍNH XÁC TỔNG THỂ (Accuracy Score): ${accuracyPercent}%`);
console.log('----------------------------------------------------');
