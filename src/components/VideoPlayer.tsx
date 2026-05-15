import { useEffect, useRef, useCallback } from 'react';
import type { YouTubeProps, YouTubePlayer } from 'react-youtube';
import YouTube from 'react-youtube';
import { useMusicStore } from '../store/useMusicStore';

const VideoPlayer: React.FC = () => {
  const { 
    song, playback, setPlayback, queue, 
    removeFromQueue, setSong, searchResults, 
    history, addToHistory 
  } = useMusicStore();
  
  const playerRef = useRef<YouTubePlayer | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync playing state
  useEffect(() => {
    if (!playerRef.current) return;
    if (playback.isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [playback.isPlaying]);

  // Sync volume
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(playback.volume);
    }
  }, [playback.volume]);

  // Sync speed
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(playback.speed);
    }
  }, [playback.speed]);

  // Sync current time back to store when playing
  useEffect(() => {
    if (playback.isPlaying) {
      syncTimerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          setPlayback({ currentTime });
        }
      }, 500);
    } else {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    }
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [playback.isPlaying, setPlayback]);

  // Handle seeking from store to player
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    
    const ytTime = playerRef.current.getCurrentTime();
    if (Math.abs(ytTime - playback.currentTime) > 2.0) {
      playerRef.current.seekTo(playback.currentTime, true);
    }
  }, [playback.currentTime]);

  const handleNextInInfiniteLoop = useCallback(() => {
    if (!searchResults.length) return null;

    // RULE: Don't repeat if it's in the last 10 songs
    const recentHistory = history.slice(0, 10);
    const availablePool = searchResults.filter(res => !recentHistory.includes(res.id) && res.id !== song?.id);

    let nextVideo = null;
    if (availablePool.length > 0) {
      // Pick a random one from available pool to keep it varied
      nextVideo = availablePool[Math.floor(Math.random() * availablePool.length)];
    } else {
      // Fallback: pick the one that was played longest ago (last in history)
      nextVideo = searchResults.find(res => !history.includes(res.id)) || searchResults[0];
    }

    if (nextVideo) {
      return {
        id: nextVideo.id,
        title: nextVideo.title,
        composer: nextVideo.channel,
        tempo: 120,
        totalDuration: nextVideo.duration || 3600,
        youtubeId: nextVideo.id,
        thumbnail: nextVideo.thumbnail
      };
    }
    return null;
  }, [searchResults, history, song?.id]);

  if (!song?.youtubeId) return null;

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(playback.volume);
    playerRef.current.setPlaybackRate(playback.speed);
    
    if (typeof playerRef.current.setPlaybackQuality === 'function') {
      playerRef.current.setPlaybackQuality('highres');
    }
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) {
      setPlayback({ isPlaying: true });
    } else if (event.data === 2) {
      setPlayback({ isPlaying: false });
    } else if (event.data === 0) {
      // Add current to history
      if (song?.id) addToHistory(song.id);

      // VIDEO ENDED LOGIC
      if (playback.isLooping) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } else if (queue.length > 0) {
        const nextSong = queue[0];
        removeFromQueue(nextSong.id);
        setSong(nextSong);
      } else {
        // INFINITE AUTOPLAY: Pick from search results
        const nextSong = handleNextInInfiniteLoop();
        if (nextSong) {
          setSong(nextSong);
          setPlayback({ isPlaying: true, currentTime: 0 });
        } else {
          setPlayback({ isPlaying: false, currentTime: 0 });
          setSong(null);
        }
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
      origin: window.location.origin,
      vq: 'hd2160',
    },
  };

  return (
    <div className="video-player-container no-interaction">
      <YouTube 
        videoId={song.youtubeId} 
        opts={opts} 
        onReady={onReady} 
        onStateChange={onStateChange}
        className="youtube-iframe"
      />
    </div>
  );
};

export default VideoPlayer;
