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
    // genre removed because filtering by genre is unreliable with Spotify track search
    year: $("year-filter")?.value.trim() || "",
    popularity: $("popularity-filter")?.value.trim() || "",
    searchText: $("search-text")?.value.trim() || ""
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
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    btn.textContent = dark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("theme", dark ? "dark" : "light");
  });
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
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
    currentSongs = playlists[name].songs || [];
    displaySongs(currentSongs);
    showToast(`Loaded playlist "${name}"`);
  } else {
    showError("No playlist selected or playlist missing");
  }
}

// --- DISPLAY SONGS ---
function displaySongs(songs) {
  const container = $("playlist");
  container.innerHTML = "";
  if (songs.length === 0) {
    container.textContent = "No songs to display.";
    return;
  }
  songs.forEach(song => {
    const div = document.createElement("div");
    div.className = "song";
    div.innerHTML = `
      <img src="${song.album.images[0]?.url}" width="80" alt="Album cover" />
      <p><strong>${song.name}</strong><br>by ${song.artists.map(a => a.name).join(", ")}</p>
      <a href="${song.external_urls.spotify}" target="_blank" rel="noopener noreferrer">Spotify</a>
    `;
    container.appendChild(div);
  });
}

// --- FETCH SONGS ---
async function fetchSongs(query) {
  showLoading(true);
  try {
    if (!query) {
      showError("Please enter search text or select a mood.");
      showLoading(false);
      return;
    }
    const token = await getAccessToken();

    // Build Spotify search query:
    // The 'query' param is already passed (either mood category or search text)
    // Spotify search supports filters in the query string (year, etc.) but to keep things simple,
    // we'll do year and popularity filtering client-side.
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Spotify fetch error");
    const data = await res.json();
    const tracks = data.tracks.items;

    // Apply filters client-side
    const { year, popularity, searchText } = getFilters();

    let songs = tracks;

    // Filter by year (album release_date starting with year)
    if (year) {
      songs = songs.filter(s => s.album.release_date.startsWith(year));
    }

    // Filter by popularity (track.popularity >= filter)
    if (popularity) {
      songs = songs.filter(s => s.popularity >= parseInt(popularity));
    }

    // Filter by searchText (case-insensitive match in track name or artist names)
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      songs = songs.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) ||
        s.artists.some(artist => artist.name.toLowerCase().includes(lowerSearch))
      );
    }

    currentSongs = songs;
    displaySongs(currentSongs);
    if (songs.length === 0) showToast("No songs matched the filters.");
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

// --- EXPORT/IMPORT ---
function exportJSON() {
  if (!currentSongs.length) return showError("No songs to export");
  const name = $("playlist-select")?.value || "playlist";
  const data = { name, songs: currentSongs };
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
  const name = $("playlist-select")?.value || "playlist";
  const csv = [
    ["Title", "Artist", "Album", "Spotify URL"].join(","),
    ...currentSongs.map(s => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.artists.map(a => a.name).join(", ").replace(/"/g, '""')}"`,
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
      loadSelectedPlaylist();
      showToast("Playlist imported");
    } catch {
      showError("Invalid JSON playlist file");
    }
  };
  reader.readAsText(file);
}

// --- PLAYLIST MANAGEMENT ---
function createNewPlaylist() {
  const playlists = getPlaylists();
  // Create a default unique playlist name
  let baseName = "New Playlist";
  let newName = baseName;
  let counter = 1;
  while (playlists[newName]) {
    newName = `${baseName} ${counter++}`;
  }
  playlists[newName] = { name: newName, songs: [] };
  savePlaylists(playlists);
  updatePlaylistSelect();
  $("playlist-select").value = newName;
  currentSongs = [];
  displaySongs([]);
  showToast(`Created playlist "${newName}"`);
}

function deleteSelectedPlaylist() {
  const playlists = getPlaylists();
  const sel = $("playlist-select");
  const name = sel.value;
  if (!name || !playlists[name]) {
    showError("No playlist selected");
    return;
  }
  if (!confirm(`Are you sure you want to delete the playlist "${name}"? This cannot be undone.`)) {
    return;
  }
  delete playlists[name];
  savePlaylists(playlists);
  updatePlaylistSelect();
  currentSongs = [];
  displaySongs([]);
  showToast(`Deleted playlist "${name}"`);
}

// --- SHARE PLAYLIST ---
function sharePlaylist() {
  const name = $("playlist-select")?.value;
  if (!name || !currentSongs.length) return showError("Nothing to share");
  const text = `🎵 Playlist: ${name}\n\n` + currentSongs.map((s, i) => `${i + 1}. ${s.name} - ${s.artists.map(a => a.name).join(", ")}\n${s.external_urls.spotify}`).join("\n\n");
  navigator.clipboard.writeText(text).then(() => showToast("Copied playlist to clipboard"), () => showError("Clipboard error"));
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  updatePlaylistSelect();
  if ($("playlist-select").options.length > 0) loadSelectedPlaylist();

  // New playlist and delete playlist buttons
  $("new-playlist")?.addEventListener("click", createNewPlaylist);
  $("delete-playlist")?.addEventListener("click", deleteSelectedPlaylist);

  // Generate playlist from mood or search text
  $("generate")?.addEventListener("click", () => {
    const mood = $("mood")?.value;
    const category = moodToCategory[mood];
    const searchText = $("search-text")?.value.trim();
    if (searchText) {
      fetchSongs(searchText);
    } else if (category) {
      fetchSongs(category);
    } else {
      showError("Please select a mood or enter search text");
    }
  });

  // Save/load/clear/export/import/share
  $("save")?.addEventListener("click", () => {
    const playlists = getPlaylists();
    const sel = $("playlist-select");
    if (!sel.value) return showError("No playlist selected");
    const name = sel.value;
    playlists[name] = { name, songs: currentSongs };
    savePlaylists(playlists);
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
});
