/**
 * Cache module for Cubase Live Controller
 * Sử dụng localStorage để lưu kết quả nhận diện Tone
 */

export async function generateHashId(title) {
  if (!title) return null;
  // Bỏ tiền tố thông báo Youtube kiểu "(54) "
  let tempTitle = title.replace(/^\(\d+\)\s*/, '');
  
  // Xóa các ký tự đặc biệt, dấu câu, khoảng trắng thừa
  const cleanTitle = tempTitle.toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  if (!cleanTitle) return null;

  // Thuật toán hash đơn giản
  let hash = 0;
  for (let i = 0; i < cleanTitle.length; i++) {
    const char = cleanTitle.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit int
  }
  return `song_${Math.abs(hash)}`;
}

export function getFromCache(hashId) {
  if (!hashId) return null;
  try {
    const data = localStorage.getItem(hashId);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed;
    }
  } catch (e) {
    console.error('Lỗi khi đọc cache:', e);
  }
  return null;
}

export function saveToCache(hashId, resultData) {
  if (!hashId || !resultData) return;
  try {
    // Đọc cache cũ
    const existing = getFromCache(hashId);
    let historyMap = {};
    if (existing && existing.historyMap) {
      historyMap = existing.historyMap;
    }

    // Cộng dồn vote từ lần dò mới
    if (resultData.voteDetails && resultData.voteDetails.length > 0) {
      resultData.voteDetails.forEach(v => {
        const tag = `${v.key}_${v.scale}`;
        if (!historyMap[tag]) {
           historyMap[tag] = { key: v.key, scale: v.scale, name: v.name, count: 0, confidenceSum: 0 };
        }
        historyMap[tag].count += v.count;
        historyMap[tag].confidenceSum += (v.confidence * v.count);
      });
    } else {
       // Nếu là kết quả từ Tier 1 (không có voteDetails), giả định đây là kết quả có trọng số cực cao (tương đương 10 segments tự tin 100%)
       const tag = `${resultData.key}_${resultData.scale}`;
       if (!historyMap[tag]) {
           historyMap[tag] = { key: resultData.key, scale: resultData.scale, name: resultData.name, count: 0, confidenceSum: 0 };
       }
       historyMap[tag].count += 10; 
       historyMap[tag].confidenceSum += 1000; 
    }

    // Tính toán lại Tone Top 1 dựa trên lịch sử tích lũy
    const aggregatedList = Object.values(historyMap);
    aggregatedList.sort((a, b) => b.count - a.count || (b.confidenceSum / b.count) - (a.confidenceSum / a.count));
    
    const best = aggregatedList[0];

    const data = {
      key: best.key,
      scale: best.scale,
      name: best.name,
      historyMap: historyMap,
      timestamp: Date.now()
    };
    
    localStorage.setItem(hashId, JSON.stringify(data));
  } catch (e) {
    console.error('Lỗi khi lưu cache:', e);
  }
}
