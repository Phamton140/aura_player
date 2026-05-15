import express from 'express';
import cors from 'cors';
import yts from 'yt-search';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In production on Hostinger, the 'dist' folder will be the static one
app.use(express.static(path.join(__dirname, 'dist')));

// --- YouTube Search Endpoint ---
app.post('/api/audio/youtube/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  console.log(`Searching for: ${query}`);

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 30);
    
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
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AuraPlayer Node Server running on port ${PORT}`);
});
