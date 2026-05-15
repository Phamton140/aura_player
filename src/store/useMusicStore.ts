import { create } from 'zustand';
import type { Song, PlaybackState } from '../types/music';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channel: string;
  duration: number | null;
}

interface MusicStore {
  song: Song | null;
  playback: PlaybackState;
  audioReady: boolean;
  audioLoading: boolean;
  searchResults: SearchResult[];
  queue: Song[];

  // Actions
  setSong: (song: Song | null) => void;
  setPlayback: (playback: Partial<PlaybackState> | ((state: PlaybackState) => PlaybackState)) => void;
  setAudioReady: (ready: boolean) => void;
  setAudioLoading: (loading: boolean) => void;
  setSearchResults: (results: SearchResult[]) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (id: string) => void;
  seek: (time: number) => void;
}

export const useMusicStore = create<MusicStore>((set) => ({
  song: null,
  playback: {
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    isLooping: false,
    volume: 80,
  },
  audioReady: false,
  audioLoading: false,
  searchResults: [],
  queue: [],

  setSong: (song) => set((state) => ({ 
    song, 
    playback: { 
      ...state.playback,
      isPlaying: false, 
      currentTime: 0, 
      speed: 1, 
      isLooping: false, 
    } 
  })),
  
  setPlayback: (updater) => set((state) => ({
    playback: typeof updater === 'function' ? updater(state.playback) : { ...state.playback, ...updater }
  })),

  setAudioReady: (audioReady) => set({ audioReady }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  setSearchResults: (searchResults) => set({ searchResults }),
  
  addToQueue: (song) => set((state) => ({
    queue: [...state.queue, song]
  })),

  removeFromQueue: (id) => set((state) => ({
    queue: state.queue.filter(s => s.id !== id)
  })),

  seek: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: Math.max(0, Math.min(time, state.song?.totalDuration || 0)) }
  })),
}));
