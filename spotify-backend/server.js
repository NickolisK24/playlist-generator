const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

// Import fetch dynamically inside async function
async function fetchToken(url, options) {
  const { default: fetch } = await import('node-fetch');
  return fetch(url, options);
}

app.get('/token', async (req, res) => {
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetchToken('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (data.access_token) {
      res.json({ access_token: data.access_token, expires_in: data.expires_in });
    } else {
      res.status(500).json({ error: 'Failed to get token', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
 