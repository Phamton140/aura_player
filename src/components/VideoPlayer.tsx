import { useEffect, useRef } from 'react';
import type { YouTubeProps, YouTubePlayer } from 'react-youtube';
import YouTube from 'react-youtube';
import { useMusicStore } from '../store/useMusicStore';

const VideoPlayer: React.FC = () => {
  const { song, playback, setPlayback, queue, removeFromQueue, setSong } = useMusicStore();
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
      // VIDEO ENDED: Crucial to avoid suggested videos grid
      if (playback.isLooping) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } else if (queue.length > 0) {
        // Auto-play next in queue
        const nextSong = queue[0];
        removeFromQueue(nextSong.id);
        setSong(nextSong);
      } else {
        // Stop and clear to avoid showing the "Related Videos" grid
        setPlayback({ isPlaying: false, currentTime: 0 });
        setSong(null); 
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
      rel: 0, // Minimizes (but doesn't remove) related videos
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
