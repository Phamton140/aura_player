import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

const YouTubeSearch: React.FC = () => {
  const { setSearchResults } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ── Helper to Clean Title ────────────────────────────────────────────────
  const cleanTitle = (title: string, artist: string) => {
    // Common separators in YouTube titles
    const separators = [' - ', ' – ', ' — ', ': '];
    
    // Clean artist name (remove "VEVO", "Official", etc for matching)
    const cleanArtist = artist.replace(/VEVO|Official|Music|Channel/gi, '').trim().toLowerCase();

    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        const prefix = parts[0].toLowerCase();
        
        // If prefix matches or is contained in artist name (or vice versa)
        if (prefix.includes(cleanArtist) || cleanArtist.includes(prefix)) {
          // Return everything after the first separator
          return parts.slice(1).join(sep).trim();
        }
      }
    }
    
    // Fallback: If title starts with artist name but no separator
    if (title.toLowerCase().startsWith(cleanArtist) && title.length > cleanArtist.length) {
       return title.substring(cleanArtist.length).replace(/^[\s\-:\/]+/, '').trim();
    }

    return title;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    const formData = new FormData();
    formData.append('query', searchQuery);
    try {
      const response = await fetch('http://localhost:8000/api/audio/youtube/search', { method: 'POST', body: formData });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Apply title cleaning logic
        const cleanedData = data.map((video: any) => ({
          ...video,
          title: cleanTitle(video.title, video.channel)
        }));
        setSearchResults(cleanedData);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search Error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="aura-search-wrapper">
      <form className="aura-search-field" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Busca videos en AuraPlayer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="aura-search-input"
        />
        <button type="submit" className="aura-search-icon-btn" disabled={isSearching}>
          {isSearching ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
        </button>
      </form>
    </div>
  );
};

export default YouTubeSearch;
