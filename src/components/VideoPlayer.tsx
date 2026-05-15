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
  const failedIdsRef = useRef<Set<string>>(new Set());

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

  // Sync current time
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

  // Handle seeking
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
    const ytTime = playerRef.current.getCurrentTime();
    if (Math.abs(ytTime - playback.currentTime) > 2.0) {
      playerRef.current.seekTo(playback.currentTime, true);
    }
  }, [playback.currentTime]);

  const findSmartAlternative = useCallback((currentTitle: string, channel: string) => {
    if (!searchResults.length) return null;

    // 1. Clean the title to get the core song name
    // Remove artist name, common fluff, and punctuation
    const cleanArtist = channel.replace(/VEVO|Official|Music/gi, '').trim().toLowerCase();
    const coreTitle = currentTitle.toLowerCase()
      .replace(new RegExp(cleanArtist, 'gi'), '') // Remove artist name from title
      .replace(/official|video|audio|lyrics|live|en vivo|HD|4K|\[|\]|\(|\)|-|_/gi, ' ')
      .trim();

    const keywords = coreTitle.split(/\s+/)
      .filter(w => w.length > 2); // Ignore very short words like "de", "la"

    if (keywords.length === 0) return null;

    // 2. Rank search results by keyword match density
    const scoredAlternatives = searchResults
      .filter(res => !failedIdsRef.current.has(res.id) && res.id !== song?.id)
      .map(res => {
        const resTitle = res.title.toLowerCase();
        const matches = keywords.filter(k => resTitle.includes(k)).length;
        const score = matches / keywords.length; // Percentage of keywords found
        return { res, score };
      })
      .filter(item => item.score >= 0.6) // Must match at least 60% of keywords
      .sort((a, b) => b.score - a.score); // Best match first

    if (scoredAlternatives.length > 0) {
      const best = scoredAlternatives[0].res;
      return {
        id: best.id,
        title: best.title,
        composer: best.channel,
        tempo: 120,
        totalDuration: best.duration || 3600,
        youtubeId: best.id,
        thumbnail: best.thumbnail
      };
    }
    return null;
  }, [searchResults, song?.id]);

  const playNext = useCallback((isRetry = false) => {
    if (isRetry && song) {
      // Try to find a TRUE alternative for the SAME theme
      const alternative = findSmartAlternative(song.title, song.composer || '');
      if (alternative) {
        console.log(`Smart Recovery: Found alternative for "${song.title}" -> "${alternative.title}"`);
        setSong(alternative);
        setPlayback({ isPlaying: true, currentTime: 0 });
        return;
      } else {
        console.warn(`Smart Recovery: No suitable alternative found for "${song.title}". Stopping to prevent unrelated playback.`);
        // Optional: notify the user or just stop. 
        // User said: "salte a la que si se parezca". If none found, better to let them pick or jump to queue.
      }
    }

    // Fallback to queue
    if (queue.length > 0) {
      const nextSong = queue[0];
      removeFromQueue(nextSong.id);
      setSong(nextSong);
      setPlayback({ isPlaying: true, currentTime: 0 });
      return;
    }

    // Fallback to infinite autoplay (random but not recently played)
    const recentHistory = history.slice(0, 10);
    const availablePool = searchResults.filter(res => !recentHistory.includes(res.id) && !failedIdsRef.current.has(res.id) && res.id !== song?.id);

    if (availablePool.length > 0) {
      const nextVideoData = availablePool[Math.floor(Math.random() * availablePool.length)];
      setSong({
        id: nextVideoData.id,
        title: nextVideoData.title,
        composer: nextVideoData.channel,
        tempo: 120,
        totalDuration: nextVideoData.duration || 3600,
        youtubeId: nextVideoData.id,
        thumbnail: nextVideoData.thumbnail
      });
      setPlayback({ isPlaying: true, currentTime: 0 });
    } else {
      setPlayback({ isPlaying: false, currentTime: 0 });
      setSong(null);
    }
  }, [queue, removeFromQueue, setSong, setPlayback, searchResults, history, song, findSmartAlternative]);

  if (!song?.youtubeId) return null;

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(playback.volume);
    playerRef.current.setPlaybackRate(playback.speed);
  };

  const onError: YouTubeProps['onError'] = (event) => {
    console.warn(`Restricted video (Error: ${event.data}) for ID: ${song.id}. Searching for smart alternative...`);
    failedIdsRef.current.add(song.id);
    playNext(true); // isRetry = true
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === 1) setPlayback({ isPlaying: true });
    else if (event.data === 2) setPlayback({ isPlaying: false });
    else if (event.data === 0) {
      if (song?.id) addToHistory(song.id);
      if (playback.isLooping) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } else {
        playNext(false); // Normal end, not a retry
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%', width: '100%',
    playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3, disablekb: 1, fs: 0, origin: window.location.origin, vq: 'hd2160' },
  };

  return (
    <div className="video-player-container no-interaction">
      <YouTube videoId={song.youtubeId} opts={opts} onReady={onReady} onStateChange={onStateChange} onError={onError} className="youtube-iframe" />
    </div>
  );
};

export default VideoPlayer;
