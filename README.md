# playlist-generator

A web app to generate, save, and share custom Spotify playlists based on your mood or search queries.

## Features

- Generate playlists by mood or custom search
- Save, load, and manage multiple playlists
- Add/remove songs to a custom playlist per playlist
- Export playlists as JSON or CSV
- Import playlists from JSON
- Share playlists (copy to clipboard)
- Dark mode and responsive design

## How It Works

1. **Start the Backend**

   - Go to the `spotify-backend` folder.
   - Add your Spotify API credentials to a `.env` file:
     ```
     SPOTIFY_CLIENT_ID=your_client_id
     SPOTIFY_CLIENT_SECRET=your_client_secret
     ```
   - Run the backend:
     ```
     node server.cjs
     ```

2. **Open the Frontend**

   - Open `index.html` in your browser.

3. **Generate or Search for Songs**

   - Select a mood or use the search bar to find songs.
   - Use filters for genre, year, or popularity.

4. **Manage Playlists**

   - Create, save, load, or delete playlists.
   - Add or remove songs to the custom playlist for each playlist.

5. **Export, Import, and Share**
   - Export playlists as JSON/CSV.
   - Import playlists from JSON files.
   - Share the current playlist (copies to clipboard).

## Requirements

- Node.js (for backend)
- Spotify Developer Account (for API credentials)

## Notes

- The backend must be running for the app to fetch Spotify data.
- Each playlist has its own custom song list.
- All data is stored in your browser’s localStorage.
