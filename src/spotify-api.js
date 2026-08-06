/**
 * Tier 2: Spotify API — Lấy key/scale bài hát qua Client Credentials Flow
 */

let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Lấy access token từ Spotify (tự động cache và refresh)
 */
async function getAccessToken(clientId, clientSecret) {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify auth thất bại (${res.status}): ${err}`);
  }

  const data = await res.json();
  _cachedToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // buffer 60s
  return _cachedToken;
}

/**
 * Tìm track trên Spotify theo tên bài + ca sĩ
 * Trả về track ID hoặc null nếu không tìm thấy
 */
async function searchTrack(token, song, artist) {
  let q = song;
  if (artist) q += ` ${artist}`;

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1&market=VN`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Spotify search thất bại (${res.status})`);

  const data = await res.json();
  const items = data.tracks?.items;
  if (!items || items.length === 0) return null;
  return items[0].id;
}

/**
 * Lấy audio features của track theo ID
 * Spotify: key 0-11 (C=0), mode 1=Major / 0=Minor
 * App:     key 0-11 (C=0), scale 0=Major / 1=Minor
 */
async function getAudioFeatures(token, trackId) {
  const res = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Spotify audio features thất bại (${res.status})`);

  const data = await res.json();
  if (data.key === -1) return null; // Spotify trả -1 nếu không detect được key

  return {
    key: data.key,
    scale: data.mode === 1 ? 0 : 1, // Spotify mode: 1=Major → app scale: 0=Major
  };
}

/**
 * Hàm chính: lấy key/scale từ Spotify
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} song - Tên bài hát
 * @param {string} artist - Tên ca sĩ (tùy chọn)
 * @returns {Promise<{key: number, scale: number}|null>}
 */
export async function getKeyFromSpotify(clientId, clientSecret, song, artist = '') {
  if (!clientId || !clientSecret) {
    throw new Error('Chưa cấu hình Spotify Client ID / Secret trong Settings');
  }
  if (!song) throw new Error('Thiếu tên bài hát');

  const token = await getAccessToken(clientId, clientSecret);
  const trackId = await searchTrack(token, song, artist);
  if (!trackId) return null;

  return await getAudioFeatures(token, trackId);
}

/** Xóa cache token (dùng khi thay đổi credentials) */
export function clearSpotifyCache() {
  _cachedToken = null;
  _tokenExpiry = 0;
}
