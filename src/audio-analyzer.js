/**
 * Smart Tone Engine v3: True HPCP & Multi-Segment Voting
 * Thuật toán: Fractional Pitch Mapping, Temperley Profiles, Chord Evidence, Temporal Segment Voting
 */

import { getToneName } from './tone-parser.js';

// Key profiles: Temperley & Krumhansl-Schmuckler hybrid
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Temperley profiles (đặc biệt nhạy với âm chủ & hòa âm hiện đại)
const TEMPERLEY_MAJOR = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];
const TEMPERLEY_MINOR = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0];

let _stream = null;
let _audioCtx = null;

function correlate(chroma, profile) {
  const n = 12;
  const mc = chroma.reduce((a, b) => a + b, 0) / n;
  const mp = profile.reduce((a, b) => a + b, 0) / n;

  let num = 0, dc2 = 0, dp2 = 0;
  for (let i = 0; i < n; i++) {
    const dc = chroma[i] - mc;
    const dp = profile[i] - mp;
    num += dc * dp;
    dc2 += dc * dc;
    dp2 += dp * dp;
  }

  return (dc2 === 0 || dp2 === 0) ? 0 : num / Math.sqrt(dc2 * dp2);
}

/**
 * Xây dựng True HPCP (Harmonic Pitch Class Profile)
 * Sử dụng Fractional Mapping và Power thay vì Amplitude.
 */
function buildChromaSeparated(freqData, sampleRate, fftSize, minFreq = 27.5) {
  const bassChroma = new Array(12).fill(0);
  const midHighChroma = new Array(12).fill(0);
  const binFreq = sampleRate / fftSize;

  for (let i = 1; i < freqData.length; i++) {
    const freq = i * binFreq;
    if (freq < minFreq || freq > 4186) continue; // A0 (27.5Hz) - C8 (4186Hz)

    const midi = 12 * Math.log2(freq / 440) + 69;
    
    // Năng lượng phổ: dùng Power (bình phương amplitude) để giảm nhiễu
    const power = Math.pow(10, freqData[i] / 10); 

    // Fractional Pitch Mapping (Linear Interpolation)
    const lowerPitch = Math.floor(midi);
    const upperPitch = lowerPitch + 1;
    const fraction = midi - lowerPitch; // 0.0 -> 1.0

    const lowerClass = ((lowerPitch % 12) + 12) % 12;
    const upperClass = ((upperPitch % 12) + 12) % 12;

    if (freq <= 250) {
      bassChroma[lowerClass] += power * (1 - fraction) * 1.5; // Adaptive bass weight có thể tinh chỉnh sau
      bassChroma[upperClass] += power * fraction * 1.5;
    } else {
      midHighChroma[lowerClass] += power * (1 - fraction);
      midHighChroma[upperClass] += power * fraction;
    }
  }

  const fullChroma = new Array(12).fill(0);
  for (let c = 0; c < 12; c++) {
    fullChroma[c] = bassChroma[c] + midHighChroma[c];
  }

  return { bassChroma, midHighChroma, fullChroma };
}

/**
 * Phân tích 1 Segment Chroma để ra Key, Confidence và Chord Evidence
 */
export function detectKeyFromChroma(chromaObj) {
  const { bassChroma, fullChroma } = chromaObj;
  
  const totalBass = bassChroma.reduce((a, b) => a + b, 0) || 1;
  const bassRatios = bassChroma.map(v => v / totalBass);

  const totalChromaEnergy = fullChroma.reduce((a, b) => a + b, 0) || 1;
  const scores = [];

  for (let key = 0; key < 12; key++) {
    const rotatedFull = [...fullChroma.slice(key), ...fullChroma.slice(0, key)];

    const majKrum = correlate(rotatedFull, MAJOR_PROFILE);
    const minKrum = correlate(rotatedFull, MINOR_PROFILE);
    const majTemp = correlate(rotatedFull, TEMPERLEY_MAJOR);
    const minTemp = correlate(rotatedFull, TEMPERLEY_MINOR);

    let majorCorrScore = majKrum * 0.6 + majTemp * 0.4;
    let minorCorrScore = minKrum * 0.6 + minTemp * 0.4;

    const bassBonus = bassRatios[key] * 0.35;

    // Major / Minor Third Bonus
    const minorThirdPitch = (key + 3) % 12;
    const majorThirdPitch = (key + 4) % 12;
    const min3Power = (chromaObj.midHighChroma ? chromaObj.midHighChroma[minorThirdPitch] : fullChroma[minorThirdPitch]) || 0;
    const maj3Power = (chromaObj.midHighChroma ? chromaObj.midHighChroma[majorThirdPitch] : fullChroma[majorThirdPitch]) || 0;
    const thirdSum = min3Power + maj3Power || 1;

    const minorThirdBonus = (min3Power / thirdSum) * 0.28;
    const majorThirdBonus = (maj3Power / thirdSum) * 0.28;

    // Chord Evidence cho V7 (Hỗ trợ xác định Tone Thứ)
    const v7Root = (key + 7) % 12;
    const v7Third = (v7Root + 4) % 12;
    const v7Fifth = (v7Root + 7) % 12;
    const v7Seventh = (v7Root + 10) % 12;

    const v7EvidenceEnergy = (fullChroma[v7Root] || 0) + (fullChroma[v7Third] || 0) + (fullChroma[v7Fifth] || 0) + (fullChroma[v7Seventh] || 0);
    const minorChordBonus = (v7EvidenceEnergy / totalChromaEnergy) * 0.25;

    const finalMajorScore = majorCorrScore + bassBonus + majorThirdBonus;
    const finalMinorScore = minorCorrScore + bassBonus + minorThirdBonus + minorChordBonus;

    scores.push({ key, scale: 0, score: finalMajorScore, name: getToneName(key, 0) });
    scores.push({ key, scale: 1, score: finalMinorScore, name: getToneName(key, 1), v7Evidence: v7EvidenceEnergy });
  }

  scores.sort((a, b) => b.score - a.score);

  const top1 = scores[0];
  const top2 = scores[1];

  const scoreDiff = Math.max(0, top1.score - top2.score);
  const rawConfidence = Math.min(100, Math.round((top1.score * 0.6 + scoreDiff * 1.5) * 100));
  const confidence = Math.max(30, Math.min(99, rawConfidence));

  return {
    key: top1.key,
    scale: top1.scale,
    confidence,
    name: top1.name,
    v7Evidence: top1.v7Evidence || 0,
    candidates: [
      { key: top1.key, scale: top1.scale, confidence, name: top1.name },
      { key: top2.key, scale: top2.scale, confidence: Math.max(10, Math.round(confidence * 0.85)), name: top2.name }
    ]
  };
}

export function stopAnalysis() {
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  if (_audioCtx) { _audioCtx.close().catch(() => {}); _audioCtx = null; }
}

let _sessionStartTime = null;

export function resetSessionTimer() {
  _sessionStartTime = null;
}

export function getSessionTimestamp() {
  if (!_sessionStartTime || (Date.now() - _sessionStartTime > 900000)) {
    _sessionStartTime = Date.now();
  }
  const totalSec = Math.floor((Date.now() - _sessionStartTime) / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `[${mm}:${ss}]`;
}

function debugLog(msg) {
  const timeTag = getSessionTimestamp();
  const fullMsg = `${timeTag} ${msg}`;
  console.log(fullMsg);
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.logDebug) {
    window.electronAPI.logDebug(fullMsg);
  }
}

function isBluetoothDevice(label = '') {
  const l = label.toLowerCase();
  return l.includes('headset') || l.includes('bluetooth') || l.includes('hands-free') || l.includes('soundcore') || l.includes('airpods');
}

async function getActiveAudioStream() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    let audioInputs = devices.filter(d => d.kind === 'audioinput');

    if (audioInputs.length === 0) {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
    }

    audioInputs.sort((a, b) => {
      const isBtA = isBluetoothDevice(a.label);
      const isBtB = isBluetoothDevice(b.label);
      if (!isBtA && isBtB) return -1;
      if (isBtA && !isBtB) return 1;
      return 0;
    });

    debugLog(`🎙️ [SmartTone Device Scanner] Khám phá ${audioInputs.length} thiết bị thu âm (Đã ưu tiên Mic thường):`);
    audioInputs.forEach((d, idx) => {
      const btTag = isBluetoothDevice(d.label) ? ' [Bluetooth HFP]' : ' [Native Mic/Soundcard]';
      debugLog(`   [${idx + 1}] "${d.label || 'Unnamed Device'}"${btTag}`);
    });

    let fallbackStream = null;

    for (const dev of audioInputs) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: dev.deviceId ? { exact: dev.deviceId } : undefined,
            echoCancellation: false, noiseSuppression: false, autoGainControl: false
          }
        });

        if (!fallbackStream) fallbackStream = stream;

        const testCtx = new AudioContext();
        const testSrc = testCtx.createMediaStreamSource(stream);
        const testAnalyser = testCtx.createAnalyser();
        testAnalyser.fftSize = 512;
        testSrc.connect(testAnalyser);
        const testData = new Float32Array(testAnalyser.frequencyBinCount);

        await new Promise(r => setTimeout(r, 100));
        testAnalyser.getFloatFrequencyData(testData);
        const level = Math.max(...testData);
        testCtx.close().catch(() => {});

        if (level > -115) {
          debugLog(`✅ [SmartTone Selected] Đã chọn thiết bị CÓ TÍN HIỆU (${level.toFixed(1)}dB): "${dev.label || 'Audio Device'}"`);
          if (fallbackStream && fallbackStream !== stream) {
            fallbackStream.getTracks().forEach(t => t.stop());
          }
          return stream;
        } else {
          debugLog(`⚠️ [SmartTone Skip] Bỏ qua thiết bị im lặng (${level.toFixed(1)}dB): "${dev.label || 'Audio Device'}"`);
          if (stream !== fallbackStream) {
            stream.getTracks().forEach(t => t.stop());
          }
        }
      } catch (e) { }
    }

    if (fallbackStream) {
      debugLog(`⚠️ [SmartTone Fallback] Sử dụng thiết bị đầu tiên làm mặc định.`);
      return fallbackStream;
    }

    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
  } catch (err) {
    debugLog('Lỗi quét thiết bị: ' + err.message);
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
  }
}

/**
 * Capture system audio và phân tích key bằng Multi-Segment Voting Matrix.
 */
export async function analyzeAudioKey(durationMs = 8000, minFreq = 27.5, onProgress = null) {
  stopAnalysis(); 

  let loopbackSuccess = false;

  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.getSystemAudioSource) {
    try {
      const sourceId = await window.electronAPI.getSystemAudioSource();
      if (sourceId) {
        debugLog('🎧 [SmartTone System Audio] Đang kết nối trực tiếp âm thanh hệ thống (WASAPI Digital Loopback)...');
        _stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId }
          },
          video: {
            mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId }
          }
        });
        _stream.getVideoTracks().forEach(track => track.stop());
        loopbackSuccess = true;
        debugLog('✅ [SmartTone System Audio] ĐÃ KẾT NỐI TRỰC TIẾP ÂM THANH KỸ THUẬT SỐ HỆ THỐNG (Không qua Mic phòng)!');
      }
    } catch (loopErr) {
      debugLog('⚠️ Không thể kết nối System Digital Loopback: ' + loopErr.message);
    }
  }

  if (!loopbackSuccess) {
    try {
      _stream = await getActiveAudioStream();
    } catch (micErr) {
      debugLog('Không lấy được micro/soundcard: ' + micErr.message);
      throw new Error('Lỗi truy cập âm thanh: ' + micErr.message);
    }
  }

  const audioTracks = _stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stopAnalysis();
    throw new Error('Không nhận được tín hiệu âm thanh.');
  }

  const trackLabel = audioTracks[0].label || 'Default Microphone';
  debugLog(`🔊 [SmartTone Audio Debug] Bắt đầu thu âm từ thiết bị: "${trackLabel}"`);

  _audioCtx = new AudioContext();
  const source = _audioCtx.createMediaStreamSource(_stream);
  const analyser = _audioCtx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0.4;
  source.connect(analyser);

  const freqData = new Float32Array(analyser.frequencyBinCount);
  
  const HOP_SIZE_MS = 50; 
  const SEGMENT_DURATION_MS = 2000;
  const FRAMES_PER_SEGMENT = SEGMENT_DURATION_MS / HOP_SIZE_MS;

  let segmentAccumulatedBass = new Array(12).fill(0);
  let segmentAccumulatedMidHigh = new Array(12).fill(0);
  let segmentAccumulatedFull = new Array(12).fill(0);
  
  let currentSegmentFrameCount = 0;
  let maxObservedDb = -Infinity;
  const segmentResults = [];
  const startTime = Date.now();

  const evaluateSegment = () => {
    if (currentSegmentFrameCount < 5) return; // Bỏ qua đoạn quá ngắn
    const avgBass = segmentAccumulatedBass.map(v => v / currentSegmentFrameCount);
    const avgMidHigh = segmentAccumulatedMidHigh.map(v => v / currentSegmentFrameCount);
    const avgFull = segmentAccumulatedFull.map(v => v / currentSegmentFrameCount);
    
    const segmentResult = detectKeyFromChroma({
      bassChroma: avgBass,
      midHighChroma: avgMidHigh,
      fullChroma: avgFull
    });

    segmentResults.push(segmentResult);
    const elapsedSecs = ((Date.now() - startTime) / 1000).toFixed(1);
    debugLog(`⏱️ [Segment ${segmentResults.length} - ${elapsedSecs}s] Dự đoán: ${segmentResult.name} (${segmentResult.confidence}%)`);

    // Gửi sự kiện callback về UI ngay lập tức
    if (onProgress && typeof onProgress === 'function') {
      onProgress(Math.min(((Date.now() - startTime) / durationMs) * 100, 100), segmentResult.name, segmentResult.confidence);
    }

    // Reset accumulator cho segment tiếp theo
    segmentAccumulatedBass.fill(0);
    segmentAccumulatedMidHigh.fill(0);
    segmentAccumulatedFull.fill(0);
    currentSegmentFrameCount = 0;
  };

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      analyser.getFloatFrequencyData(freqData);
      const maxLevel = Math.max(...freqData);
      if (maxLevel > maxObservedDb) maxObservedDb = maxLevel;

      if (maxLevel > -100) {
        const separatedChroma = buildChromaSeparated(freqData, _audioCtx.sampleRate, analyser.fftSize, minFreq);

        for (let i = 0; i < 12; i++) {
          segmentAccumulatedBass[i] += separatedChroma.bassChroma[i];
          segmentAccumulatedMidHigh[i] += separatedChroma.midHighChroma[i];
          segmentAccumulatedFull[i] += separatedChroma.fullChroma[i];
        }
        currentSegmentFrameCount++;

        // Wrap segment mỗi 2s
        if (currentSegmentFrameCount >= FRAMES_PER_SEGMENT) {
          evaluateSegment();
        }
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        stopAnalysis();

        // Xử lý segment cuối cùng nếu còn dư kha khá frames
        if (currentSegmentFrameCount > 10) {
          evaluateSegment();
        }

        if (segmentResults.length === 0) {
          reject(new Error(`Thiết bị [${trackLabel}] đạt đỉnh ${maxObservedDb.toFixed(1)}dB (cần > -100dB).`));
          return;
        }

        debugLog(`📊 [SmartTone Kết Thúc] Phân tích được ${segmentResults.length} segments độc lập.`);

        // --- GLOBAL VOTING MATRIX ---
        const globalVoteMap = {};
        segmentResults.forEach(seg => {
          const tag = `${seg.key}_${seg.scale}`;
          globalVoteMap[tag] = (globalVoteMap[tag] || 0) + 1;
        });

        const sortedVotes = Object.entries(globalVoteMap)
          .map(([tag, count]) => {
            const [k, s] = tag.split('_').map(Number);
            const segs = segmentResults.filter(r => r.key === k && r.scale === s);
            const avgConf = Math.round(segs.reduce((a, b) => a + b.confidence, 0) / segs.length);
            const totalV7Evidence = segs.reduce((a, b) => a + (b.v7Evidence || 0), 0);
            return { key: k, scale: s, name: getToneName(k, s), count, confidence: avgConf, totalV7Evidence };
          })
          .sort((a, b) => b.count - a.count || b.confidence - a.confidence);

        let finalResult = { ...sortedVotes[0] };
        
        // Harmonic Reasoning: V7 -> Minor Correction (Multi-Segment Context)
        // Nếu Top 1 là Trưởng (Vd: C#), kiểm tra xem có evidence của F#m ở các segment khác không
        if (finalResult.scale === 0) {
          const tonicMinorKey = (finalResult.key + 5) % 12;
          const minorCandidate = sortedVotes.find(v => v.key === tonicMinorKey && v.scale === 1);
          
          if (minorCandidate && minorCandidate.count >= 1 && minorCandidate.totalV7Evidence > 0) {
             debugLog(`🎼 [Harmonic Matrix] Tự động sửa Tone Trưởng (${finalResult.name}) thành Tone Thứ (${minorCandidate.name}) do có bằng chứng Hợp Âm Át (V7) từ ${minorCandidate.count} segments!`);
             finalResult = minorCandidate;
          }
        }

        const overallResult = {
          key: finalResult.key,
          scale: finalResult.scale,
          name: finalResult.name,
          confidence: finalResult.confidence,
          sessionTime: getSessionTimestamp(),
          candidates: [
            { key: finalResult.key, scale: finalResult.scale, confidence: finalResult.confidence, name: finalResult.name },
            { key: sortedVotes[1]?.key ?? 1, scale: sortedVotes[1]?.scale ?? 0, confidence: Math.max(10, (sortedVotes[1]?.confidence || 0) - 10), name: sortedVotes[1]?.name || 'None' }
          ]
        };

        const readableVotesObj = {};
        sortedVotes.forEach(v => { readableVotesObj[v.name] = v.count; });
        debugLog(`🗳️ [SmartTone Segment Matrix] ${JSON.stringify(readableVotesObj)}`);
        debugLog(`🏆 [SmartTone Final] Top 1: ${overallResult.name} (${overallResult.confidence}%)`);

        resolve(overallResult);
      }
    }, HOP_SIZE_MS); 

    audioTracks[0].addEventListener('ended', () => {
      clearInterval(interval);
      stopAnalysis();
      reject(new Error('Chia sẻ âm thanh bị ngắt sớm.'));
    });
  });
}
