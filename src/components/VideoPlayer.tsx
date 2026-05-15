import React, { useEffect, useRef } from 'react';
import type { YouTubeProps, YouTubePlayer } from 'react-youtube';
import YouTube from 'react-youtube';
import { useMusicStore } from '../store/useMusicStore';

const VideoPlayer: React.FC = () => {
  const { song, playback, setPlayback } = useMusicStore();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!playerRef.current || !song?.youtubeId) return;

    // Sync playing state
    if (playback.isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [playback.isPlaying, song?.youtubeId]);

  useEffect(() => {
    if (!playerRef.current || !song?.youtubeId || isSyncing.current) return;

    // Sync time if difference is significant (> 0.5s)
    playerRef.current.getCurrentTime().then((currentTime: number) => {
      if (Math.abs(currentTime - playback.currentTime) > 0.5) {
        playerRef.current.seekTo(playback.currentTime, true);
      }
    });
  }, [playback.currentTime, song?.youtubeId]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.setPlaybackRate(playback.speed);
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = playing, 2 = paused
    if (event.data === 1) {
      setPlayback({ isPlaying: true });
    } else if (event.data === 2) {
      setPlayback({ isPlaying: false });
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(playback.speed);
    }
  }, [playback.speed]);

  if (!song?.youtubeId) return null;

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      mute: 0,
    },
  };

  return (
    <div className="video-player-container">
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
