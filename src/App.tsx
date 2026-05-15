import { useEffect, useRef, useCallback } from 'react';
import { useMusicStore } from './store/useMusicStore';
import TransportBar from './components/TransportBar';
import SongLibrary from './components/SongLibrary';
import VideoPlayer from './components/VideoPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import AudioImportPanel from './components/AudioImportPanel';
import type { Song } from './types/music';
import { Music, Sparkles, Menu, X, Play } from 'lucide-react';
import * as Tone from 'tone';

const TICK_INTERVAL = 16; // ms

function App() {
  const {
    song,
    playback,
    sidebarOpen,
    setSong,
    setPlayback,
    setSidebarOpen,
    seek
  } = useMusicStore();

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startWallRef = useRef<number>(0);
  const startSongRef = useRef<number>(0);

  // ── Playback tick ─────────────────────────────────────────────────────────
  const startTick = useCallback((fromTime: number) => {
    startWallRef.current = performance.now();
    startSongRef.current = fromTime;

    if (tickRef.current) clearInterval(tickRef.current);
    
    tickRef.current = setInterval(() => {
      const now = performance.now();
      const elapsed = (now - startWallRef.current) / 1000;
      let newTime = startSongRef.current + elapsed * playback.speed;

      if (!song) return;
      
      if (newTime >= song.totalDuration) {
        if (playback.isLooping) {
          startSongRef.current = 0;
          startWallRef.current = performance.now();
          setPlayback({ currentTime: 0 });
        } else {
          stopTick();
          setPlayback({ isPlaying: false, currentTime: song.totalDuration });
        }
        return;
      }
      
      setPlayback({ currentTime: newTime });
    }, TICK_INTERVAL);
  }, [playback.speed, playback.isLooping, song, setPlayback]);

  const stopTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    await Tone.start();
    if (!song) return;
    setPlayback({ isPlaying: true });
    startTick(playback.currentTime);
  }, [song, playback.currentTime, setPlayback, startTick]);

  const handlePause = useCallback(() => {
    stopTick();
    setPlayback({ isPlaying: false });
  }, [setPlayback]);

  const handleStop = useCallback(() => {
    stopTick();
    setPlayback({ isPlaying: false, currentTime: 0 });
  }, [setPlayback]);

  const handleSeek = useCallback((t: number) => {
    const wasPlaying = playback.isPlaying;
    if (wasPlaying) {
      stopTick();
    }
    seek(t);
    if (wasPlaying) {
      setTimeout(() => {
        startSongRef.current = t;
        startWallRef.current = performance.now();
        startTick(t);
      }, 50);
    }
  }, [playback.isPlaying, seek, startTick]);

  const handleSpeedChange = useCallback((speed: number) => {
    const wasPlaying = playback.isPlaying;
    if (wasPlaying) { stopTick(); }
    setPlayback({ speed });
    if (wasPlaying) {
      setTimeout(() => {
        startWallRef.current = performance.now();
        startSongRef.current = playback.currentTime;
        startTick(playback.currentTime);
      }, 50);
    }
  }, [playback.isPlaying, playback.currentTime, setPlayback, startTick]);

  const handleLoopToggle = useCallback(() => {
    setPlayback({ isLooping: !playback.isLooping });
  }, [playback.isLooping, setPlayback]);

  const handleSkipBack = useCallback(() => handleSeek(Math.max(0, playback.currentTime - 5)), [handleSeek, playback.currentTime]);
  const handleSkipForward = useCallback(() => handleSeek(Math.min(song?.totalDuration ?? 0, playback.currentTime + 5)), [handleSeek, playback.currentTime, song]);

  useEffect(() => {
    const resumeAudio = () => {
      if (Tone.getContext().state !== 'running') {
        Tone.getContext().resume();
      }
    };
    window.addEventListener('click', resumeAudio);
    return () => {
      stopTick();
      window.removeEventListener('click', resumeAudio);
    };
  }, []);

  // Sync state when coming back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && playback.isPlaying) {
        startWallRef.current = performance.now();
        startSongRef.current = playback.currentTime;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [playback.isPlaying, playback.currentTime]);

  const handleSongLoad = useCallback(async (newSong: Song) => {
    await Tone.start();
    setSong(newSong);
    setPlayback({ currentTime: 0, isPlaying: false });
    stopTick();
  }, [setSong, setPlayback]);

  return (
    <div className="app player-mode">
      <header className="app-header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="logo">
            <Music size={24} className="logo-icon" />
            <span className="logo-text">Aura<span className="logo-accent">Player</span><sup>AI</sup></span>
          </div>
        </div>
        <div className="header-center">
          <div className="search-bar-placeholder">
            <Sparkles size={13} /> Descubre y reproduce tus videos favoritos
          </div>
        </div>
        <div className="header-right">
          <div className="user-profile-mock">
            <div className="avatar">A</div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
          <div className="sidebar-section">
            <AudioImportPanel />
          </div>

          <div className="sidebar-divider"></div>

          <div className="song-library">
            <SongLibrary currentSong={song} onSelect={handleSongLoad} />
          </div>
        </aside>

        <main className="main-content">
          <div className="player-viewport">
            {song ? (
              <div className="video-container-wrapper">
                <ErrorBoundary>
                  <VideoPlayer />
                </ErrorBoundary>
                {!song.youtubeId && (
                  <div className="audio-only-view">
                    <div className="visualizer-mock">
                      <div className="bar" style={{height: '40%'}}></div>
                      <div className="bar" style={{height: '70%'}}></div>
                      <div className="bar" style={{height: '100%'}}></div>
                      <div className="bar" style={{height: '60%'}}></div>
                      <div className="bar" style={{height: '80%'}}></div>
                    </div>
                    <h2>{song.title}</h2>
                    <p>{song.composer}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-player">
                <div className="aura-glow"></div>
                <Play size={64} className="play-icon-bg" />
                <h2>Listo para reproducir</h2>
                <p>Busca un video en YouTube o selecciona uno de tu biblioteca</p>
              </div>
            )}
          </div>
          
          <TransportBar
            song={song}
            playback={playback}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
            onLoopToggle={handleLoopToggle}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
