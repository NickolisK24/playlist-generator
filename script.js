// Full working script.js with CORS-safe backend integration and robust error handling

const moodToCategory = {
  chill: "lofi",
  happy: "pop",
  energetic: "edm",
  focus: "ambient",
  sad: "acoustic"
};

window.currentSongs = [];
window.customPlaylist = JSON.parse(localStorage.getItem("customPlaylist") || "[]");

function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists") || "{}");
}
function savePlaylists(playlists) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
function updatePlaylistSelect() {
  const playlists = getPlaylists();
  const select = document.getElementById("playlist-select");
  if (!select) return;
  select.innerHTML = "";
  Object.keys(playlists).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  if (select.options.length > 0) select.value = select.options[0].value;
}
function loadSelectedPlaylist() {
  const playlists = getPlaylists();
  const select = document.getElementById("playlist-select");
  const name = select.value;
  if (name && playlists[name]) {
    document.getElementById("playlist-name").value = playlists[name].name || name;
    document.getElementById("playlist-desc").value = playlists[name].desc || "";
    window.currentSongs = playlists[name].songs || [];
    displaySongs(window.currentSongs);
    showToast(`Loaded playlist "${name}"`);
  }
}
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return console.warn("Toast element not found", msg);
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}
function showError(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return console.error("Error:", msg);
  toast.textContent = `⚠️ ${msg}`;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 4000);
}
function showLoading(state) {
  const loading = document.getElementById("loading");
  if (!loading) return;
  loading.style.display = state ? "block" : "none";
}
function getFilters() {
  const genre = document.getElementById("genre-filter")?.value || "";
  const year = document.getElementById("year-filter")?.value || "";
  const popularity = document.getElementById("popularity-filter")?.value || "";
  return { genre, year, popularity };
}
async function getAccessToken() {
  const res = await fetch('https://spotify-token-server-xoem.onrender.com/token');
  const data = await res.json();
  if (!res.ok) throw new Error('Failed to get token');
  return data.access_token;
}
async function fetchSongs(query) {
  showLoading(true);
  try {
    const accessToken = await getAccessToken();
    let url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    let songs = data.tracks.items;
    const { genre, year, popularity } = getFilters();
    if (genre) songs = songs.filter(s => (s.genre || "").toLowerCase().includes(genre.toLowerCase()));
    if (year) songs = songs.filter(s => String(s.album.release_date).includes(year));
    if (popularity) songs = songs.filter(s => s.popularity >= Number(popularity));
    window.currentSongs = songs;
    displaySongs(songs);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generate")?.addEventListener("click", () => {
    const mood = document.getElementById("mood")?.value || "chill";
    fetchPlaylistForMood(mood);
  });
});

async function fetchPlaylistForMood(mood) {
  showLoading(true);
  try {
    const category = moodToCategory[mood.toLowerCase()];
    const token = await getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(category)}&type=playlist&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const playlistId = data.playlists.items[0]?.id;
    if (!playlistId) throw new Error("No playlist found");
    const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tracksData = await tracksRes.json();
    window.currentSongs = tracksData.items.map(i => i.track);
    displaySongs(window.currentSongs);
  } catch (e) {
    showError(e.message);
  } finally {
    showLoading(false);
  }
}

function displaySongs(songs) {
  const container = document.getElementById("playlist");
  if (!container) return;
  container.innerHTML = "";
  songs.forEach(track => {
    const div = document.createElement("div");
    div.className = "song";
    div.innerHTML = `
      <h3>${track.name}</h3>
      <p>${track.artists[0].name}</p>
      <a href="${track.external_urls.spotify}" target="_blank">Play on Spotify</a>
    `;
    container.appendChild(div);
  });
}
