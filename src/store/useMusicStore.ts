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
  history: string[];
  lastVolume: number;
  blacklistedIds: string[];
  blacklistedChannels: string[]; // List of restricted channels
  isSidebarOpen: boolean;
  isQueueOpen: boolean;

  // Actions
  setSong: (song: Song | null) => void;
  setPlayback: (playback: Partial<PlaybackState> | ((state: PlaybackState) => PlaybackState)) => void;
  setAudioReady: (ready: boolean) => void;
  setAudioLoading: (loading: boolean) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (id: string) => void;
  addToHistory: (id: string) => void;
  addToBlacklist: (id: string) => void;
  addToChannelBlacklist: (channelName: string) => void;
  toggleMute: () => void;
  seek: (time: number) => void;
}

// Load initial blacklists from localStorage
const savedBlacklist = localStorage.getItem('aura_blacklist');
const initialBlacklist = savedBlacklist ? JSON.parse(savedBlacklist) : [];

const savedChannelBlacklist = localStorage.getItem('aura_channel_blacklist');
const initialChannelBlacklist = savedChannelBlacklist ? JSON.parse(savedChannelBlacklist) : [];

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
  history: [],
  lastVolume: 80,
  blacklistedIds: initialBlacklist,
  blacklistedChannels: initialChannelBlacklist,
  isSidebarOpen: false,
  isQueueOpen: false,

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
  
  setPlayback: (updater) => set((state) => {
    const nextPlayback = typeof updater === 'function' ? updater(state.playback) : { ...state.playback, ...updater };
    const lastVolume = (nextPlayback.volume > 0) ? nextPlayback.volume : state.lastVolume;
    return { playback: nextPlayback, lastVolume };
  }),

  setAudioReady: (audioReady) => set({ audioReady }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  
  setSearchResults: (results) => set((state) => {
    // Filter out blacklisted IDs AND Channels
    const filteredResults = results.filter(r => 
      !state.blacklistedIds.includes(r.id) && 
      !state.blacklistedChannels.includes(r.channel)
    );
    return { 
      searchResults: filteredResults, 
      isSidebarOpen: filteredResults.length > 0 
    };
  }),

  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setQueueOpen: (isQueueOpen) => set({ isQueueOpen }),
  
  addToQueue: (song) => set((state) => ({
    queue: [...state.queue, song]
  })),

  removeFromQueue: (id) => set((state) => ({
    queue: state.queue.filter(s => s.id !== id)
  })),

  addToHistory: (id) => set((state) => {
    const newHistory = [id, ...state.history].slice(0, 50);
    return { history: newHistory };
  }),

  addToBlacklist: (id) => set((state) => {
    if (state.blacklistedIds.includes(id)) return state;
    const newBlacklist = [...state.blacklistedIds, id];
    localStorage.setItem('aura_blacklist', JSON.stringify(newBlacklist));
    const newResults = state.searchResults.filter(r => r.id !== id);
    return { blacklistedIds: newBlacklist, searchResults: newResults };
  }),

  addToChannelBlacklist: (channelName) => set((state) => {
    if (!channelName || state.blacklistedChannels.includes(channelName)) return state;
    const newChannelBlacklist = [...state.blacklistedChannels, channelName];
    localStorage.setItem('aura_channel_blacklist', JSON.stringify(newChannelBlacklist));
    // Remove all videos from this channel from current results
    const newResults = state.searchResults.filter(r => r.channel !== channelName);
    return { blacklistedChannels: newChannelBlacklist, searchResults: newResults };
  }),

  toggleMute: () => set((state) => {
    if (state.playback.volume > 0) {
      return { 
        lastVolume: state.playback.volume,
        playback: { ...state.playback, volume: 0 }
      };
    } else {
      return { 
        playback: { ...state.playback, volume: state.lastVolume }
      };
    }
  }),

  seek: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: Math.max(0, Math.min(time, state.song?.totalDuration || 0)) }
  })),
}));
