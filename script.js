// --- CONFIG ---
const moodToCategory = {
  chill: "lofi",
  happy: "pop",
  energetic: "edm",
  focus: "ambient",
  sad: "acoustic"
};

// --- GLOBAL STATE ---
let currentSongs = [];
let customPlaylist = JSON.parse(localStorage.getItem("customPlaylist") || "[]");

// --- DOM HELPERS ---
const $ = id => document.getElementById(id);

// --- CORS-FRIENDLY TOKEN FETCH ---
async function getAccessToken() {
  try {
    const res = await fetch("https://spotify-token-server-xoem.onrender.com/token");
    const data = await res.json();
    if (!res.ok || !data.access_token) throw new Error("Token fetch failed");
    return data.access_token;
  } catch (err) {
    console.error("Token error:", err);
    showError("Failed to get access token");
    throw err;
  }
}

// --- FILTERS ---
function getFilters() {
  return {
    genre: $("genre-filter")?.value.trim() || "",
    year: $("year-filter")?.value.trim() || "",
    popularity: $("popularity-filter")?.value.trim() || ""
  };
}

// --- LOADING + ERROR DISPLAY ---
function showLoading(show) {
  const el = $("loading");
  if (el) el.style.display = show ? "block" : "none";
}

function showError(msg) {
  const el = $("toast") || document.createElement("div");
  el.id = "toast";
  el.textContent = msg;
  el.style = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#e44;color:#fff;padding:10px 20px;border-radius:8px;z-index:999;";
  document.body.appendChild(el);
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 4000);
}

function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}

// --- THEME TOGGLE ---
function setupThemeToggle() {
  const btn = $("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    btn.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    btn.textContent = "☀️ Light Mode";
  }
}

// --- PLAYLIST STORAGE ---
function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists") || "{}");
}
function savePlaylists(playlists) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
function updatePlaylistSelect() {
  const playlists = getPlaylists();
  const sel = $("playlist-select");
  sel.innerHTML = "";
  Object.keys(playlists).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  if (sel.options.length > 0) sel.value = sel.options[0].value;
}
function loadSelectedPlaylist() {
  const playlists = getPlaylists();
  const name = $("playlist-select").value;
  if (name && playlists[name]) {
    $("playlist-name").value = playlists[name].name || name;
    $("playlist-desc").value = playlists[name].desc || "";
    currentSongs = playlists[name].songs || [];
    displaySongs(currentSongs);
    showToast(`Loaded playlist "${name}"`);
  }
}

// --- DISPLAY SONGS ---
function displaySongs(songs) {
  const container = $("playlist");
  container.innerHTML = "";
  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "song";
    div.innerHTML = `
      <img src="${song.album.images[0]?.url}" width="80" />
      <p><strong>${song.name}</strong> by ${song.artists[0].name}</p>
      <a href="${song.external_urls.spotify}" target="_blank">Spotify</a>
    `;
    container.appendChild(div);
  });
}

// --- FETCH SONGS ---
async function fetchSongs(query) {
  showLoading(true);
  try {
    const token = await getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Spotify fetch error");
    const data = await res.json();
    const tracks = data.tracks.items;
    const { genre, year, popularity } = getFilters();
    let songs = tracks;
    if (genre) songs = songs.filter(s => (s.genre || '').includes(genre));
    if (year) songs = songs.filter(s => s.album.release_date.includes(year));
    if (popularity) songs = songs.filter(s => s.popularity >= parseInt(popularity));
    currentSongs = songs;
    displaySongs(currentSongs);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  updatePlaylistSelect();
  if ($("playlist-select").options.length > 0) loadSelectedPlaylist();

  $("generate")?.addEventListener("click", () => {
    const mood = $("mood").value;
    fetchSongs(mood);
  });

  $("save")?.addEventListener("click", () => {
    const playlists = getPlaylists();
    const name = $("playlist-name").value.trim() || "Untitled";
    const desc = $("playlist-desc").value.trim();
    playlists[name] = { name, desc, songs: currentSongs };
    savePlaylists(playlists);
    updatePlaylistSelect();
    showToast("Playlist saved!");
  });

  $("load")?.addEventListener("click", loadSelectedPlaylist);

  $("clear")?.addEventListener("click", () => {
    currentSongs = [];
    displaySongs([]);
    showToast("Playlist cleared!");
  });
});
