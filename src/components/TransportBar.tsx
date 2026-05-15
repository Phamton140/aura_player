import React from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Repeat, Volume2, VolumeX, Maximize, Search, ListMusic
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import type { PlaybackState, Song } from '../types/music';

interface TransportBarProps {
  song: Song | null;
  playback: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (t: number) => void;
  onSpeedChange: (s: number) => void;
  onLoopToggle: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onFullscreen?: () => void;
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TransportBar: React.FC<TransportBarProps> = ({
  song, playback, onPlay, onPause, onSeek,
  onLoopToggle, onSkipBack, onSkipForward, onFullscreen
}) => {
  const { setPlayback, toggleMute, isSidebarOpen, setSidebarOpen, isQueueOpen, setQueueOpen } = useMusicStore();
  const duration = song?.totalDuration ?? 0;
  const pct = duration > 0 ? (playback.currentTime / duration) * 100 : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onSeek((v / 100) * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(e.target.value);
    setPlayback({ volume });
  };

  return (
    <div className="transport-bar" style={{ '--pct': `${pct}%` } as React.CSSProperties}>
      <div className="transport-timeline">
        <span className="time">{formatTime(playback.currentTime)}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={0.01}
          value={pct}
          onChange={handleScrub}
          className="scrubber"
          disabled={!song}
        />
        <span className="time">{formatTime(duration)}</span>
      </div>

      <div className="transport-main">
        <div className="song-info-mini">
          {song && (
            <>
              <div className="mini-thumb">
                {song.thumbnail && <img src={song.thumbnail} alt="" />}
              </div>
              <div className="mini-text">
                <div className="mini-title">{song.title}</div>
                <div className="mini-artist">{song.composer}</div>
              </div>
            </>
          )}
        </div>

        <div className="transport-controls">
          <button 
            className={`ctrl-btn hide-on-mobile ${isSidebarOpen ? 'active' : ''}`} 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            title="Resultados"
          >
            <Search size={20} />
          </button>

          <button className="ctrl-btn" onClick={onSkipBack}><SkipBack size={20} /></button>
          
          <button className="ctrl-btn main-play" onClick={playback.isPlaying ? onPause : onPlay}>
            {playback.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          
          <button className="ctrl-btn" onClick={onSkipForward}><SkipForward size={20} /></button>
          
          <button 
            className={`ctrl-btn hide-on-mobile ${isQueueOpen ? 'active' : ''}`} 
            onClick={() => setQueueOpen(!isQueueOpen)}
            title="Cola"
          >
            <ListMusic size={20} />
          </button>

          <button className={`ctrl-btn ${playback.isLooping ? 'active' : ''}`} onClick={onLoopToggle}>
            <Repeat size={18} />
          </button>
        </div>

        <div className="transport-extra">
          <div className="volume-mini-container">
            <button className="ctrl-btn volume-toggle-btn" onClick={toggleMute}>
              {playback.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="volume-track">
              <input 
                type="range" 
                min={0} 
                max={100} 
                value={playback.volume} 
                onChange={handleVolumeChange} 
                className="volume-slider-input"
              />
            </div>
          </div>
          <button className="ctrl-btn" onClick={onFullscreen}><Maximize size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default TransportBar;
