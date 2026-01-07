export interface TextFile {
  id: string;
  title: string;
  content: string;
  prompt?: string;
  audioBlob?: Blob; // Persist the latest generated audio
  audioDuration?: number; // Duration for playback
  createdAt: number;
}

export enum VoiceName {
  Zephyr = 'Zephyr',
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Leda = 'Leda',
  Orus = 'Orus',
  Aoede = 'Aoede',
  Callirrhoe = 'Callirrhoe',
  Autonoe = 'Autonoe',
  Enceladus = 'Enceladus',
  Iapetus = 'Iapetus',
  Umbriel = 'Umbriel',
  Algieba = 'Algieba',
  Despina = 'Despina',
  Erinome = 'Erinome',
  Algenib = 'Algenib',
  Rasalgethi = 'Rasalgethi',
  Laomedeia = 'Laomedeia',
  Achernar = 'Achernar',
  Alnilam = 'Alnilam',
  Schedar = 'Schedar',
  Gacrux = 'Gacrux',
  Pulcherrima = 'Pulcherrima',
  Achird = 'Achird',
  Zubenelgenubi = 'Zubenelgenubi',
  Vindemiatrix = 'Vindemiatrix',
  Sadachbia = 'Sadachbia',
  Sadaltager = 'Sadaltager',
  Sulafat = 'Sulafat',
}

export enum TTSModel {
  Flash = 'gemini-2.5-flash-preview-tts',
  Pro = 'gemini-2.5-pro-preview-tts',
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