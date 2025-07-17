// script.js

const playlistContainer = document.getElementById("playlist");
const loadingIndicator = document.getElementById("loading");
const toast = document.getElementById("toast");
const moodSelect = document.getElementById("mood-select");

const playlistSelect = document.getElementById("playlist-select");
let playlists = {};
let currentPlaylistName = "My Playlist";

const predefinedMoodSongs = {
  happy: [
    { title: "Happy", artist: "Pharrell Williams" },
    { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
    { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
  ],
  sad: [
    { title: "Someone Like You", artist: "Adele" },
    { title: "Fix You", artist: "Coldplay" },
    { title: "Skinny Love", artist: "Bon Iver" },
  ],
  energetic: [
    { title: "Eye of the Tiger", artist: "Survivor" },
    { title: "Stronger", artist: "Kanye West" },
    { title: "Don't Stop Me Now", artist: "Queen" },
  ],
  chill: [
    { title: "Lo-Fi Beats", artist: "Various Artists" },
    { title: "Sunset Lover", artist: "Petit Biscuit" },
    { title: "Coffee", artist: "beabadoobee" },
  ],
  romantic: [
    { title: "All of Me", artist: "John Legend" },
    { title: "Perfect", artist: "Ed Sheeran" },
    { title: "Just the Way You Are", artist: "Bruno Mars" },
  ],
  focus: [
    { title: "Weightless", artist: "Marconi Union" },
    { title: "Time", artist: "Hans Zimmer" },
    { title: "Merry Christmas Mr. Lawrence", artist: "Ryuichi Sakamoto" },
  ],
  party: [
    { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
    { title: "Yeah!", artist: "Usher" },
    { title: "Party Rock Anthem", artist: "LMFAO" },
  ]
};

function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

function setLoading(loading) {
  loadingIndicator.style.display = loading ? "block" : "none";
}

function clearPlaylistDisplay() {
  playlistContainer.innerHTML = "";
}

function renderPlaylist(songs) {
  clearPlaylistDisplay();
  songs.forEach((song, index) => {
    const div = document.createElement("div");
    div.className = "song-item";
    div.innerHTML = `<strong>${index + 1}. ${song.title}</strong> by ${song.artist}`;
    playlistContainer.appendChild(div);
  });
}

function savePlaylist(name, songs) {
  playlists[name] = songs;
  updatePlaylistSelect();
  localStorage.setItem("playlists", JSON.stringify(playlists));
  showToast("Playlist saved.");
}

function loadPlaylist(name) {
  const songs = playlists[name] || [];
  currentPlaylistName = name;
  renderPlaylist(songs);
}

function updatePlaylistSelect() {
  playlistSelect.innerHTML = "";
  Object.keys(playlists).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === currentPlaylistName) option.selected = true;
    playlistSelect.appendChild(option);
  });
}

function generatePlaylistFromMood(mood) {
  const moodSongs = predefinedMoodSongs[mood];
  if (!moodSongs || moodSongs.length === 0) {
    showToast("No songs found for selected mood.");
    return;
  }
  savePlaylist(currentPlaylistName, moodSongs);
  renderPlaylist(moodSongs);
}

function initApp() {
  const saved = localStorage.getItem("playlists");
  if (saved) {
    playlists = JSON.parse(saved);
    const names = Object.keys(playlists);
    if (names.length > 0) {
      currentPlaylistName = names[0];
    }
  } else {
    playlists[currentPlaylistName] = [];
  }
  updatePlaylistSelect();
  loadPlaylist(currentPlaylistName);
}

// Event listeners
document.getElementById("generate").addEventListener("click", () => {
  const mood = moodSelect.value;
  generatePlaylistFromMood(mood);
});

document.getElementById("save").addEventListener("click", () => {
  const current = playlists[currentPlaylistName] || [];
  savePlaylist(currentPlaylistName, current);
});

document.getElementById("load").addEventListener("click", () => {
  loadPlaylist(currentPlaylistName);
});

document.getElementById("clear").addEventListener("click", () => {
  playlists[currentPlaylistName] = [];
  renderPlaylist([]);
  showToast("Playlist cleared.");
});

document.getElementById("new-playlist").addEventListener("click", () => {
  const name = prompt("Enter a name for the new playlist:");
  if (name && !playlists[name]) {
    playlists[name] = [];
    currentPlaylistName = name;
    updatePlaylistSelect();
    loadPlaylist(name);
  } else {
    showToast("Invalid or duplicate name.");
  }
});

document.getElementById("delete-playlist").addEventListener("click", () => {
  if (confirm(`Delete playlist '${currentPlaylistName}'?`)) {
    delete playlists[currentPlaylistName];
    const names = Object.keys(playlists);
    currentPlaylistName = names.length > 0 ? names[0] : "My Playlist";
    if (!playlists[currentPlaylistName]) playlists[currentPlaylistName] = [];
    updatePlaylistSelect();
    loadPlaylist(currentPlaylistName);
  }
});

playlistSelect.addEventListener("change", (e) => {
  currentPlaylistName = e.target.value;
  loadPlaylist(currentPlaylistName);
});

// Export / Import / Share

document.getElementById("export-json").addEventListener("click", () => {
  const data = JSON.stringify(playlists);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playlists.json";
  a.click();
});

document.getElementById("export-csv").addEventListener("click", () => {
  let csv = "Playlist,Title,Artist\n";
  Object.entries(playlists).forEach(([name, songs]) => {
    songs.forEach((s) => {
      csv += `${name},"${s.title}","${s.artist}"\n`;
    });
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playlists.csv";
  a.click();
});

document.getElementById("import-json").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      playlists = JSON.parse(event.target.result);
      updatePlaylistSelect();
      loadPlaylist(currentPlaylistName);
      showToast("Playlists imported.");
    } catch {
      showToast("Invalid file format.");
    }
  };
  reader.readAsText(file);
});

document.getElementById("share").addEventListener("click", () => {
  const data = playlists[currentPlaylistName] || [];
  const text = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    showToast("Playlist copied to clipboard.");
  });
});

// Dark mode toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const btn = document.getElementById("theme-toggle");
  btn.textContent = document.body.classList.contains("dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// Back to top button
const backToTop = document.getElementById("back-to-top");
window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 300 ? "block" : "none";
});
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Search functionality
document.getElementById("search-btn").addEventListener("click", () => {
  const query = document.getElementById("search-input").value.toLowerCase();
  const current = playlists[currentPlaylistName] || [];
  const filtered = current.filter(song =>
    song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
  );
  renderPlaylist(filtered);
});

initApp();
