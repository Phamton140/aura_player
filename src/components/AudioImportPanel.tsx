import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Music, Loader2, Search, Link as LinkIcon } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import type { AnalysisResult } from '../types/music';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: string;
}

const AudioImportPanel: React.FC = () => {
  const { setSong } = useMusicStore();
  const [result, setResult] = useState<AnalysisResult>({ status: 'idle', progress: 0, stage: '' });
  const [ytUrl, setYtUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [mode, setMode] = useState<'upload' | 'link' | 'search'>('search');
  const [isSearching, setIsSearching] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setResult({ status: 'processing', progress: 10, stage: 'Cargando audio...' });
    
    // Create a local preview song
    const songData = {
      id: Math.random().toString(36).substr(2, 9),
      title: file.name,
      composer: 'Archivo Local',
      tempo: 120,
      totalDuration: 300, // Placeholder, usually would use an audio element to get duration
    };
    
    setSong(songData);
    setResult({ status: 'success', progress: 100, stage: 'Cargado' });
    setTimeout(() => setResult({ status: 'idle', progress: 0, stage: '' }), 2000);
  }, [setSong]);

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : undefined;
  };

  const processUrl = async (url: string, title?: string, channel?: string, thumb?: string) => {
    const youtubeId = extractYoutubeId(url);
    if (!youtubeId) return;

    setResult({ status: 'processing', progress: 10, stage: 'Cargando video...' });
    
    const songData = {
      id: youtubeId,
      title: title || 'Video de YouTube',
      composer: channel || 'YouTube',
      tempo: 120,
      totalDuration: 3600, // Placeholder
      youtubeId,
      thumbnail: thumb
    };

    setSong(songData);
    setYtUrl('');
    setSearchResults([]);
    setResult({ status: 'success', progress: 100, stage: 'Cargado' });
    setTimeout(() => setResult({ status: 'idle', progress: 0, stage: '' }), 1000);
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
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac', '.m4a'] },
    multiple: false,
    disabled: result.status === 'processing'
  });

  return (
    <div className="import-panel">
      <div className="mode-selector">
        <button className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}>
          <Search size={14} /> Buscar
        </button>
        <button className={mode === 'link' ? 'active' : ''} onClick={() => setMode('link')}>
          <LinkIcon size={14} /> Link
        </button>
        <button className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}>
          <Music size={14} /> Subir
        </button>
      </div>

      {mode === 'upload' && (
        <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-over' : ''} ${result.status === 'processing' ? 'processing' : ''}`}>
          <input {...getInputProps()} />
          {result.status === 'idle' && (
            <>
              <Music className="icon-main" size={32} />
              <h4 className="drop-title">Arrastra o haz click</h4>
              <p className="drop-subtitle">Archivos locales MP3/WAV</p>
            </>
          )}
          {result.status === 'processing' && (
            <div className="analysis-progress">
              <Loader2 className="spin" size={24} />
              <div className="stage-label">{result.stage}</div>
            </div>
          )}
          {result.status === 'success' && <div className="success-message">¡Listo!</div>}
          {result.status === 'error' && <div className="error-message" onClick={(e) => { e.stopPropagation(); setResult({ status: 'idle', progress: 0, stage: '' }); }}>{result.error}</div>}
        </div>
      )}

      {mode === 'link' && result.status === 'idle' && (
        <form className="youtube-input-container" onSubmit={(e) => { e.preventDefault(); processUrl(ytUrl); }}>
          <input type="text" placeholder="Pegar URL de YouTube..." value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} className="youtube-url-input" />
          <button type="submit" className="youtube-submit-btn" disabled={!ytUrl.trim()}>Ir</button>
        </form>
      )}

      {mode === 'search' && result.status === 'idle' && (
        <div className="search-section">
          <form className="youtube-input-container" onSubmit={handleSearch}>
            <input type="text" placeholder="Artista o canción..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="youtube-url-input" />
            <button type="submit" className="youtube-submit-btn" disabled={isSearching}>
              {isSearching ? <Loader2 className="spin" size={14} /> : 'Buscar'}
            </button>
          </form>
          
          <div className="search-results">
            {Array.isArray(searchResults) && searchResults.map((video) => (
              <div key={video.id} className="search-item" onClick={() => processUrl(video.url, video.title, video.channel, video.thumbnail)}>
                <img src={video.thumbnail} alt={video.title} className="search-thumb" />
                <div className="search-info">
                  <div className="search-title">{video.title}</div>
                  <div className="search-channel">{video.channel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.status === 'processing' && mode !== 'upload' && (
        <div className="processing-overlay">
          <Loader2 className="spin" size={32} />
          <div className="stage-label">{result.stage}</div>
        </div>
      )}

      <div className="omr-notice">
        <Music size={12} />
        <span>Buscador inteligente de música</span>
      </div>
    </div>
  );
};

export default AudioImportPanel;
