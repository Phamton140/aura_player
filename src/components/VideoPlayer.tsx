import { useEffect, useRef, useCallback } from 'react';
import type { YouTubeProps, YouTubePlayer } from 'react-youtube';
import YouTube from 'react-youtube';
import { useMusicStore } from '../store/useMusicStore';

const VideoPlayer: React.FC = () => {
  const { 
    song, playback, setPlayback, queue, 
    removeFromQueue, setSong, searchResults, 
    history, addToHistory, blacklistedIds, blacklistedChannels, 
    addToBlacklist, addToChannelBlacklist
  } = useMusicStore();
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync playing state
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    try {
      if (playback.isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    } catch (e) { /* ignore */ }
  }, [playback.isPlaying]);

  // Sync volume
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(playback.volume);
      } catch (e) { /* ignore */ }
    }
  }, [playback.volume]);

  // Sync speed
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(playback.speed);
      } catch (e) { /* ignore */ }
    }
  }, [playback.speed]);

  // Sync current time (Store -> Player)
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    try {
      const ytTime = playerRef.current.getCurrentTime();
      if (Math.abs(ytTime - playback.currentTime) > 3.0) {
        playerRef.current.seekTo(playback.currentTime, true);
      }
    } catch (e) { /* ignore */ }
  }, [playback.currentTime]);

  // Tick for syncing Player -> Store
  useEffect(() => {
    if (playback.isPlaying) {
      syncTimerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            setPlayback({ currentTime });
          } catch (e) { /* ignore */ }
        }
      }, 500);
    } else {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    }
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [playback.isPlaying, setPlayback]);

  const getNextSong = useCallback(() => {
    if (queue.length > 0) return queue[0];
    const availablePool = searchResults.filter(res => 
      !history.includes(res.id) && 
      !blacklistedIds.includes(res.id) && 
      !blacklistedChannels.includes(res.channel) && 
      res.id !== song?.id
    );
    if (availablePool.length > 0) {
      const next = availablePool[Math.floor(Math.random() * availablePool.length)];
      return {
        id: next.id, title: next.title, composer: next.channel,
        tempo: 120, totalDuration: next.duration || 3600,
        youtubeId: next.id, thumbnail: next.thumbnail
      };
    }
    return null;
  }, [queue, searchResults, history, blacklistedIds, blacklistedChannels, song?.id]);

  const playNext = useCallback(() => {
    const next = getNextSong();
    if (next) {
      if (queue.length > 0 && queue[0].id === next.id) removeFromQueue(next.id);
      setSong(next);
    } else {
      setPlayback({ isPlaying: false, currentTime: 0 });
      setSong(null);
    }
  }, [getNextSong, setSong, setPlayback, queue, removeFromQueue]);

  if (!song?.youtubeId) return null;

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    try {
      playerRef.current.setVolume(playback.volume);
      playerRef.current.setPlaybackRate(playback.speed);
      if (playback.currentTime > 0) {
        playerRef.current.seekTo(playback.currentTime, true);
      }
    } catch (e) { /* ignore */ }
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.warn("Video Error", event.data);
    if (song?.id) addToBlacklist(song.id);
    if (song?.composer) addToChannelBlacklist(song.composer);
    playNext();
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) setPlayback({ isPlaying: true });
    else if (event.data === 2) setPlayback({ isPlaying: false });
    else if (event.data === 0) {
      if (song?.id) addToHistory(song.id);
      if (playback.isLooping) {
        playerRef.current?.seekTo(0);
        playerRef.current?.playVideo();
      } else {
        playNext();
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, disablekb: 1, fs: 0, origin: window.location.origin, vq: 'hd1080' },
  };

  return (
    <div className="video-player-container no-interaction">
      <YouTube 
        videoId={song.youtubeId} 
        opts={opts} 
        onReady={onReady} 
        onStateChange={onStateChange} 
        onError={onError} 
        className="youtube-iframe" 
      />
    </div>
  );
};

export default VideoPlayer;
