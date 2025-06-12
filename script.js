const moodToCategory = {
  chill: "lofi",
  happy: "pop",
  energetic: "edm",
  focus: "ambient",
  sad: "acoustic"
};

document.getElementById("generate").addEventListener("click", () => {
  const mood = document.getElementById("mood").value;
  const query = moodToCategory[mood];
  fetchSongs(query);
});

document.getElementById("save").addEventListener("click", () => {
  const playlist = document.getElementById("playlist").innerHTML;
  if (playlist.trim() === "") {
    alert("Generate a playlist before saving.");
    return;
  }
  // Save the current displayed songs as JSON for reloading
  // To do this, we'll store the array of songs currently shown
  // So first grab the song data from the DOM or keep a current playlist cache
  // Let's keep a global cache for the last fetched songs
  if (!window.currentSongs || window.currentSongs.length === 0) {
    alert("No playlist data to save. Generate a playlist first.");
    return;
  }
  localStorage.setItem("lastPlaylist", JSON.stringify(window.currentSongs));
  alert("Playlist saved! You can load it later.");
});

document.getElementById("load").addEventListener("click", () => {
  const saved = localStorage.getItem("lastPlaylist");

  if (saved) {
    try {
      const playlist = JSON.parse(saved);
      window.currentSongs = playlist;  // Update current cache
      displaySongs(playlist);
    } catch (err) {
      alert("Failed to load saved playlist.");
      console.error(err);
    }
  } else {
    alert("No saved playlist found.");
  }
});

document.getElementById("clear").addEventListener("click", () => {
  localStorage.removeItem("lastPlaylist");
  window.currentSongs = [];
  document.getElementById("playlist").innerHTML = "";
  alert("Playlist cleared!");
});

async function getAccessToken() {
  const res = await fetch('http://localhost:3000/token');
  const data = await res.json();
  if (!res.ok) throw new Error('Failed to get token');
  return data.access_token;
} 

async function fetchSongs(query) {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();

    window.currentSongs = data.tracks.items;  // Cache current fetched songs

    displaySongs(data.tracks.items);
  } catch (error) {
    alert(error.message);
    console.error(error);
  }
}

function displaySongs(songs) {
  const playlist = document.getElementById("playlist");
  playlist.innerHTML = "";

  songs.forEach(track => {
    const songDiv = document.createElement("div");
    songDiv.className = "song";

    songDiv.innerHTML = `
      <img src="${track.album.images[0]?.url}" alt="Album Art" />
      <h3>${track.name}</h3>
      <p>${track.artists[0].name}</p>
      <a href="${track.external_urls.spotify}" target="_blank">Play on Spotify</a>
    `;

    playlist.appendChild(songDiv);
  });
}

// Initialize currentSongs cache
window.currentSongs = [];
