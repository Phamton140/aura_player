export interface Song {
  id: string;
  title: string;
  composer?: string;
  tempo: number;         // BPM
  totalDuration: number; // seconds
  youtubeId?: string;
  thumbnail?: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  isLooping: boolean;
}

export interface AnalysisResult {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  stage: string;
  song?: Song;
  error?: string;
}
