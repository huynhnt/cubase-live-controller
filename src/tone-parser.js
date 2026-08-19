/**
 * Tier 1: Parse tone/key từ tiêu đề YouTube
 * Dùng danh sách cố định tất cả 24 tone (12 Major + 12 Minor)
 * để tìm kiếm trong tiêu đề — đơn giản, chính xác, không sai.
 */

// Danh sách đầy đủ tất cả các tone hợp lệ
// Sắp xếp: tên dài trước (C#m trước C#, trước C) để tránh match nhầm
const TONE_LIST = [
  // Minor — 3 ký tự trở lên (ưu tiên cao nhất)
  { name: 'C#m', key: 1,  scale: 1 }, { name: 'Dbm', key: 1,  scale: 1 },
  { name: 'D#m', key: 3,  scale: 1 }, { name: 'Ebm', key: 3,  scale: 1 },
  { name: 'F#m', key: 6,  scale: 1 }, { name: 'Gbm', key: 6,  scale: 1 },
  { name: 'G#m', key: 8,  scale: 1 }, { name: 'Abm', key: 8,  scale: 1 },
  { name: 'A#m', key: 10, scale: 1 }, { name: 'Bbm', key: 10, scale: 1 },
  // Minor — 2 ký tự
  { name: 'Cm',  key: 0,  scale: 1 },
  { name: 'Dm',  key: 2,  scale: 1 },
  { name: 'Em',  key: 4,  scale: 1 },
  { name: 'Fm',  key: 5,  scale: 1 },
  { name: 'Gm',  key: 7,  scale: 1 },
  { name: 'Am',  key: 9,  scale: 1 },
  { name: 'Bm',  key: 11, scale: 1 },
  // Major — 2 ký tự (có dấu thăng/giáng)
  { name: 'C#',  key: 1,  scale: 0 }, { name: 'Db',  key: 1,  scale: 0 },
  { name: 'D#',  key: 3,  scale: 0 }, { name: 'Eb',  key: 3,  scale: 0 },
  { name: 'F#',  key: 6,  scale: 0 }, { name: 'Gb',  key: 6,  scale: 0 },
  { name: 'G#',  key: 8,  scale: 0 }, { name: 'Ab',  key: 8,  scale: 0 },
  { name: 'A#',  key: 10, scale: 0 }, { name: 'Bb',  key: 10, scale: 0 },
  // Major — 1 ký tự (kiểm tra sau cùng vì dễ nhầm nhất)
  { name: 'C',   key: 0,  scale: 0 },
  { name: 'D',   key: 2,  scale: 0 },
  { name: 'E',   key: 4,  scale: 0 },
  { name: 'F',   key: 5,  scale: 0 },
  { name: 'G',   key: 7,  scale: 0 },
  { name: 'A',   key: 9,  scale: 0 },
  { name: 'B',   key: 11, scale: 0 },
];

/**
 * Kiểm tra xem tone có xuất hiện trong tiêu đề không (có word boundary)
 * Ví dụ: "Fm" match trong "Tone Nữ Fm" nhưng không match trong "Fmaj"
 */
function findToneInText(text, toneName) {
  // Escape ký tự đặc biệt trong tên tone (#)
  const escaped = toneName.replace(/[#]/g, '\\#');
  const re = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
  return re.test(text);
}

/**
 * Parse tone từ tiêu đề YouTube.
 * Chiến lược 2 vòng:
 *   Vòng 1: Chỉ tìm tone xuất hiện SAU từ khóa "tone/key/giọng/gam"
 *   Vòng 2: Tìm tone xuất hiện BẤT KỲ ĐÂU trong tiêu đề
 *
 * Trả về { key: 0-11, scale: 0|1, source: string } hoặc null
 */
export function parseToneFromTitle(title) {
  if (!title) return null;

  // ── Vòng 1: Tìm trong ngữ cảnh "Tone ...", "Key ...", "Giọng ...", "Gam ..." ──
  // Lấy đoạn text ngay sau từ khóa (tối đa 20 ký tự) để tìm tone
  const keywordRe = /(?:tone|key|gi\u1ecdng|gam)\s+(.{1,20}?)(?:\s*[\|,\-]|$)/gi;
  let m;
  while ((m = keywordRe.exec(title)) !== null) {
    const segment = m[1]; // đoạn text sau từ khóa
    for (const tone of TONE_LIST) {
      if (findToneInText(segment, tone.name)) {
        return { key: tone.key, scale: tone.scale, source: `${m[0].trim()} → ${tone.name}` };
      }
    }
  }

  // ── Vòng 2: Tìm tone xuất hiện bất kỳ đâu trong tiêu đề ──
  // Bỏ qua tone 1 ký tự đơn lẻ (A/B/C...) để tránh false positive
  for (const tone of TONE_LIST) {
    if (tone.name.length === 1) continue; // bỏ A, B, C, D, E, F, G đứng một mình
    if (findToneInText(title, tone.name)) {
      return { key: tone.key, scale: tone.scale, source: tone.name };
    }
  }

  return null;
}

/**
 * Tách tên bài hát và ca sĩ từ tiêu đề YouTube.
 * Ví dụ: "Nơi Này Có Anh - Sơn Tùng M-TP - YouTube" → { song, artist }
 */
export function extractSongInfo(title) {
  if (!title) return { song: '', artist: '' };

  // Bỏ tiền tố thông báo Youtube kiểu "(54) " ở đầu
  let clean = title.replace(/^\(\d+\)\s*/, '');

  // Bỏ " - YouTube" hoặc "| YouTube" ở cuối
  clean = clean.replace(/\s*[-|]\s*youtube\s*$/i, '').trim();

  // Bỏ nhãn như (Official Video), [Lyric Video], (Beat), (Karaoke), (Tone Nữ Fm)...
  clean = clean.replace(/\s*[\(\[](?:official|lyric|mv|m\/v|video|audio|live|karaoke|nh\u1ea1c|beat|hd|4k|full|tone|key).*?[\)\]]/gi, '').trim();

  // Tách theo dấu " - " hoặc " | "
  const parts = clean.split(/\s+[-|]\s+/);
  if (parts.length >= 2) {
    return { song: parts[0].trim(), artist: parts[1].trim() };
  }
  return { song: clean.trim(), artist: '' };
}

const NOTE_NAMES_MAJOR = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_NAMES_MINOR = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

/**
 * Chuyển đổi key (0-11) và scale (0=Major, 1=Minor) thành tên tone chuẩn nhạc lý
 * Áp dụng luật Enharmonic (A#m -> Bbm, D#m -> Ebm...)
 */
export function getToneName(key, scale) {
  const index = ((key % 12) + 12) % 12;
  const note = scale === 1 ? NOTE_NAMES_MINOR[index] : NOTE_NAMES_MAJOR[index];
  return scale === 1 ? `${note}m` : note;
}

