import { createClient } from '@supabase/supabase-js';
import { extractSongInfo } from './tone-parser.js';

// Đọc API Keys từ cấu hình (Vite sử dụng import.meta.env)
// Hướng dẫn: Tạo file .env ở thư mục gốc (cùng chỗ với package.json)
// Và thêm 2 dòng:
// VITE_SUPABASE_URL=https://xxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=ey...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yfnvqxgybvxvtranxzur.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JPoGKnFTRyK0ZwwvsIpyNg_Jv92Wh56';

// Khởi tạo Supabase Client
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

let cloudSettings = null;

export async function fetchCloudSettings() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('is_active', true);
    
    if (!error && Array.isArray(data)) {
      cloudSettings = {};
      data.forEach(row => {
        cloudSettings[row.key] = row.value;
      });
    }
  } catch (err) {
    console.error('Lỗi lấy cloud settings:', err);
  }
}

// Gọi một lần khi file được load để nạp cấu hình sớm
fetchCloudSettings();

/**
 * Lấy dữ liệu phân tích từ Cloud dựa vào mã Hash
 */
export async function getCloudAnalysis(fileHash) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('audio_analysis')
      .select('tones, analysis_version, title, artist, singer')
      .eq('file_hash', fileHash)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        const msg = `⚠️ [Supabase] Lỗi khi truy vấn: ${error.message}`;
        if (window.electronAPI?.logDebug) window.electronAPI.logDebug(msg);
        console.warn(msg);
      }
      return null;
    }
    return data;
  } catch (err) {
    const msg = `❌ [Supabase] Lỗi mạng khi truy vấn: ${err.message}`;
    if (window.electronAPI?.logDebug) window.electronAPI.logDebug(msg);
    console.error(msg);
    return null;
  }
}

/**
 * Lưu hoặc cập nhật kết quả phân tích lên Cloud
 */
export async function saveCloudAnalysis(fileHash, rawTitle, tonesArray, analysisVersion = '3.0.0') {
  if (!supabase) return false;
  try {
    // 1. Lấy dữ liệu cũ trên Cloud để cộng dồn (nếu có)
    const { data: currentData } = await supabase
      .from('audio_analysis')
      .select('tones')
      .eq('file_hash', fileHash)
      .single();

    let mergedTones = [];
    if (currentData && currentData.tones && Array.isArray(currentData.tones)) {
      // 1.5. KIỂM TRA ĐIỀU KIỆN KHÓA VOTE (LOCK)
      // Sử dụng cấu hình động từ bảng app_settings, nếu lỗi mạng thì fallback mặc định (200 vote, 95%)
      const lockCount = cloudSettings?.lock_vote_count ?? 200;
      const lockPercent = cloudSettings?.lock_vote_percent ?? 95;

      const topTone = currentData.tones[0];
      if (topTone && topTone.count >= lockCount && topTone.vote >= lockPercent) {
        if (window.electronAPI?.logDebug) {
          window.electronAPI.logDebug(`🔒 [CloudDB] Bỏ qua Vote! Tone [${topTone.name}] đã đạt mức hoàn hảo tuyệt đối (${topTone.count} votes, ${topTone.vote}%).`);
        }
        return true; // Trả về thành công nhưng không ghi đè dữ liệu mới
      }

      // Clone lại mảng cũ
      mergedTones = [...currentData.tones];
    }

    // 2. Tính Trung Bình Cộng của Top 1 & Top 2 (tonesArray)
    tonesArray.forEach(newTone => {
      const existing = mergedTones.find(t => t.name === newTone.name);
      if (existing) {
        const currentCount = existing.count || 1;
        
        // Khôi phục total_vote từ dữ liệu cũ nếu chưa có trường này
        let currentTotalVote = existing.total_vote;
        if (currentTotalVote === undefined) {
          const currentVote = existing.vote > 100 ? 99 : existing.vote; 
          currentTotalVote = currentVote * currentCount;
        }
        
        existing.count = currentCount + 1;
        existing.total_vote = currentTotalVote + newTone.vote;
        // Tính vote (chỉ dùng để hiển thị/sort)
        existing.vote = Math.round(existing.total_vote / existing.count);
      } else {
        mergedTones.push({ 
          ...newTone, 
          count: 1,
          total_vote: newTone.vote
        });
      }
    });

    // 3. Sắp xếp lại bằng công thức Bayesian Average (IMDB Rating)
    // Giúp chống lại hiện tượng "1-vote wonder" (1 lượt vote điểm cao đánh bại nhiều lượt vote)
    function getBayesianScore(tone) {
      const v = tone.count || 1; // Số lượt vote thực tế
      const m = 3; // Cần tối thiểu 3 vote để được coi là "uy tín"
      const C = 60; // Điểm Baseline trung bình (Mặc định kéo xuống 60 nếu ít vote)
      
      // Công thức: (v / (v+m)) * Vote + (m / (v+m)) * Baseline
      return ((v / (v + m)) * (tone.vote || 0)) + ((m / (v + m)) * C);
    }

    mergedTones.sort((a, b) => {
      const scoreA = getBayesianScore(a);
      const scoreB = getBayesianScore(b);
      
      // Nếu điểm Bayesian bằng nhau, ưu tiên count nhiều hơn
      if (Math.abs(scoreB - scoreA) < 0.1) {
        return (b.count || 1) - (a.count || 1);
      }
      return scoreB - scoreA;
    });

    // Xóa tiền tố thông báo "(55)" nếu có, nhưng giữ nguyên 100% nội dung gốc của Title
    const originalTitle = rawTitle ? rawTitle.replace(/^\(\d+\)\s*/, '') : rawTitle;
    
    const payload = {
      file_hash: fileHash,
      title: originalTitle, // Giữ nguyên mẫu tiêu đề gốc (Ví dụ: "Bài Hát A - Ca Sĩ B - YouTube")
      artist: null, // Tạm thời để trống chờ hệ thống LLM sau này xử lý
      singer: null, 
      tones: mergedTones, // Mảng JSONB đã cộng dồn
      analysis_version: analysisVersion,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('audio_analysis')
      .upsert(payload, { onConflict: 'file_hash' }); // upsert: Có thì cập nhật, chưa có thì thêm mới

    if (error) {
      const msg = `⚠️ [Supabase] Lỗi khi lưu dữ liệu: ${error.message}`;
      if (window.electronAPI?.logDebug) window.electronAPI.logDebug(msg);
      console.warn(msg);
      return false;
    }
    return true;
  } catch (err) {
    const msg = `❌ [Supabase] Lỗi mạng khi lưu dữ liệu: ${err.message}`;
    if (window.electronAPI?.logDebug) window.electronAPI.logDebug(msg);
    console.error(msg);
    return false;
  }
}
