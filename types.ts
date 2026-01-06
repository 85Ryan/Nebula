export interface TextFile {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface VoiceMetadata {
  id: VoiceName;
  name: string;
  gender: 'Male' | 'Female';
  tags: string[];
  description: string;
}

export interface AudioSettings {
  voice: VoiceName;
  pitch: number; // -1200 to 1200 cents (controlled via WebAudio)
  speed: number; // 0.5 to 2.0 (controlled via WebAudio)
  volume: number; // 0.0 to 2.0 (Gain)
  format: 'wav'; // Currently fixed to WAV container for download
}

export interface GeneratedAudio {
  url: string;
  blob: Blob;
  duration?: number;
}