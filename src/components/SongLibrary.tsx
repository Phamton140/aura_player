import React from 'react';
import { Music, Play } from 'lucide-react';
import type { Song } from '../types/music';
import { DEMO_SONGS } from '../data/demoSongs';

interface SongLibraryProps {
  currentSong: Song | null;
  onSelect: (song: Song) => void;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ currentSong, onSelect }) => {
  return (
    <div className="youtube-library-list">
      {DEMO_SONGS.map((song) => {
        const isActive = currentSong?.id === song.id;
        return (
          <button
            key={song.id}
            className={`yt-library-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(song)}
          >
            <div className="yt-song-thumb-container">
              {song.thumbnail ? (
                <img src={song.thumbnail} alt="" className="yt-library-thumb" />
              ) : (
                <div className="yt-thumb-placeholder"><Music size={16} /></div>
              )}
              {isActive && <div className="yt-playing-overlay"><Play size={12} fill="white" /></div>}
            </div>
            <div className="yt-song-info">
              <p className="yt-song-title">{song.title}</p>
              <p className="yt-song-channel">{song.composer}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SongLibrary;
