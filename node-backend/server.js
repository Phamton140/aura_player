const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files if they exist in the 'static' folder
// (We will upload the 'dist' contents to a folder named 'static' or similar)
app.use(express.static(path.join(__dirname, 'static')));

// --- YouTube Search Endpoint ---
app.post('/api/audio/youtube/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  console.log(`Searching for: ${query}`);

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 30); // Top 30 results
    
    const results = videos.map(v => ({
      id: v.videoId,
      title: v.title,
      url: v.url,
      thumbnail: v.thumbnail,
      channel: v.author.name,
      duration: v.seconds
    }));

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

// Root fallback for SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AuraPlayer Node Server running on port ${PORT}`);
});
