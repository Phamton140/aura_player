import React from 'react';
import { BookOpen, Music, ChevronRight } from 'lucide-react';
import type { Song } from '../types/music';
import { DEMO_SONGS } from '../data/demoSongs';

interface SongLibraryProps {
  currentSong: Song | null;
  onSelect: (song: Song) => void;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ currentSong, onSelect }) => {
  return (
    <div className="song-library">
      <div className="library-header">
        <BookOpen size={16} />
        <span>Videos Sugeridos</span>
      </div>

      <div className="library-list">
        {DEMO_SONGS.map((song) => {
          const isActive = currentSong?.id === song.id;
          return (
            <button
              key={song.id}
              className={`library-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(song)}
            >
              <div className="song-icon">
                {song.thumbnail ? (
                  <img src={song.thumbnail} alt="" className="library-thumb" />
                ) : (
                  <Music size={16} />
                )}
              </div>
              <div className="song-info">
                <p className="song-title">{song.title}</p>
                <p className="song-composer">{song.composer}</p>
              </div>
              {isActive && <ChevronRight size={14} className="active-arrow" />}
            </button>
          );
        })}
      </div>

      <div className="library-footer">
        <p>Busca más videos en el panel superior</p>
      </div>
    </div>
  );
};

export default SongLibrary;
