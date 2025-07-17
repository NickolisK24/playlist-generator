// script.js

const $ = (id) => document.getElementById(id);
let currentSongs = [];
let playlists = JSON.parse(localStorage.getItem("playlists") || "{}");
let activePlaylist = Object.keys(playlists)[0] || "My Playlist";

function showLoading(show) {
  $("loading").style.display = show ? "block" : "none";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function showError(msg) {
  alert("⚠️ " + msg);
}

function updatePlaylistDropdown() {
  const select = $("playlist-select");
  select.innerHTML = Object.keys(playlists)
    .map(
      (name) => `<option value="${name}" ${name === activePlaylist ? "selected" : ""}>${name}</option>`
    )
    .join("");
}

function savePlaylistsToStorage() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

function displaySongs(songs) {
  const container = $("playlist");
  container.innerHTML = songs
    .map(
      (track) => `
      <div class="song">
        <img src="${track.album.images[0]?.url || ""}" alt="cover" />
        <div>
          <strong>${track.name}</strong><br />
          <small>${track.artists.map((a) => a.name).join(", ")}</small>
        </div>
        <a href="${track.external_urls.spotify}" target="_blank">▶️</a>
      </div>`
    )
    .join("");
}

async function getAccessToken() {
  const res = await fetch("http://localhost:5000/token");
  const data = await res.json();
  return data.access_token;
}

async function generateMoodPlaylist() {
  showLoading(true);
  try {
    const token = await getAccessToken();
    const mood = $("mood-select").value || "happy";

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=playlist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) throw new Error("Mood playlist search failed");

    const playlistData = await res.json();
    const playlist = playlistData.playlists.items[0];
    if (!playlist) throw new Error("No playlist found for mood");

    const tracksRes = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!tracksRes.ok) throw new Error("Tracks fetch failed");

    const trackData = await tracksRes.json();
    currentSongs = trackData.items
      .map(item => item.track)
      .filter(track => track);

    displaySongs(currentSongs);
    showToast(`Playlist generated for mood: ${mood}`);
  } catch (err) {
    showError(err.message || "Could not generate playlist");
  } finally {
    showLoading(false);
  }
}

function saveCurrentPlaylist() {
  playlists[activePlaylist] = currentSongs;
  savePlaylistsToStorage();
  showToast("Playlist saved");
}

function loadSavedPlaylist() {
  currentSongs = playlists[activePlaylist] || [];
  displaySongs(currentSongs);
}

function clearPlaylist() {
  currentSongs = [];
  displaySongs([]);
}

function exportToJSON() {
  const blob = new Blob([JSON.stringify(currentSongs)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playlist.json";
  a.click();
  URL.revokeObjectURL(url);
}

function exportToCSV() {
  const header = "Title,Artist,URL\n";
  const rows = currentSongs
    .map((t) => `${t.name},${t.artists.map((a) => a.name).join(" ")},${t.external_urls.spotify}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playlist.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function importPlaylist() {
  $("import-file").click();
}

$("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      currentSongs = JSON.parse(reader.result);
      displaySongs(currentSongs);
    } catch {
      showError("Invalid JSON");
    }
  };
  reader.readAsText(file);
});

function sharePlaylist() {
  const text = currentSongs
    .map((s) => `${s.name} - ${s.artists.map((a) => a.name).join(", ")}`)
    .join("\n");
  navigator.clipboard.writeText(text).then(() => {
    showToast("Playlist copied to clipboard!");
  });
}

$("generate").onclick = generateMoodPlaylist;
$("save").onclick = saveCurrentPlaylist;
$("load").onclick = loadSavedPlaylist;
$("clear").onclick = clearPlaylist;
$("export-json").onclick = exportToJSON;
$("export-csv").onclick = exportToCSV;
$("import-json").onclick = importPlaylist;
$("share").onclick = sharePlaylist;

$("new-playlist").onclick = () => {
  const name = prompt("Enter new playlist name");
  if (name && !playlists[name]) {
    playlists[name] = [];
    activePlaylist = name;
    updatePlaylistDropdown();
    savePlaylistsToStorage();
    loadSavedPlaylist();
  }
};

$("delete-playlist").onclick = () => {
  if (confirm("Delete current playlist?")) {
    delete playlists[activePlaylist];
    const names = Object.keys(playlists);
    activePlaylist = names[0] || "My Playlist";
    updatePlaylistDropdown();
    savePlaylistsToStorage();
    loadSavedPlaylist();
  }
};

$("playlist-select").onchange = (e) => {
  activePlaylist = e.target.value;
  loadSavedPlaylist();
};

document.addEventListener("DOMContentLoaded", () => {
  updatePlaylistDropdown();
  loadSavedPlaylist();
});

window.addEventListener("scroll", () => {
  $("back-to-top").style.display = window.scrollY > 300 ? "block" : "none";
});

$("back-to-top").onclick = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
