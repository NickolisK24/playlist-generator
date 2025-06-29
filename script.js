const moodToCategory = {
  chill: "lofi",
  happy: "pop",
  energetic: "edm",
  focus: "ambient",
  sad: "acoustic"
};

// --- GLOBAL STATE ---
window.currentSongs = [];
window.customPlaylist = JSON.parse(localStorage.getItem("customPlaylist") || "[]");

// --- GLOBAL HELPERS ---
function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists") || "{}");
}
function savePlaylists(playlists) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
function updatePlaylistSelect() {
  const playlists = getPlaylists();
  const select = document.getElementById("playlist-select");
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
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// --- UI SETUP ---
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn.style.display = "inline-block";
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    btn.textContent = document.body.classList.contains("dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    btn.textContent = "☀️ Light Mode";
  }
}

function setupToast() {
  // --- TOAST NOTIFICATION ---
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
  }
}

function setupBackToTop() {
  // --- BACK TO TOP BUTTON ---
  (function backToTop() {
    const btn = document.getElementById("back-to-top");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 200) btn.classList.add("show");
      else btn.classList.remove("show");
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  })();
}

function setupSearchBar() {
  // --- SEARCH BAR ---
  (function addSearchBar() {
    const searchDiv = document.createElement("div");
    searchDiv.style.marginBottom = "10px";
    searchDiv.innerHTML = `
      <input type="text" id="search" placeholder="Search for songs or artists..." style="width:70%;" aria-label="Search for songs or artists" />
      <button id="search-btn" aria-label="Search">🔍</button>
    `;
    document.querySelector(".container").insertBefore(searchDiv, document.querySelector("h1").nextSibling);

    document.getElementById("search-btn").addEventListener("click", () => {
      const query = document.getElementById("search").value.trim();
      if (query) {
        fetchSongs(query);
      }
    });
    document.getElementById("search").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("search-btn").click();
    });
  })();
}

function setupPlaylistManagement() {
  // --- MULTI-PLAYLIST SUPPORT ---
  function getPlaylists() {
    return JSON.parse(localStorage.getItem("playlists") || "{}");
  }
  function savePlaylists(playlists) {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }
  function updatePlaylistSelect() {
    const playlists = getPlaylists();
    const select = document.getElementById("playlist-select");
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
  document.getElementById("playlist-select").addEventListener("change", loadSelectedPlaylist);
  document.getElementById("new-playlist").addEventListener("click", () => {
    const name = prompt("New playlist name?");
    if (!name) return;
    const playlists = getPlaylists();
    if (playlists[name]) return showToast("Playlist already exists!");
    playlists[name] = { name, desc: "", songs: [] };
    savePlaylists(playlists);
    updatePlaylistSelect();
    document.getElementById("playlist-select").value = name;
    document.getElementById("playlist-name").value = name;
    document.getElementById("playlist-desc").value = "";
    window.currentSongs = [];
    displaySongs([]);
    showToast("Playlist created!");
  });
  document.getElementById("delete-playlist").addEventListener("click", () => {
    const select = document.getElementById("playlist-select");
    const name = select.value;
    if (!name) return;
    if (!confirm(`Delete playlist "${name}"?`)) return;
    const playlists = getPlaylists();
    delete playlists[name];
    savePlaylists(playlists);
    updatePlaylistSelect();
    if (Object.keys(playlists).length > 0) {
      document.getElementById("playlist-select").value = Object.keys(playlists)[0];
      loadSelectedPlaylist();
    } else {
      document.getElementById("playlist-name").value = "";
      document.getElementById("playlist-desc").value = "";
      window.currentSongs = [];
      displaySongs([]);
    }
    showToast("Playlist deleted!");
  });
}

function setupImportExportShare() {
  // --- EXPORT JSON ---
  document.getElementById("export-json").addEventListener("click", () => {
    const name = document.getElementById("playlist-name").value.trim() || "playlist";
    const data = {
      name,
      desc: document.getElementById("playlist-desc").value.trim(),
      songs: window.currentSongs || []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported as JSON!");
  });

  // --- EXPORT CSV ---
  document.getElementById("export-csv").addEventListener("click", () => {
    const name = document.getElementById("playlist-name").value.trim() || "playlist";
    const songs = window.currentSongs || [];
    if (!songs.length) return showError("No songs to export.");
    const csv = [
      ["Title", "Artist", "Album", "Spotify URL"].join(","),
      ...songs.map(s => [
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported as CSV!");
  });

  // --- IMPORT JSON ---
  document.getElementById("import-json").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.name || !Array.isArray(data.songs)) throw new Error("Invalid file");
        const playlists = getPlaylists();
        playlists[data.name] = data;
        savePlaylists(playlists);
        updatePlaylistSelect();
        document.getElementById("playlist-select").value = data.name;
        document.getElementById("playlist-name").value = data.name;
        document.getElementById("playlist-desc").value = data.desc || "";
        window.currentSongs = data.songs;
        displaySongs(window.currentSongs);
        showToast("Playlist imported!");
      } catch (err) {
        showError("Invalid playlist file.");
      }
    };
    reader.readAsText(file);
    this.value = "";
  });

  // --- SHARE PLAYLIST (copy to clipboard) ---
  document.getElementById("share").addEventListener("click", () => {
    const playlistName = document.getElementById("playlist-select").value;
    if (!playlistName) return showError("Select a playlist to share.");
    const playlists = getPlaylists();
    const playlist = playlists[playlistName];
    if (!playlist || !playlist.custom || !playlist.custom.length) return showError("No songs to share in this playlist.");
    const desc = document.getElementById("playlist-desc").value.trim();
    let text = `🎵 ${playlistName}\n${desc}\n\n` + playlist.custom.map((s, i) =>
      `${i + 1}. ${s.name} - ${s.artists[0].name}\n${s.external_urls.spotify}`
    ).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      showToast("Playlist copied to clipboard!");
    }, () => showError("Failed to copy playlist."));
  });
}

async function getAccessToken() {
  // Fetch the token from your backend
  const res = await fetch('http://localhost:3000/token');
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
  } catch (error) {
    showError(error.message);
    console.error(error);
  } finally {
    showLoading(false);
  }
}

// --- PLAYLIST DISPLAY ---
function displaySongs(songs) {
  const playlist = document.getElementById("playlist");
  playlist.innerHTML = "";

  // Playlist name/desc display
  const name = document.getElementById("playlist-name").value.trim();
  const desc = document.getElementById("playlist-desc").value.trim();
  if (name) {
    const title = document.createElement("h2");
    title.textContent = name;
    title.style.marginBottom = "2px";
    playlist.appendChild(title);
  }
  if (desc) {
    const d = document.createElement("div");
    d.textContent = desc;
    d.style.fontSize = "0.95em";
    d.style.color = "#7c5fe6";
    d.style.marginBottom = "10px";
    playlist.appendChild(d);
  }

  songs.forEach((track, idx) => {
    const songDiv = document.createElement("div");
    songDiv.className = "song";
    songDiv.tabIndex = 0;
    songDiv.setAttribute("role", "region");
    songDiv.setAttribute("aria-label", `${track.name} by ${track.artists[0].name}`);

    // Add audio preview if available
    let previewHtml = '';
    if (track.preview_url) {
      previewHtml = `
        <audio controls style="width: 100%; margin-top: 8px;" aria-label="Audio preview for ${track.name}">
          <source src="${track.preview_url}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
    } else {
      previewHtml = `<div style="color:#b0a1d4; font-size:0.9em; margin-top:8px;">No preview available</div>`;
    }

    // Add/remove from custom playlist (local)
    let inCustom = window.customPlaylist?.some(s => s.id === track.id);
    let actionBtn = `<button class="add-remove-btn" data-idx="${idx}" aria-label="${inCustom ? "Remove from" : "Add to"} custom playlist">${inCustom ? "➖ Remove" : "➕ Add"}</button>`;

    songDiv.innerHTML = `
      <img src="${track.album.images[0]?.url}" alt="Album Art for ${track.name}" style="max-width:90px; border-radius:8px;" />
      <h3 style="margin:8px 0 2px 0;">${track.name}</h3>
      <p style="margin:0 0 4px 0;">${track.artists[0].name}</p>
      <a href="${track.external_urls.spotify}" target="_blank" rel="noopener" aria-label="Open ${track.name} on Spotify">Play on Spotify</a>
      ${previewHtml}
      <div style="margin-top:8px;">${actionBtn}</div>
    `;

    playlist.appendChild(songDiv);
  });

  // Add event listeners for add/remove buttons
  document.querySelectorAll(".add-remove-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-idx"));
      toggleCustomPlaylist(songs[idx]);
      displaySongs(songs); // Refresh UI
    });
  });

  // Show custom playlist section
  showCustomPlaylist();
}

// --- CUSTOM PLAYLIST (add/remove songs) ---
function toggleCustomPlaylist(song) {
  const playlistName = document.getElementById("playlist-select").value;
  if (!playlistName) return showToast("Select a playlist first!");
  const playlists = getPlaylists();
  if (!playlists[playlistName]) return showToast("Playlist not found!");
  if (!playlists[playlistName].custom) playlists[playlistName].custom = [];
  const idx = playlists[playlistName].custom.findIndex(s => s.id === song.id);
  if (idx === -1) {
    playlists[playlistName].custom.push(song);
    showToast("Added to custom playlist!");
  } else {
    playlists[playlistName].custom.splice(idx, 1);
    showToast("Removed from custom playlist!");
  }
  savePlaylists(playlists);
  showCustomPlaylist();
}

function showCustomPlaylist() {
  let section = document.getElementById("custom-playlist-section");
  section.innerHTML = `<h2 style="margin-bottom:8px;">⭐ Your Custom Playlist</h2>`;
  const playlistName = document.getElementById("playlist-select").value;
  if (!playlistName) {
    section.innerHTML += `<div style="color:#b0a1d4;">Select a playlist to view its custom songs.</div>`;
    return;
  }
  const playlists = getPlaylists();
  const customList = playlists[playlistName]?.custom || [];
  if (!customList.length) {
    section.innerHTML += `<div style="color:#b0a1d4;">No songs added yet. Use "Add" to build your playlist!</div>`;
    return;
  }
  customList.forEach((track, idx) => {
    const div = document.createElement("div");
    div.className = "song";
    div.style.background = "#ede7fa";
    div.style.marginBottom = "8px";
    div.style.color = "#292929";
    div.innerHTML = `
      <img src="${track.album && track.album.images && track.album.images[0] ? track.album.images[0].url : 'https://via.placeholder.com/60x60?text=No+Art'}" alt="Album Art for ${track.name || 'Unknown'}" style="max-width:60px; border-radius:8px; margin-bottom:6px;" />
      <div style="font-weight:bold; font-size:1.05em; margin-bottom:2px;">${track.name || '<em>Unknown Title</em>'}</div>
      <div style="color:#7c5fe6; font-size:0.98em; margin-bottom:4px;">by ${track.artists && track.artists[0] ? track.artists[0].name : '<em>Unknown Artist</em>'}</div>
      <button class="remove-custom-btn" data-idx="${idx}" aria-label="Remove ${track.name || 'this song'} from custom playlist" style="margin-left:10px;">❌</button>
    `;
    section.appendChild(div);
  });
  // Remove buttons
  section.querySelectorAll(".remove-custom-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.getAttribute("data-idx"));
      const playlists = getPlaylists();
      playlists[playlistName].custom.splice(idx, 1);
      savePlaylists(playlists);
      showCustomPlaylist();
    });
  });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupToast();
  setupBackToTop();
  setupSearchBar();
  setupPlaylistManagement();
  setupImportExportShare();
  window.currentSongs = [];
  updatePlaylistSelect();
  if (document.getElementById("playlist-select").options.length > 0) {
    loadSelectedPlaylist();
  }
});

// --- Helper and Setup Functions ---
function showLoading(show = true) {
  let loader = document.getElementById("loading-indicator");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loading-indicator";
    loader.innerHTML = `<div class="spinner"></div><span style="margin-left:8px;">Loading...</span>`;
    loader.style.cssText = "display:flex;align-items:center;justify-content:center;margin:20px 0;color:#7c5fe6;";
    document.getElementById("playlist").parentNode.insertBefore(loader, document.getElementById("playlist"));
  }
  loader.style.display = show ? "flex" : "none";
}

function showError(msg) {
  showToast(msg);
}

function getFilters() {
  return {
    genre: document.getElementById("genre-filter").value,
    year: document.getElementById("year-filter").value,
    popularity: document.getElementById("popularity-filter").value
  };
}

// --- GENERATE PLAYLIST BY MOOD ---
document.getElementById("generate").addEventListener("click", () => {
  const mood = document.getElementById("mood").value;
  const query = moodToCategory[mood];
  fetchSongs(query);
});

// --- SAVE PLAYLIST (with name/desc) ---
document.getElementById("save").addEventListener("click", () => {
  const name = document.getElementById("playlist-name").value.trim();
  if (!name) return showError("Please enter a playlist name.");
  const desc = document.getElementById("playlist-desc").value.trim();
  const playlists = getPlaylists();
  playlists[name] = {
    name,
    desc,
    songs: window.currentSongs || []
  };
  savePlaylists(playlists);
  updatePlaylistSelect();
  document.getElementById("playlist-select").value = name;
  showToast("Playlist saved!");
});

// --- LOAD PLAYLIST (with name/desc) ---
document.getElementById("load").addEventListener("click", loadSelectedPlaylist);

// --- CLEAR PLAYLIST ---
document.getElementById("clear").addEventListener("click", () => {
  document.getElementById("playlist-name").value = "";
  document.getElementById("playlist-desc").value = "";
  window.currentSongs = [];
  displaySongs([]);
  showToast("Playlist cleared!");
});

// --- OPTIONAL: Simple spinner CSS ---
(function addSpinnerCSS() {
  const style = document.createElement("style");
  style.textContent = `
    body.dark { background: #18142a; color: #e6e6fa; }
    body.dark .song { background: #221c3a; }
    .spinner {
      border: 4px solid #eee;
      border-top: 4px solid #7c5fe6;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      animation: spin 1s linear infinite;
      display:inline-block;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .song:focus { outline: 2px solid #7c5fe6; }
  `;
  document.head.appendChild(style);
})();
