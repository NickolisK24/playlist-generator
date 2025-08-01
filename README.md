# playlist-generator

A web app to generate, save, and share custom Spotify playlists based on your mood or search queries.

## Features

- Generate playlists by mood or custom search
- Save, load, and manage multiple playlists
- Export playlists as JSON or CSV
- Import playlists from JSON
- Share playlists (copy to clipboard)
- Dark mode and responsive design

## How It Works

### 1. Backend (Render)

- The backend is deployed on Render and provides a `/token` endpoint for Spotify API access.
- You do **not** need to run the backend locally. The frontend fetches tokens from the Render backend.
- Make sure your Render backend is live and the endpoint URL is correct in your frontend code (e.g., `https://your-backend.onrender.com/token`).

### 2. Frontend (Vercel)

- The frontend is deployed on Vercel. Visit your Vercel URL in a browser to use the app.
- All features (playlist generation, search, save/load, export/import, share, etc.) are available in the web UI.

### 3. Usage

- **Generate or Search for Songs:** Use the mood selector or search bar to find songs.
- **Manage Playlists:** Create, save, load, or delete playlists. Each playlist is independent.
- **Export/Import:** Export playlists as JSON/CSV or import from JSON files.
- **Share:** Use the share button to copy the current playlist to your clipboard.
- **Dark Mode:** Toggle dark/light mode with the theme button.

## Requirements

- A deployed backend on Render (with valid Spotify credentials)
- A deployed frontend on Vercel (with the backend URL set correctly in the code)
- Modern web browser

## Notes

- All playlist data is stored in your browser’s localStorage.
- The backend must be live for Spotify features to work.
- If you change your backend URL, update it in your frontend code (`getAccessToken` function).
