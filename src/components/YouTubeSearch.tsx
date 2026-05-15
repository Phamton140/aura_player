import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

const YouTubeSearch: React.FC = () => {
  const { setSearchResults } = useMusicStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    const formData = new FormData();
    formData.append('query', searchQuery);
    try {
      const response = await fetch('http://localhost:8000/api/audio/youtube/search', { method: 'POST', body: formData });
      const data = await response.json();
      console.log('Search Results:', data);
      setSearchResults(Array.isArray(data) ? data : []);
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
