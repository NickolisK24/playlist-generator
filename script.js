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

// --- EXPORT/IMPORT ---
function exportJSON() {
  const name = $("playlist-name").value.trim() || "playlist";
  const data = { name, desc: $("playlist-desc").value.trim(), songs: currentSongs };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported JSON");
}

function exportCSV() {
  if (!currentSongs.length) return showError("No songs to export");
  const name = $("playlist-name").value.trim() || "playlist";
  const csv = [
    ["Title", "Artist", "Album", "Spotify URL"].join(","),
    ...currentSongs.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.artists[0].name.replace(/"/g, '""')}"`,
      `"${s.album.name.replace(/"/g, '""')}"`,
      s.external_urls.spotify
    ].join(","))
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/\s+/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exported CSV");
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.name || !Array.isArray(data.songs)) throw new Error("Invalid file");
      const playlists = getPlaylists();
      playlists[data.name] = data;
      savePlaylists(playlists);
      updatePlaylistSelect();
      $("playlist-select").value = data.name;
      $("playlist-name").value = data.name;
      $("playlist-desc").value = data.desc || "";
      currentSongs = data.songs;
      displaySongs(currentSongs);
      showToast("Playlist imported");
    } catch {
      showError("Invalid JSON playlist file");
    }
  };
  reader.readAsText(file);
}

function sharePlaylist() {
  const name = $("playlist-name").value.trim();
  if (!name || !currentSongs.length) return showError("Nothing to share");
  const text = `🎵 ${name}\n\n` + currentSongs.map((s, i) => `${i + 1}. ${s.name} - ${s.artists[0].name}\n${s.external_urls.spotify}`).join("\n\n");
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard"), () => showError("Clipboard error"));
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  updatePlaylistSelect();
  if ($("playlist-select").options.length > 0) loadSelectedPlaylist();

  $("generate")?.addEventListener("click", () => {
    const mood = $("mood").value;
    const category = moodToCategory[mood];
    if (category) fetchSongs(category);
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
    showToast("Playlist cleared");
  });

  $("export-json")?.addEventListener("click", exportJSON);
  $("export-csv")?.addEventListener("click", exportCSV);
  $("import-json")?.addEventListener("click", () => $("import-file").click());
  $("import-file")?.addEventListener("change", e => {
    if (e.target.files[0]) importJSON(e.target.files[0]);
  });
  $("share")?.addEventListener("click", sharePlaylist);

  // --- NEW + DELETE PLAYLIST BUTTONS ---
  $("new-playlist")?.addEventListener("click", () => {
    const name = prompt("Enter new playlist name:").trim();
    if (!name) return;
    const playlists = getPlaylists();
    if (playlists[name]) return showError("Playlist already exists");
    playlists[name] = { name, desc: "", songs: [] };
    savePlaylists(playlists);
    updatePlaylistSelect();
    $("playlist-select").value = name;
    $("playlist-name").value = name;
    $("playlist-desc").value = "";
    currentSongs = [];
    displaySongs([]);
    showToast("New playlist created");
  });

  $("delete-playlist")?.addEventListener("click", () => {
    const sel = $("playlist-select");
    const name = sel.value;
    if (!name) return;
    if (!confirm(`Delete playlist "${name}"?`)) return;
    const playlists = getPlaylists();
    delete playlists[name];
    savePlaylists(playlists);
    updatePlaylistSelect();
    if ($("playlist-select").options.length > 0) {
      loadSelectedPlaylist();
    } else {
      $("playlist-name").value = "";
      $("playlist-desc").value = "";
      currentSongs = [];
      displaySongs([]);
    }
    showToast("Playlist deleted");
  });
});
