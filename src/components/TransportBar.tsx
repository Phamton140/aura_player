import React from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Repeat, Gauge, Music2
} from 'lucide-react';
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
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const TransportBar: React.FC<TransportBarProps> = ({
  song, playback, onPlay, onPause, onStop, onSeek,
  onSpeedChange, onLoopToggle, onSkipBack, onSkipForward
}) => {
  const duration = song?.totalDuration ?? 0;
  const pct = duration > 0 ? (playback.currentTime / duration) * 100 : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onSeek((v / 100) * duration);
  };

  return (
    <div className="transport-bar">
      {/* Song info */}
      <div className="transport-info">
        <Music2 size={16} className="transport-icon" />
        <div>
          <p className="transport-title">{song?.title ?? 'No hay video cargado'}</p>
          {song && (
            <p className="transport-meta">
              {song.composer ?? 'Desconocido'}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="transport-timeline">
        <span className="time-label">{formatTime(playback.currentTime)}</span>
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
        <span className="time-label">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="transport-controls">
        <button className="ctrl-btn" onClick={onSkipBack} disabled={!song} title="Retroceder 5s">
          <SkipBack size={18} />
        </button>

        <button className="ctrl-btn" onClick={onStop} disabled={!song} title="Parar">
          <Square size={18} />
        </button>

        {playback.isPlaying ? (
          <button className="ctrl-btn primary" onClick={onPause} disabled={!song} title="Pausa">
            <Pause size={22} />
          </button>
        ) : (
          <button className="ctrl-btn primary" onClick={onPlay} disabled={!song} title="Reproducir">
            <Play size={22} />
          </button>
        )}

        <button className="ctrl-btn" onClick={onSkipForward} disabled={!song} title="Adelantar 5s">
          <SkipForward size={18} />
        </button>

        <button
          className={`ctrl-btn ${playback.isLooping ? 'active' : ''}`}
          onClick={onLoopToggle}
          disabled={!song}
          title="Bucle"
        >
          <Repeat size={18} />
        </button>
      </div>

      {/* Speed control */}
      <div className="transport-options">
        <div className="speed-control">
          <Gauge size={14} />
          <select
            value={playback.speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-select"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TransportBar;
