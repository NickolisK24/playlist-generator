const $ = (id) => document.getElementById(id);

let token = "";
let currentPlaylist = [];
let playlists = {};
let currentPlaylistName = "My Playlist";

// Fetch access token on load
async function fetchToken() {
  try {
    const res = await fetch("http://localhost:5000/token");
    const data = await res.json();
    token = data.access_token;
  } catch (err) {
    showError("Failed to fetch token.");
    console.error(err);
  }
}

function showError(message) {
  const toast = $("toast");
  if (toast) {
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 3000);
  } else {
    alert(message);
  }
}

// Search Spotify
async function fetchSongs(query) {
  if (!token) await fetchToken();
  if (!query) return;

  $("loading").style.display = "block";
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    const tracks = data.tracks?.items || [];
    displayTracks(tracks);
  } catch (err) {
    console.error("Search error:", err);
    showError("Failed to fetch songs.");
  } finally {
    $("loading").style.display = "none";
  }
}

// Display tracks in UI
function displayTracks(tracks) {
  const container = $("playlist");
  container.innerHTML = "";
  currentPlaylist = [];

  tracks.forEach((track) => {
    const div = document.createElement("div");
    div.className = "track";

    div.innerHTML = `
      <img src="${track.album.images[0]?.url || ""}" alt="Album Art" />
      <div class="track-info">
        <strong>${track.name}</strong><br />
        ${track.artists.map((a) => a.name).join(", ")}
      </div>
      <a href="${track.external_urls.spotify}" target="_blank">🎧</a>
    `;

    container.appendChild(div);
    currentPlaylist.push(track);
  });

  playlists[currentPlaylistName] = currentPlaylist;
  updatePlaylistDropdown();
}

// Save to localStorage
function savePlaylist() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showToast("Playlist saved!");
}

// Load from localStorage
function loadPlaylists() {
  const stored = JSON.parse(localStorage.getItem("playlists") || "{}");
  playlists = stored;
  updatePlaylistDropdown();
}

// Update dropdown
function updatePlaylistDropdown() {
  const select = $("playlist-select");
  select.innerHTML = "";

  Object.keys(playlists).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === currentPlaylistName) option.selected = true;
    select.appendChild(option);
  });
}

// Show toast
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2500);
}

// Share playlist
function sharePlaylist() {
  const urls = currentPlaylist.map((t) => t.external_urls.spotify).join("\n");
  navigator.clipboard.writeText(urls).then(() => {
    showToast("Playlist copied to clipboard!");
  });
}

// Export as JSON
function exportJSON() {
  const dataStr = JSON.stringify(currentPlaylist, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentPlaylistName}.json`;
  a.click();
}

// Export as CSV
function exportCSV() {
  const csv = currentPlaylist
    .map((t) => `${t.name},"${t.artists.map((a) => a.name).join(", ")}",${t.external_urls.spotify}`)
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentPlaylistName}.csv`;
  a.click();
}

// Import playlist from JSON file
function importJSON() {
  const file = $("import-file").files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      currentPlaylist = data;
      playlists[currentPlaylistName] = data;
      displayTracks(data);
      showToast("Playlist imported!");
    } catch (err) {
      showError("Failed to import playlist.");
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchToken();
  loadPlaylists();
  updatePlaylistDropdown();

  $("generate-btn")?.addEventListener("click", async () => {
    const mood = $("mood-select")?.value;
    if (!mood) return showError("Please select a mood");
    await fetchSongs(mood);
    showToast(`Generated "${mood}" playlist`);
  });

  $("search-btn")?.addEventListener("click", async () => {
    const query = $("search-input").value.trim();
    await fetchSongs(query);
  });

  $("save")?.addEventListener("click", savePlaylist);
  $("load")?.addEventListener("click", () => {
    const name = $("playlist-select").value;
    if (name && playlists[name]) {
      currentPlaylistName = name;
      currentPlaylist = playlists[name];
      displayTracks(currentPlaylist);
    }
  });

  $("new-playlist")?.addEventListener("click", () => {
    const name = prompt("Name for new playlist:");
    if (name && !playlists[name]) {
      playlists[name] = [];
      currentPlaylistName = name;
      currentPlaylist = [];
      updatePlaylistDropdown();
      $("playlist").innerHTML = "";
    } else {
      showError("Invalid or duplicate name.");
    }
  });

  $("delete-playlist")?.addEventListener("click", () => {
    const name = $("playlist-select").value;
    if (name && playlists[name]) {
      if (confirm(`Delete playlist "${name}"?`)) {
        delete playlists[name];
        if (name === currentPlaylistName) {
          currentPlaylistName = Object.keys(playlists)[0] || "My Playlist";
          currentPlaylist = playlists[currentPlaylistName] || [];
        }
        updatePlaylistDropdown();
        displayTracks(currentPlaylist);
      }
    }
  });

  $("export-json")?.addEventListener("click", exportJSON);
  $("export-csv")?.addEventListener("click", exportCSV);
  $("import-json")?.addEventListener("click", () => $("import-file").click());
  $("import-file")?.addEventListener("change", importJSON);
  $("share")?.addEventListener("click", sharePlaylist);

  window.addEventListener("scroll", () => {
    $("back-to-top").style.display = window.scrollY > 200 ? "block" : "none";
  });
  $("back-to-top").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
});
