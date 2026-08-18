/**
 * Smart Tone Engine v2: Phân tích key bài hát qua Web Audio API + Chromagram
 * Thuật toán: Bass-Weighted HPCP + Temperley Profiles + Multi-Frame Voting Engine
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

/**
 * Tính hệ số tương quan Pearson giữa chroma vector và key profile
 */
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
 * Xây dựng chromagram tách biệt dải Trầm (Bass) và dải Trung-Cao (Mid/Treble)
 * Lọc bồi âm HPCP nhẹ để tránh hiện tượng nhiễu octave.
 */
function buildChromaSeparated(freqData, sampleRate, fftSize, minFreq = 27.5) {
  const bassChroma = new Array(12).fill(0);
  const midHighChroma = new Array(12).fill(0);
  const binFreq = sampleRate / fftSize;

  for (let i = 1; i < freqData.length; i++) {
    const freq = i * binFreq;
    if (freq < minFreq || freq > 4186) continue; // 27.5Hz (A0) - 4186Hz (C8)

    const midi = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
    const amplitude = Math.pow(10, freqData[i] / 20); // dB → linear

    if (freq <= 250) {
      // Dải tần Bass (20Hz - 250Hz): Nốt bass thường là Root note (âm chủ)
      bassChroma[pitchClass] += amplitude * 2.5; // Trọng số nhân 2.5 cho Bass
    } else {
      // Dải Trung/Cao (250Hz - 4186Hz): Hòa âm bài hát
      midHighChroma[pitchClass] += amplitude;
    }
  }

  // Kết hợp dải Bass và MidHigh vào tổng Chroma với HPCP
  const fullChroma = new Array(12).fill(0);
  for (let c = 0; c < 12; c++) {
    fullChroma[c] = bassChroma[c] + midHighChroma[c];
  }

  return { bassChroma, midHighChroma, fullChroma };
}

/**
 * Tìm Top Key & Scale kèm Confidence (%) và Top 2 Candidates từ Chromagram
 */
export function detectKeyFromChroma(chromaObj) {
  const { bassChroma, fullChroma } = chromaObj;
  
  // Tính tổng năng lượng bass để chuẩn hóa
  const totalBass = bassChroma.reduce((a, b) => a + b, 0) || 1;
  const bassRatios = bassChroma.map(v => v / totalBass);

  const scores = [];

  for (let key = 0; key < 12; key++) {
    // Xoay chromagram theo key để so sánh với profile
    const rotatedFull = [...fullChroma.slice(key), ...fullChroma.slice(0, key)];

    // Correlation với Krumhansl & Temperley
    const majKrum = correlate(rotatedFull, MAJOR_PROFILE);
    const minKrum = correlate(rotatedFull, MINOR_PROFILE);
    const majTemp = correlate(rotatedFull, TEMPERLEY_MAJOR);
    const minTemp = correlate(rotatedFull, TEMPERLEY_MINOR);

    // Điểm tổng hợp Pearson Correlation (70% Krumhansl + 30% Temperley)
    let majorCorrScore = majKrum * 0.6 + majTemp * 0.4;
    let minorCorrScore = minKrum * 0.6 + minTemp * 0.4;

    // Trợ lực nốt Bass (Bass Root Bonus): Giải quyết lỗi Relative Key (C Major vs A Minor)
    // Nếu nốt Bass tại `key` có năng lượng cao, cộng thêm điểm cho tone đó làm Root
    const bassBonus = bassRatios[key] * 0.35;

    // Trợ lực Nốt Bậc 3 (Third Interval Weighting): Phân biệt chính xác giữa Trưởng (Major 3rd) và Thứ (Minor 3rd)
    const minorThirdPitch = (key + 3) % 12;
    const majorThirdPitch = (key + 4) % 12;
    const min3Power = (chromaObj.midHighChroma ? chromaObj.midHighChroma[minorThirdPitch] : fullChroma[minorThirdPitch]) || 0;
    const maj3Power = (chromaObj.midHighChroma ? chromaObj.midHighChroma[majorThirdPitch] : fullChroma[majorThirdPitch]) || 0;
    const thirdSum = min3Power + maj3Power || 1;

    const minorThirdBonus = (min3Power / thirdSum) * 0.28;
    const majorThirdBonus = (maj3Power / thirdSum) * 0.28;

    // Trợ lực Vòng Hòa Âm Tonic Cadence (i - iv - V7 Harmonic Rule):
    // Đối với tone Thứ `key`: Hợp âm iv là (key+5)%12, Hợp âm V7 là (key+7)%12.
    // Nếu cả iv và V7 đều mạnh trong phổ tần, đây là bằng chứng khẳng định `key` chính là Âm Chủ (Tonic)!
    const subdominantPitch = (key + 5) % 12; // Bm đối với F#m
    const dominantPitch = (key + 7) % 12;    // C# đối với F#m
    const cadenceEnergy = (fullChroma[subdominantPitch] || 0) + (fullChroma[dominantPitch] || 0);
    const totalChromaEnergy = fullChroma.reduce((a, b) => a + b, 0) || 1;
    const cadenceRatio = cadenceEnergy / totalChromaEnergy;
    const minorCadenceBonus = cadenceRatio * 0.22;

    const finalMajorScore = majorCorrScore + bassBonus + majorThirdBonus;
    const finalMinorScore = minorCorrScore + bassBonus + minorThirdBonus + minorCadenceBonus;

    scores.push({ key, scale: 0, score: finalMajorScore, name: getToneName(key, 0) });
    scores.push({ key, scale: 1, score: finalMinorScore, name: getToneName(key, 1) });
  }

  // Sắp xếp điểm giảm dần
  scores.sort((a, b) => b.score - a.score);

  const top1 = scores[0];
  const top2 = scores[1];

  // Tính Confidence phần trăm (dựa vào khoảng cách điểm giữa Top 1 và Top 2)
  const scoreDiff = Math.max(0, top1.score - top2.score);
  const rawConfidence = Math.min(100, Math.round((top1.score * 0.6 + scoreDiff * 1.5) * 100));
  const confidence = Math.max(30, Math.min(99, rawConfidence));

  return {
    key: top1.key,
    scale: top1.scale,
    confidence,
    name: top1.name,
    candidates: [
      { key: top1.key, scale: top1.scale, confidence, name: top1.name },
      { key: top2.key, scale: top2.scale, confidence: Math.max(10, Math.round(confidence * (top2.score / (top1.score || 1)))), name: top2.name }
    ]
  };
}

/**
 * Dừng và giải phóng stream audio đang chạy
 */
export function stopAnalysis() {
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  if (_audioCtx) { _audioCtx.close().catch(() => {}); _audioCtx = null; }
}

let _sessionStartTime = null;

/**
 * Reset lại mốc thời gian 00:00 cho bài hát mới
 */
export function resetSessionTimer() {
  _sessionStartTime = null;
}

/**
 * Lấy chuỗi thời gian đếm tương đối MM:SS tính từ lần đầu tiên bấm dò tone
 */
export function getSessionTimestamp() {
  if (!_sessionStartTime || (Date.now() - _sessionStartTime > 900000)) { // Tự reset sau 15 phút
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

/**
 * Tự động duyệt qua danh sách các thiết bị thu âm trên Windows (Microphone / Soundcard / Stereo Mix)
 * Ưu tiên chọn thiết bị ĐANG CÓ TÍN HIỆU và KHÔNG PHẢI Bluetooth Mic để tránh Windows ép tai nghe Bluetooth vào chế độ HFP (làm nhỏ âm lượng).
 */
async function getActiveAudioStream() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    let audioInputs = devices.filter(d => d.kind === 'audioinput');

    if (audioInputs.length === 0) {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
    }

    // Sắp xếp: Ưu tiên thiết bị KHÔNG PHẢI Bluetooth Mic (như Realtek Microphone Array, Stereo Mix)
    // lên đầu để tránh Windows kích hoạt chế độ Hands-Free HFP làm bóp nhỏ âm lượng tai nghe Bluetooth.
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
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });

        if (!fallbackStream) fallbackStream = stream;

        // Test nhanh tín hiệu âm thanh trong 100ms
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
      } catch (e) {
        // Bỏ qua nếu thiết bị đang bận
      }
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
 * Capture system audio và phân tích key bằng Multi-Frame Voting Engine.
 *
 * @param {number} durationMs - Thời gian phân tích (mặc định 8000ms)
 * @param {number} minFreq - Tần số thấp nhất để phân tích (mặc định 27.5)
 * @param {function} onProgress - Callback tiến trình (0-100)
 * @returns {Promise<{key: number, scale: number, confidence: number, name: string, candidates: Array}>}
 */
export async function analyzeAudioKey(durationMs = 8000, minFreq = 27.5, onProgress = null) {
  stopAnalysis(); // Dừng phiên trước nếu còn

  // Ưu tiên TỐI ĐA: Thu âm thanh kỹ thuật số trực tiếp từ hệ thống (WASAPI Digital Audio Loopback)
  // Loại bỏ 100% tiếng nhiễu phòng, dội micro acoustic và méo tiếng loa ngoài!
  let loopbackSuccess = false;

  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.getSystemAudioSource) {
    try {
      const sourceId = await window.electronAPI.getSystemAudioSource();
      if (sourceId) {
        debugLog('🎧 [SmartTone System Audio] Đang kết nối trực tiếp âm thanh hệ thống (WASAPI Digital Loopback)...');
        _stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId
            }
          },
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId
            }
          }
        });
        _stream.getVideoTracks().forEach(track => track.stop());
        loopbackSuccess = true;
        debugLog('✅ [SmartTone System Audio] ĐÃ KẾT NỐI TRỰC TIẾP ÂM THANH KỸ THUẬT SỐ HỆ THỐNG (Không qua Mic phòng)!');
      }
    } catch (loopErr) {
      debugLog('⚠️ Không thể kết nối System Digital Loopback, chuyển sang Microphone Scanner: ' + loopErr.message);
    }
  }

  if (!loopbackSuccess) {
    try {
      _stream = await getActiveAudioStream();
    } catch (micErr) {
      debugLog('Không lấy được micro/soundcard, thử fallback getDisplayMedia: ' + micErr.message);
      try {
        _stream = await navigator.mediaDevices.getDisplayMedia({
          audio: { 
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
          video: true,
        });
        _stream.getVideoTracks().forEach(track => track.stop());
      } catch (displayErr) {
        throw new Error('Lỗi truy cập âm thanh: ' + displayErr.message);
      }
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
  
  // Ma trận bầu chọn & tích lũy Chroma theo từng frame
  const accumulatedBass = new Array(12).fill(0);
  const accumulatedMidHigh = new Array(12).fill(0);
  const accumulatedFull = new Array(12).fill(0);
  const voteMap = {}; // key_scale string -> votes count

  let validFrameCount = 0;
  let maxObservedDb = -Infinity;
  let frameIndex = 0;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / durationMs) * 100, 100);
      if (onProgress) onProgress(progress);

      analyser.getFloatFrequencyData(freqData);

      const maxLevel = Math.max(...freqData);
      if (maxLevel > maxObservedDb) maxObservedDb = maxLevel;

      // Noise Gate: Lọc bỏ khi im lặng tuyệt đối hoặc nhỏ hơn -100dB
      if (maxLevel > -100) {
        const separatedChroma = buildChromaSeparated(freqData, _audioCtx.sampleRate, analyser.fftSize, minFreq);

        for (let i = 0; i < 12; i++) {
          accumulatedBass[i] += separatedChroma.bassChroma[i];
          accumulatedMidHigh[i] += separatedChroma.midHighChroma[i];
          accumulatedFull[i] += separatedChroma.fullChroma[i];
        }

        // Bầu chọn frame-level candidate
        const frameResult = detectKeyFromChroma(separatedChroma);
        const frameVoteKey = `${frameResult.key}_${frameResult.scale}`;
        voteMap[frameVoteKey] = (voteMap[frameVoteKey] || 0) + 1;

        validFrameCount++;
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        stopAnalysis();

        debugLog(`📊 [SmartTone Debug Kết Thúc] Thiết bị: "${trackLabel}" | Tổng frame đạt chuẩn: ${validFrameCount} | Âm lượng đỉnh: ${maxObservedDb.toFixed(1)} dB`);

        if (validFrameCount < 5) {
          reject(new Error(`Thiết bị [${trackLabel}] đạt đỉnh ${maxObservedDb.toFixed(1)}dB (cần > -100dB). Hãy kiểm tra chọn đúng Micro/Stereo Mix.`));
          return;
        }

        // Phân tích kết quả tích lũy tổng thể
        const avgBass = accumulatedBass.map(v => v / validFrameCount);
        const avgMidHigh = accumulatedMidHigh.map(v => v / validFrameCount);
        const avgFull = accumulatedFull.map(v => v / validFrameCount);

        const overallResult = detectKeyFromChroma({
          bassChroma: avgBass,
          midHighChroma: avgMidHigh,
          fullChroma: avgFull
        });

        // Điều chỉnh Confidence dựa trên sự đồng thuận của ma trận bầu chọn (Voting Matrix)
        const overallKeyTag = `${overallResult.key}_${overallResult.scale}`;
        const topKeyVotes = voteMap[overallKeyTag] || 0;
        const voteAgreementRatio = topKeyVotes / validFrameCount;

        // Nếu tỷ lệ bầu chọn đồng thuận cao (> 60%), thưởng thêm confidence
        let finalConfidence = Math.round(overallResult.confidence * 0.7 + (voteAgreementRatio * 100) * 0.3);
        finalConfidence = Math.max(35, Math.min(98, finalConfidence));

        overallResult.confidence = finalConfidence;
        if (overallResult.candidates) {
          if (overallResult.candidates[0]) overallResult.candidates[0].confidence = finalConfidence;
          if (overallResult.candidates[1]) {
            overallResult.candidates[1].confidence = Math.max(10, Math.min(finalConfidence - 5, Math.round(finalConfidence * 0.85)));
          }
        }

        // Quy tắc Khử Hợp Âm Át V7 (Dominant V7 to Tonic Minor Resolution):
        // Nếu Top 1 đang là Major (ví dụ C# Major, key 1), và key (1 + 5) % 12 (ví dụ F#m, key 6 scale 1) 
        // có từ 15 phiếu bầu trở lên trong ma trận 100ms,
        // thì C# Major thực chất chỉ là Hợp âm Bậc 5 (V7) dạo/kết của Tone Chủ F#m!
        if (overallResult.scale === 0) {
          const tonicMinorKey = (overallResult.key + 5) % 12;
          const minorKeyTag = `${tonicMinorKey}_1`;
          const minorVotes = voteMap[minorKeyTag] || 0;
          
          if (minorVotes >= 15) {
            const v7Name = overallResult.name;
            const tonicName = getToneName(tonicMinorKey, 1);
            debugLog(`🎼 [SmartTone Harmonic V7 Rule] Phát hiện Top 1 (${v7Name}) là Hợp âm Át (V7) của Tone Chủ ${tonicName} (${minorVotes} phiếu). Tự động ưu tiên Tone Chủ ${tonicName}!`);
            
            const oldCandidates = overallResult.candidates || [];
            overallResult.key = tonicMinorKey;
            overallResult.scale = 1;
            overallResult.name = tonicName;

            // Đưa Tonic Minor lên Top 1
            overallResult.candidates = [
              { key: tonicMinorKey, scale: 1, confidence: finalConfidence, name: tonicName },
              { key: oldCandidates[0]?.key ?? 1, scale: oldCandidates[0]?.scale ?? 0, confidence: Math.max(10, Math.round(finalConfidence * 0.85)), name: v7Name }
            ];
          }
        }

        // Format danh sách bầu chọn theo thứ tự số phiếu giảm dần
        const formattedVotes = Object.entries(voteMap)
          .map(([keyTag, count]) => {
            const [k, s] = keyTag.split('_').map(Number);
            return { key: k, scale: s, name: getToneName(k, s), count };
          })
          .sort((a, b) => b.count - a.count);

        overallResult.voteDetails = formattedVotes;
        overallResult.sessionTime = getSessionTimestamp();

        // Tạo object phiếu bầu dạng Tên Tone -> Số Phiếu cho Terminal Log siêu dễ đọc!
        const readableVotesObj = {};
        formattedVotes.forEach(v => {
          readableVotesObj[v.name] = v.count;
        });

        debugLog(`🗳️ [SmartTone Voting Map] Frame Votes: ${JSON.stringify(readableVotesObj)}`);
        debugLog(`🏆 [SmartTone Top Candidates] Top 1: ${overallResult.candidates[0]?.name} (${overallResult.candidates[0]?.confidence}%), Top 2: ${overallResult.candidates[1]?.name} (${overallResult.candidates[1]?.confidence}%)`);

        resolve(overallResult);
      }
    }, 100); // 100ms sample interval

    audioTracks[0].addEventListener('ended', () => {
      clearInterval(interval);
      stopAnalysis();
      reject(new Error('Chia sẻ âm thanh bị ngắt sớm.'));
    });
  });
}

