import { useEffect, useRef, useCallback, useState } from 'react';
import { useMusicStore } from './store/useMusicStore';
import TransportBar from './components/TransportBar';
import VideoPlayer from './components/VideoPlayer';
import ErrorBoundary from './components/ErrorBoundary';
import YouTubeSearch from './components/YouTubeSearch';
import { X, Play, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import * as Tone from 'tone';

const TICK_INTERVAL = 16; // ms

function App() {
  const {
    song,
    playback,
    searchResults,
    queue,
    isSidebarOpen,
    isQueueOpen,
    setSong,
    setPlayback,
    setSidebarOpen,
    setQueueOpen,
    addToQueue,
    removeFromQueue,
    toggleMute,
    seek
  } = useMusicStore();

  const [notification, setNotification] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startWallRef = useRef<number>(0);
  const startSongRef = useRef<number>(0);
  const appContainerRef = useRef<HTMLDivElement>(null);

  // ── Toast Notification Logic ─────────────────────────────────────────────
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Search Logic (Global) ────────────────────────────────────────────────
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : undefined;
  };

  const handleSelectVideo = useCallback(async (video: any) => {
    const youtubeId = extractYoutubeId(video.url);
    if (!youtubeId) return;

    const songData = {
      id: youtubeId,
      title: video.title || 'Video de YouTube',
      composer: video.channel || 'YouTube',
      tempo: 120,
      totalDuration: video.duration || 3600, 
      youtubeId,
      thumbnail: video.thumbnail
    };

    await Tone.start();
    setSong(songData);
    setPlayback({ currentTime: 0, isPlaying: true });
    showNotification(`Reproduciendo: ${songData.title}`);
  }, [setSong, setPlayback]);

  const handleAddToQueue = useCallback((video: any) => {
    const youtubeId = extractYoutubeId(video.url);
    if (!youtubeId) return;

    const songData = {
      id: youtubeId,
      title: video.title || 'Video de YouTube',
      composer: video.channel || 'YouTube',
      tempo: 120,
      totalDuration: video.duration || 3600, 
      youtubeId,
      thumbnail: video.thumbnail
    };
    addToQueue(songData);
    showNotification(`Añadido a la cola: ${songData.title}`);
  }, [addToQueue]);

  // ── Playback tick ─────────────────────────────────────────────────────────
  const startTick = useCallback((fromTime: number) => {
    if (song?.youtubeId) return;
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
    if (!song.youtubeId) startTick(playback.currentTime);
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
    if (wasPlaying) stopTick();
    seek(t);
    if (wasPlaying && !song?.youtubeId) {
      setTimeout(() => {
        startSongRef.current = t;
        startWallRef.current = performance.now();
        startTick(t);
      }, 500);
    }
  }, [playback.isPlaying, seek, startTick, song?.youtubeId]);

  const handleLoopToggle = useCallback(() => setPlayback({ isLooping: !playback.isLooping }), [playback.isLooping, setPlayback]);
  const handleSkipBack = useCallback(() => handleSeek(Math.max(0, playback.currentTime - 5)), [handleSeek, playback.currentTime]);
  const handleSkipForward = useCallback(() => handleSeek(Math.min(song?.totalDuration ?? 0, playback.currentTime + 5)), [handleSeek, playback.currentTime, song]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    toggleMute();
    const isMuted = playback.volume === 0;
    showNotification(isMuted ? "Sonido Activado" : "Silenciado");
  }, [playback.volume, toggleMute]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
        case 'p':
          e.preventDefault();
          playback.isPlaying ? handlePause() : handlePlay();
          break;
        case 'm':
          handleToggleMute();
          break;
        case 'f':
          handleToggleFullscreen();
          break;
        case 'j':
        case 'arrowleft':
          handleSkipBack();
          break;
        case 'l':
        case 'arrowright':
          handleSkipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          const newVolUp = Math.min(100, playback.volume + 10);
          setPlayback({ volume: newVolUp });
          showNotification(`Volumen: ${newVolUp}%`);
          break;
        case 'arrowdown':
          e.preventDefault();
          const newVolDown = Math.max(0, playback.volume - 10);
          setPlayback({ volume: newVolDown });
          showNotification(`Volumen: ${newVolDown}%`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playback.isPlaying, playback.volume, handlePlay, handlePause, handleToggleMute, handleToggleFullscreen, handleSkipBack, handleSkipForward, setPlayback]);

  useEffect(() => {
    const resumeAudio = () => {
      if (Tone.getContext().state !== 'running') Tone.getContext().resume();
    };
    window.addEventListener('click', resumeAudio);
    return () => {
      stopTick();
      window.removeEventListener('click', resumeAudio);
    };
  }, []);

  return (
    <div className="app aura-player-v2" ref={appContainerRef}>
      <div className="aura-ambient-bg">
        {song?.thumbnail && <img src={song.thumbnail} alt="" className="aura-blur-img" />}
      </div>

      <header className="aura-header">
        <div className="aura-left">
          <div className="aura-brand" onClick={() => setSong(null)}>
            <div className="brand-dot"></div>
            <span>AuraPlayer</span>
          </div>
        </div>
        <div className="aura-center">
          <YouTubeSearch />
        </div>
        <div className="aura-right">
          <div className="aura-user-token">A</div>
        </div>
      </header>

      {notification && (
        <div className="aura-toast">
          <CheckCircle2 size={18} className="aura-toast-icon" />
          <span>{notification}</span>
        </div>
      )}

      {/* Results Sidebar (Left) */}
      {isSidebarOpen && searchResults.length > 0 && (
        <div className="aura-search-sidebar left">
          <div className="aura-sidebar-header">
            <h3>Resultados</h3>
            <button className="aura-close-sidebar" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="aura-results-scrollable">
            {searchResults
              .filter((video) => video.duration !== null)
              .map((video) => (
              <div key={video.id} className="aura-result-item-compact">
                <div className="aura-result-thumb-compact">
                  {video.thumbnail ? <img src={video.thumbnail} alt="" /> : <div className="aura-thumb-placeholder">No Thumb</div>}
                  <div className="aura-item-overlay">
                    <button className="aura-action-btn" onClick={() => handleSelectVideo(video)} title="Reproducir">
                      <Play size={18} fill="currentColor" />
                    </button>
                    <button className="aura-action-btn" onClick={() => handleAddToQueue(video)} title="Añadir a cola">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div className="aura-result-info-compact">
                  <div className="aura-result-title-compact">{video.title}</div>
                  <div className="aura-result-meta-compact">{video.channel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Sidebar (Right) */}
      {isQueueOpen && (
        <div className="aura-search-sidebar right">
          <div className="aura-sidebar-header">
            <h3>Mi Cola</h3>
            <button className="aura-close-sidebar" onClick={() => setQueueOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="aura-results-scrollable">
            {queue.length === 0 ? (
              <div className="aura-empty-queue">La cola está vacía</div>
            ) : (
              queue.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="aura-result-item-compact">
                  <div className="aura-result-thumb-compact" onClick={() => setSong(item)}>
                    {item.thumbnail ? <img src={item.thumbnail} alt="" /> : <div className="aura-thumb-placeholder" />}
                  </div>
                  <div className="aura-result-info-compact">
                    <div className="aura-result-title-compact">{item.title}</div>
                    <button className="aura-remove-btn" onClick={() => removeFromQueue(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="aura-main-container">
        <main className="aura-content-area">
          {song ? (
            <div className="aura-player-full-focus">
              <div 
                className="aura-interaction-layer"
                onClick={() => playback.isPlaying ? handlePause() : handlePlay()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleToggleFullscreen();
                }}
              ></div>
              
              <div className="aura-player-wrapper">
                <ErrorBoundary>
                  <VideoPlayer />
                </ErrorBoundary>
              </div>
            </div>
          ) : (
            <div className="aura-home-view">
              <div className="aura-empty-stage">
                <div className="aura-stage-glow"></div>
                <div className="aura-stage-outline"></div>
              </div>
            </div>
          )}
        </main>
      </div>

      <TransportBar
        song={song}
        playback={playback}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSeek={handleSeek}
        onSpeedChange={() => {}}
        onLoopToggle={handleLoopToggle}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onFullscreen={handleToggleFullscreen}
      />
    </div>
  );
}

export default App;
