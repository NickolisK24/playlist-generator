require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

let cachedToken = null;
let tokenExpires = 0;

app.get('/token', async (req, res) => {
  const now = Date.now();
  if (cachedToken && now < tokenExpires) {
    return res.json({ access_token: cachedToken });
  }
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    const resp = await axios.post(
      'https://accounts.spotify.com/api/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        }
      }
    );
    cachedToken = resp.data.access_token;
    tokenExpires = now + (resp.data.expires_in - 60) * 1000;
    res.json({ access_token: cachedToken });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get Spotify token', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
