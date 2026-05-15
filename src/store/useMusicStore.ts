import { create } from 'zustand';
import type { Song, PlaybackState } from '../types/music';

interface MusicStore {
  song: Song | null;
  playback: PlaybackState;
  audioReady: boolean;
  audioLoading: boolean;
  sidebarOpen: boolean;

  // Actions
  setSong: (song: Song | null) => void;
  setPlayback: (playback: Partial<PlaybackState> | ((state: PlaybackState) => PlaybackState)) => void;
  setAudioReady: (ready: boolean) => void;
  setAudioLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  seek: (time: number) => void;
}

export const useMusicStore = create<MusicStore>((set) => ({
  song: null,
  playback: {
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    isLooping: false,
  },
  audioReady: false,
  audioLoading: false,
  sidebarOpen: true,

  setSong: (song) => set({ song, playback: { 
    isPlaying: false, 
    currentTime: 0, 
    speed: 1, 
    isLooping: false, 
  } }),
  
  setPlayback: (updater) => set((state) => ({
    playback: typeof updater === 'function' ? updater(state.playback) : { ...state.playback, ...updater }
  })),

  setAudioReady: (audioReady) => set({ audioReady }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  seek: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: Math.max(0, Math.min(time, state.song?.totalDuration || 0)) }
  })),
}));
