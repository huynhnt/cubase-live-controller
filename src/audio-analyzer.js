/**
 * Tier 3: Phân tích key bài hát qua Web Audio API + Chromagram
 * Thuật toán: Krumhansl-Schmuckler key profiles
 */

// Key profiles (Krumhansl & Schmuckler, 1990)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

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
 * Xây dựng chromagram từ dữ liệu FFT tần số
 */
function buildChroma(freqData, sampleRate, fftSize, minFreq = 27.5) {
  const chroma = new Array(12).fill(0);
  const binFreq = sampleRate / fftSize;

  for (let i = 1; i < freqData.length; i++) {
    const freq = i * binFreq;
    if (freq < minFreq || freq > 4186) continue; // Giới hạn dải tần (cắt nhiễu bass)

    const midi = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
    const amplitude = Math.pow(10, freqData[i] / 20); // dB → linear
    chroma[pitchClass] += amplitude;
  }

  return chroma;
}

/**
 * Tìm key tốt nhất từ chromagram tổng hợp
 */
function detectKeyFromChroma(chroma) {
  let bestScore = -Infinity;
  let bestKey = 0;
  let bestScale = 0;

  for (let key = 0; key < 12; key++) {
    // Xoay chromagram theo key để so sánh với profile
    const rotated = [...chroma.slice(key), ...chroma.slice(0, key)];

    const majorScore = correlate(rotated, MAJOR_PROFILE);
    const minorScore = correlate(rotated, MINOR_PROFILE);

    if (majorScore > bestScore) { bestScore = majorScore; bestKey = key; bestScale = 0; }
    if (minorScore > bestScore) { bestScore = minorScore; bestKey = key; bestScale = 1; }
  }

  return { key: bestKey, scale: bestScale, confidence: Math.round(bestScore * 100) };
}

/**
 * Dừng và giải phóng stream audio đang chạy
 */
export function stopAnalysis() {
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  if (_audioCtx) { _audioCtx.close().catch(() => {}); _audioCtx = null; }
}

/**
 * Capture system audio và phân tích key.
 *
 * @param {number} durationMs - Thời gian phân tích (mặc định 8000ms)
 * @param {number} minFreq - Tần số thấp nhất để phân tích (mặc định 27.5)
 * @param {function} onProgress - Callback tiến trình (0-100)
 * @returns {Promise<{key: number, scale: number, confidence: number}>}
 */
export async function analyzeAudioKey(durationMs = 8000, minFreq = 27.5, onProgress = null) {
  stopAnalysis(); // Dừng phiên trước nếu còn

  // Ưu tiên dùng getUserMedia (Microphone / Soundcard) để KHÔNG HIỆN POPUP CHIA SẺ MÀN HÌNH
  try {
    _stream = await navigator.mediaDevices.getUserMedia({
      audio: { 
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
    });
  } catch (micErr) {
    console.warn('Không lấy được micro/soundcard, thử fallback getDisplayMedia:', micErr);
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

  // Kiểm tra có audio track không
  const audioTracks = _stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stopAnalysis();
    throw new Error('Không nhận được tín hiệu âm thanh.');
  }

  _audioCtx = new AudioContext();
  const source = _audioCtx.createMediaStreamSource(_stream);
  const analyser = _audioCtx.createAnalyser();
  analyser.fftSize = 8192;
  analyser.smoothingTimeConstant = 0.4;
  source.connect(analyser);

  const freqData = new Float32Array(analyser.frequencyBinCount);
  const accumulated = new Array(12).fill(0);
  let sampleCount = 0;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / durationMs) * 100, 100);
      if (onProgress) onProgress(progress);

      analyser.getFloatFrequencyData(freqData);

      // Bỏ qua nếu im lặng (< -90dB)
      const maxLevel = Math.max(...freqData);
      if (maxLevel > -90) {
        const chroma = buildChroma(freqData, _audioCtx.sampleRate, analyser.fftSize, minFreq);
        for (let i = 0; i < 12; i++) accumulated[i] += chroma[i];
        sampleCount++;
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        stopAnalysis();

        if (sampleCount < 5) {
          reject(new Error('Âm lượng quá nhỏ hoặc im lặng trong quá trình phân tích. Hãy đảm bảo nhạc đang phát.'));
          return;
        }

        const avgChroma = accumulated.map(v => v / sampleCount);
        resolve(detectKeyFromChroma(avgChroma));
      }
    }, 100); // Sample mỗi 100ms

    // Xử lý khi user tắt share sớm
    audioTracks[0].addEventListener('ended', () => {
      clearInterval(interval);
      stopAnalysis();
      reject(new Error('Chia sẻ âm thanh bị ngắt sớm.'));
    });
  });
}
