import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Plus, Terminal } from 'lucide-react';
import { TextFile, AudioSettings, VoiceName, GeneratedAudio, VoiceMetadata } from './types';
import { saveFile, getFiles, deleteFile, savePreview, getPreview, renameFile } from './db';
import { generateSpeech } from './services/geminiService';
import { base64ToUint8Array, createWavFile } from './audioUtils';

// Components
import { Sidebar } from './components/Sidebar';
import { VoiceSelector } from './components/VoiceSelector';
import { AudioControls } from './components/AudioControls';
import { TextInput } from './components/TextInput';
import { AudioPlayer } from './components/AudioPlayer';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ModelSelector } from './components/ModelSelector';
import { VoicesModal } from './components/VoicesModal';
import { ToneToolbar } from './components/ToneToolbar';
import { TTSModel } from './types';

// --- Constants & Data ---

const DEFAULT_SETTINGS: AudioSettings = {
  voice: VoiceName.Zephyr,
  pitch: 0,
  speed: 1.0,
  volume: 1.0,
  format: 'wav',
};

const SAMPLE_RATE = 24000;
const PREVIEW_TEXT = "星云语音，让交流更有温度。";

// Voice Metadata for UI
const VOICE_META: Record<VoiceName, VoiceMetadata> = {
  [VoiceName.Zephyr]: {
    id: VoiceName.Zephyr,
    name: 'Zephyr',
    gender: 'Female',
    tags: ['中文首选', '清晰', '高亮'],
    description: '发音最标准的通用女声，适合各类中文助手、通知及播报'
  },
  [VoiceName.Charon]: {
    id: VoiceName.Charon,
    name: 'Charon',
    gender: 'Male',
    tags: ['中文推荐', '威严', '深沉'],
    description: '稳重磁性的男声，咬字清晰，非常适合新闻播报或严肃叙事'
  },
  [VoiceName.Kore]: {
    id: VoiceName.Kore,
    name: 'Kore',
    gender: 'Female',
    tags: ['中文适用', '温柔', '治愈'],
    description: '放松平静的女声，适合情感电台、冥想引导或日常对话'
  },
  [VoiceName.Fenrir]: {
    id: VoiceName.Fenrir,
    name: 'Fenrir',
    gender: 'Male',
    tags: ['双语通用', '激昂', '有力'],
    description: '充满能量的男声，适合游戏解说、广告或快节奏内容'
  },
  [VoiceName.Puck]: {
    id: VoiceName.Puck,
    name: 'Puck',
    gender: 'Male',
    tags: ['双语通用', '质感', '叙事'],
    description: '略带沙哑的独特男声，适合有声书或需要情感张力的独白'
  },
  [VoiceName.Leda]: {
    id: VoiceName.Leda,
    name: 'Leda',
    gender: 'Female',
    tags: ['青春', '活泼'],
    description: '清脆悦耳的年轻女声，适合社交媒体、短视频、或者是充满活力的广告场景'
  },
  [VoiceName.Orus]: {
    id: VoiceName.Orus,
    name: 'Orus',
    gender: 'Male',
    tags: ['商务', '正式'],
    description: '稳重大方的男声，具有很强的信服力，非常适合企业宣传或商业演示'
  },
  [VoiceName.Aoede]: {
    id: VoiceName.Aoede,
    name: 'Aoede',
    gender: 'Female',
    tags: ['轻快', '自然'],
    description: '如同微风拂面般的自然嗓音，适合轻快的日常分享或生活化的播报'
  },
  [VoiceName.Callirrhoe]: {
    id: VoiceName.Callirrhoe,
    name: 'Callirrhoe',
    gender: 'Female',
    tags: ['轻松', '舒缓'],
    description: '节奏舒缓、语气柔和的女声，能够营造出安宁舒适的氛围'
  },
  [VoiceName.Autonoe]: {
    id: VoiceName.Autonoe,
    name: 'Autonoe',
    gender: 'Female',
    tags: ['明亮', '悦耳'],
    description: '发音饱满明亮的女声，无论是通知还是讲解都能清晰传递信息'
  },
  [VoiceName.Enceladus]: {
    id: VoiceName.Enceladus,
    name: 'Enceladus',
    gender: 'Male',
    tags: ['气声', '磁性'],
    description: '略带气声的磁性男声，非常有质感，适合电影配音或情感独白'
  },
  [VoiceName.Iapetus]: {
    id: VoiceName.Iapetus,
    name: 'Iapetus',
    gender: 'Male',
    tags: ['清晰', '冷静'],
    description: '语言表达极其清晰干练的男声，适合科技解析、学术报告等理性内容'
  },
  [VoiceName.Umbriel]: {
    id: VoiceName.Umbriel,
    name: 'Umbriel',
    gender: 'Male',
    tags: ['随性', '惬意'],
    description: '语气轻松自在的男声，就像在和老朋友聊天，适合生活博主或播客分享'
  },
  [VoiceName.Algieba]: {
    id: VoiceName.Algieba,
    name: 'Algieba',
    gender: 'Female',
    tags: ['平滑', '知性'],
    description: '如丝绸般顺滑的嗓音，流露着一种知性美，是深度长文阅读的最佳选择'
  },
  [VoiceName.Despina]: {
    id: VoiceName.Despina,
    name: 'Despina',
    gender: 'Female',
    tags: ['柔滑', '优雅'],
    description: '极具优雅韵味的美声，为你的内容增添一份尊贵感'
  },
  [VoiceName.Erinome]: {
    id: VoiceName.Erinome,
    name: 'Erinome',
    gender: 'Female',
    tags: ['清澈', '通透'],
    description: '宛如泉水般纯净透明的声音，听感非常直接且毫无修饰'
  },
  [VoiceName.Algenib]: {
    id: VoiceName.Algenib,
    name: 'Algenib',
    gender: 'Male',
    tags: ['粗犷', '力量'],
    description: '带有沙哑质感的硬朗男声，传达出强大的意志和力量感'
  },
  [VoiceName.Rasalgethi]: {
    id: VoiceName.Rasalgethi,
    name: 'Rasalgethi',
    gender: 'Male',
    tags: ['全能', '科普'],
    description: '最全能的科普讲解男声，自带一种权威、博学的专业感'
  },
  [VoiceName.Laomedeia]: {
    id: VoiceName.Laomedeia,
    name: 'Laomedeia',
    gender: 'Female',
    tags: ['俏皮', '可爱'],
    description: '灵动俏皮的声音，能够精准捕捉快乐的情绪，适合儿童内容或轻喜剧'
  },
  [VoiceName.Achernar]: {
    id: VoiceName.Achernar,
    name: 'Achernar',
    gender: 'Female',
    tags: ['柔软', '梦幻'],
    description: '如梦似幻的轻柔女声，适合助眠导读或需要静谧感的内容'
  },
  [VoiceName.Alnilam]: {
    id: VoiceName.Alnilam,
    name: 'Alnilam',
    gender: 'Male',
    tags: ['沉稳', '深厚'],
    description: '底蕴深沉的男声，给人一种脚踏实地的可靠感'
  },
  [VoiceName.Schedar]: {
    id: VoiceName.Schedar,
    name: 'Schedar',
    gender: 'Male',
    tags: ['平稳', '中立'],
    description: '语调四平八稳的中立男声，不带个人感情色彩，非常客观'
  },
  [VoiceName.Gacrux]: {
    id: VoiceName.Gacrux,
    name: 'Gacrux',
    gender: 'Male',
    tags: ['成熟', '阅历'],
    description: '充满故事感的成熟男声，适合回忆录或经典的叙述性文本'
  },
  [VoiceName.Pulcherrima]: {
    id: VoiceName.Pulcherrima,
    name: 'Pulcherrima',
    gender: 'Female',
    tags: ['直爽', '干脆'],
    description: '心直口快、豪爽的女声，非常适合具有说服性的演讲或快剪视频'
  },
  [VoiceName.Achird]: {
    id: VoiceName.Achird,
    name: 'Achird',
    gender: 'Male',
    tags: ['友好', '邻家'],
    description: '十分亲切友好的邻家大哥哥，适合教程、导游或亲子互动场景'
  },
  [VoiceName.Zubenelgenubi]: {
    id: VoiceName.Zubenelgenubi,
    name: 'Zubenelgenubi',
    gender: 'Male',
    tags: ['闲适', '低调'],
    description: '完全不紧不慢的悠闲嗓音，让听众彻底放松精神'
  },
  [VoiceName.Vindemiatrix]: {
    id: VoiceName.Vindemiatrix,
    name: 'Vindemiatrix',
    gender: 'Female',
    tags: ['贤淑', '端庄'],
    description: '尽显端庄贤淑气息的女声，适合介绍传统文化或温馨的家庭故事'
  },
  [VoiceName.Sadachbia]: {
    id: VoiceName.Sadachbia,
    name: 'Sadachbia',
    gender: 'Female',
    tags: ['动感', '元气'],
    description: '元气满满、充满跃动感的声音，为你的作品补充能量'
  },
  [VoiceName.Sadaltager]: {
    id: VoiceName.Sadaltager,
    name: 'Sadaltager',
    gender: 'Male',
    tags: ['专业', '说服力'],
    description: '充满职业智慧与信服力的声音，是制作咨询项目或专家演讲的首选'
  },
  [VoiceName.Sulafat]: {
    id: VoiceName.Sulafat,
    name: 'Sulafat',
    gender: 'Female',
    tags: ['高频', '穿透力'],
    description: '频率极佳且极具穿透力的女声，即使在嘈杂环境下也清晰可辨'
  }
};

export default function App() {
  // -- State --
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoicesModalOpen, setIsVoicesModalOpen] = useState(false);

  const [files, setFiles] = useState<TextFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('tts_settings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    return parsed;
  });

  const [selectedModel, setSelectedModel] = useState<TTSModel>(() => {
    return (localStorage.getItem('tts_model') as TTSModel) || TTSModel.Flash;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // -- Refs --
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // -- Effects --

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tts_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    loadFiles();
    // Check if API Key exists, if not open settings
    if (!localStorage.getItem('gemini_api_key')) {
      setIsSettingsOpen(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tts_settings', JSON.stringify(settings));
    updateAudioNodeParams();
  }, [settings]);

  // Auto-save logic
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (activeFileId) {
        const file = files.find(f => f.id === activeFileId);
        if (file && (file.content !== text || file.prompt !== prompt)) {
          const updatedFile = { ...file, content: text, prompt };
          setFiles(prev => prev.map(f => f.id === activeFileId ? updatedFile : f));
          saveFile(updatedFile);
        }
      }
    }, 800);
    return () => clearTimeout(saveTimeout);
  }, [text, prompt, activeFileId]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (generatedAudio?.url) URL.revokeObjectURL(generatedAudio.url);
    };
  }, []);

  // -- Actions --

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('gemini_api_key', trimmed);
  };

  const loadFiles = async () => {
    const loadedFiles = await getFiles();
    setFiles(loadedFiles);
    if (!activeFileId && loadedFiles.length > 0) {
      setActiveFileId(loadedFiles[0].id);
      setText(loadedFiles[0].content);
      setPrompt(loadedFiles[0].prompt || "");
    }
  };

  const createNewFile = async (initialContent: string = '', initialPrompt: string = '') => {
    const newFile: TextFile = {
      id: crypto.randomUUID(),
      title: `未命名草稿 ${files.length + 1}`,
      content: initialContent,
      prompt: initialPrompt,
      createdAt: Date.now(),
    };
    await saveFile(newFile);
    const updatedFiles = await getFiles();
    setFiles(updatedFiles);
    setActiveFileId(newFile.id);
    setText(initialContent);
    setPrompt(initialPrompt);
    setGeneratedAudio(null);
    return newFile.id;
  };

  const handleTextChange = async (newText: string) => {
    setText(newText);
    if (!activeFileId && files.length === 0 && newText.length > 0) {
      await createNewFile(newText);
    }
  };

  const handlePromptChange = async (newPrompt: string) => {
    setPrompt(newPrompt);
    if (!activeFileId && files.length === 0 && newPrompt.length > 0) {
      await createNewFile('', newPrompt);
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个文件吗？')) return;

    await deleteFile(id);
    const remaining = await getFiles();
    setFiles(remaining);

    if (activeFileId === id) {
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
        setText(remaining[0].content);
        setPrompt(remaining[0].prompt || "");
      } else {
        setActiveFileId(null);
        setText('');
        setPrompt('');
      }
      setGeneratedAudio(null);
      stopAudio();
    }
  };

  const handleRenameFile = async (id: string, newTitle: string) => {
    try {
      // Optimistic update
      setFiles(prev => prev.map(f => f.id === id ? { ...f, title: newTitle } : f));
      await renameFile(id, newTitle);
    } catch (error) {
      console.error("Failed to rename file:", error);
      // Revert on error (re-fetch)
      loadFiles();
    }
  };

  const handleFileSelect = (file: TextFile) => {
    setActiveFileId(file.id);
    setText(file.content);
    setPrompt(file.prompt || "");
    stopAudio();

    // Check for persisted audio
    if (file.audioBlob) {
      const url = URL.createObjectURL(file.audioBlob);
      // Reconstruct GeneratedAudio object
      setGeneratedAudio({
        url,
        blob: file.audioBlob,
        duration: file.audioDuration
      });
    } else {
      setGeneratedAudio(null);
    }
  };

  // -- Audio Logic --

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const updateAudioNodeParams = () => {
    if (sourceNodeRef.current && gainNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.playbackRate.value = settings.speed;
      sourceNodeRef.current.detune.value = settings.pitch;
      gainNodeRef.current.gain.value = settings.volume;
    }
  };

  const handlePreviewVoice = async (e: React.MouseEvent, voice: VoiceName) => {
    e.stopPropagation();
    if (previewingVoice) return;

    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setPreviewingVoice(voice);
    try {
      // 1. Check Cache first
      const cachedBlob = await getPreview(voice);
      let wavBlob: Blob;

      if (cachedBlob) {
        wavBlob = cachedBlob;
      } else {
        // 2. Generate and Cache
        const base64 = await generateSpeech({ text: PREVIEW_TEXT, voice, model: TTSModel.Flash }, apiKey);
        const rawBytes = base64ToUint8Array(base64);

        const samples = new Float32Array(rawBytes.length / 2);
        const dataView = new DataView(rawBytes.buffer);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }
        wavBlob = createWavFile(samples, SAMPLE_RATE);

        // Save to cache
        await savePreview(voice, wavBlob);
      }

      const url = URL.createObjectURL(wavBlob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;

      audio.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
        previewAudioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("Audio Playback Error:", e);
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
        previewAudioRef.current = null;
      };

      // Ensure we actually start playing
      try {
        await audio.play();
      } catch (playError) {
        console.error("Audio Play Error:", playError);
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      if (String(err).includes('403') || String(err).includes('Key')) {
        alert('密钥验证失败，请在设置中更新您的 API KEY。');
        setIsSettingsOpen(true);
      }
      setPreviewingVoice(null);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    stopAudio();
    setGeneratedAudio(null);

    try {
      const base64 = await generateSpeech({ text, voice: settings.voice, model: selectedModel, prompt }, apiKey);
      const rawBytes = base64ToUint8Array(base64);

      initAudioContext();
      if (!audioContextRef.current) throw new Error("Audio Context init failed");

      const samples = new Float32Array(rawBytes.length / 2);
      const dataView = new DataView(rawBytes.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const buffer = audioContextRef.current.createBuffer(1, samples.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(samples);
      audioBufferRef.current = buffer;

      const wavBlob = createWavFile(samples, SAMPLE_RATE);
      const url = URL.createObjectURL(wavBlob);

      const newAudioData = { url, blob: wavBlob, duration: buffer.duration };
      setGeneratedAudio(newAudioData);

      // Persist audio to active file
      if (activeFileId) {
        const currentFile = files.find(f => f.id === activeFileId);
        if (currentFile) {
          const updatedFile = {
            ...currentFile,
            content: text, // Ensure text is synced
            prompt: prompt,
            audioBlob: wavBlob,
            audioDuration: buffer.duration
          };
          setFiles(prev => prev.map(f => f.id === activeFileId ? updatedFile : f));
          await saveFile(updatedFile);
        }
      }

    } catch (err) {
      console.error(err);
      if (String(err).includes('403') || String(err).includes('Key')) {
        alert('API Key 无效或过期，请点击设置图标更新。');
        setIsSettingsOpen(true);
      } else {
        alert("服务器响应超时，请确认 API Key 是否正确并重试。");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async () => {
    if (!audioContextRef.current || (!audioBufferRef.current && !generatedAudio)) return;
    initAudioContext();

    // If buffer is missing but we have blob (e.g. loaded from DB), decode it
    if (!audioBufferRef.current && generatedAudio?.blob) {
      try {
        const arrayBuffer = await generatedAudio.blob.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.error("Failed to decode saved audio:", e);
        return;
      }
    }

    // Double check buffer exists after attempted decode
    if (!audioBufferRef.current) return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    const gainNode = audioContextRef.current.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    sourceNodeRef.current = source;
    gainNodeRef.current = gainNode;

    updateAudioNodeParams();

    const offset = pausedTimeRef.current % audioBufferRef.current.duration;
    // Calculate effective rate
    const effectiveRate = settings.speed * Math.pow(2, settings.pitch / 1200);

    // startTime is Wall Clock Time when playback "started" (virtual 0 point)
    startTimeRef.current = audioContextRef.current.currentTime - (offset / effectiveRate);

    source.start(0, offset);
    setIsPlaying(true);

    source.onended = () => {
      // 更加稳健的结束检测：如果当前进度已经非常接近总时长，则停止
      if (isPlaying) {
        setIsPlaying(false);
        pausedTimeRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      // Calculate effective rate
      const effectiveRate = settings.speed * Math.pow(2, settings.pitch / 1200);
      // Store offset in BUFFER TIME
      pausedTimeRef.current = (audioContextRef.current.currentTime - startTimeRef.current) * effectiveRate;
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null; // 显式清除 onended 防止重复触发
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
    pausedTimeRef.current = 0;
    setCurrentTime(0);
    // Do NOT clear audioBufferRef here if we want to resume same file, 
    // BUT we must clear it if switching files. 
    // handleFileSelect clears it by calling stopAudio? 
    // Actually, `stopAudio` just stops playback. `handleFileSelect` should clear buffer reference logic.
    // Ideally, `audioBufferRef` is derived from `generatedAudio`.
    // My updated `playAudio` handles re-decoding from blob if needed. 
    // So cleaning buffer here is fine to save memory, OR keep it.
    // Let's keep it but `handleFileSelect` calls `stopAudio` so it's consistent.
    // Wait, if I stop, I might play again. I shouldn't throw away buffer unless file changed.
    // However, `playAudio` logic I added: `if (!audioBufferRef.current && generatedAudio?.blob) ... decode`.
    // So it's SAFE to nullify buffer if needed, but inefficient.
    // For now, I'll update `handleFileSelect` to explicitly nullify `audioBufferRef.current` to ensure fresh decode for new file.
  };

  // Helper: Calculate effective playback rate considering both speed and pitch (detune)
  // WebAudio: playbackRate affects speed. detune also affects speed (resampling).
  // Total Rate = speed * (2 ^ (pitch / 1200))
  const getEffectivePlaybackRate = () => {
    return settings.speed * Math.pow(2, settings.pitch / 1200);
  };

  useEffect(() => {
    let animFrame: number;
    const updateProgress = () => {
      if (isPlaying && audioContextRef.current && startTimeRef.current) {
        // Use effective rate for elapsed time calculation
        const effectiveRate = getEffectivePlaybackRate();
        const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * effectiveRate;

        // Effective Duration = Original Duration / Effective Rate
        const duration = audioBufferRef.current?.duration || 0;
        // Don't modify duration here, "elapsed" is in terms of "buffer sample time".
        // Wait, if I play at 2x, 1 real second = 2 buffer seconds.
        // My elapsed logic `(now - start) * rate` tracks position in BUFFER.
        // So `elapsed` is correct for comparison with `buffer.duration`.

        if (elapsed >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          pausedTimeRef.current = 0;
          return;
        }

        setCurrentTime(Math.max(0, elapsed));
        animFrame = requestAnimationFrame(updateProgress);
      }
    };
    if (isPlaying) {
      animFrame = requestAnimationFrame(updateProgress);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, settings.speed, settings.pitch]); // Add pitch dependency

  // Calculate display duration for AudioPlayer
  // Display Duration = Original Buffer Duration / Effective Rate (how long it takes to play in wall-clock time)
  const effectivePlaybackRate = settings.speed * Math.pow(2, settings.pitch / 1200);
  const displayDuration = generatedAudio ? (generatedAudio.duration || 0) / effectivePlaybackRate : 0;

  // -- Render --

  return (
    <div className="flex flex-col h-screen w-full text-[var(--color-text-primary)] font-sans antialiased overflow-hidden">

      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Sidebar: File List */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelect={handleFileSelect}
          onDelete={handleDeleteFile}
          onRename={handleRenameFile}
          onCreate={() => createNewFile()}
        />

        {/* 2. Middle: Main Content Area */}
        <main className="flex-1 flex flex-col p-6 gap-0 overflow-hidden">
          <TextInput
            text={text}
            onChange={handleTextChange}
            prompt={prompt}
            onPromptChange={handlePromptChange}
            isGenerating={isGenerating}
          />

          <AudioPlayer
            generatedAudio={generatedAudio}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            // Logic: AudioPlayer expects "currentTime" in BUFFER time to show progress bar relative to Buffer Duration.
            // BUT it expects "duration" for TEXT display in Wall-Clock time.
            // This is mixed. 
            // If I pass `displayDuration` for text, then `currentTime` passed should also be in Wall-Clock time?
            // Current code passes `currentTime` which is BUFFER position.
            // Old code: currentTime / generatedAudio.duration. This was BufferPos / BufferDur = % progress. Correct.
            // New Text: {currentTime} / {displayDuration}.
            // If I play 10s buffer at 2x. Wall time = 5s.
            // At 1 real sec: BufferPos = 2s. Text shows "2.0s / 5.0s". This is confusing. 
            // It should show "1.0s / 5.0s".
            // So `currentTime` passed to AudioPlayer for TEXT should be Wall-Clock time.
            // But for PROGRESS BAR, it needs %.
            // WallTime / WallDuration = (BufferPos / Rate) / (BufferDur / Rate) = BufferPos / BufferDur.
            // So Progress % is same.
            // So I should convert `currentTime` (Buffer Pos) to Wall Time before passing?
            // currentTime={currentTime / effectivePlaybackRate}
            currentTime={currentTime / effectivePlaybackRate}
            duration={displayDuration}
            onPlayPause={isPlaying ? pauseAudio : playAudio}
          />
        </main>

        {/* 3. Right Sidebar: Controls & Generation */}
        <aside className="w-80 border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] h-full hidden lg:flex flex-col">
          <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-primary)]">
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-[var(--color-accent)]" />
              <span className="font-bold tracking-tight text-xs uppercase">生成面板</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />

            <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent"></div>

            <VoiceSelector
              settings={settings}
              onSettingsChange={setSettings}
              onOpenModal={() => setIsVoicesModalOpen(true)}
              voiceMeta={VOICE_META}
            />

            <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent"></div>

            <AudioControls
              settings={settings}
              onSettingsChange={setSettings}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
            />
          </div>

          {/* New Footer Generation Button Area */}
          <div className="p-5 h-30 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-subtle)] flex flex-col justify-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="btn-primary cursor-pointer w-full flex items-center justify-center gap-3 active:scale-[0.96]"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm tracking-widest">正在神经渲染...</span>
                </>
              ) : (
                <>
                  <Terminal size={16} />
                  <span className="text-sm tracking-[0.1em]">开始渲染语音流</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Voices Full List Modal */}
      {isVoicesModalOpen && (
        <VoicesModal
          selectedVoice={settings.voice}
          onSelect={(voice) => setSettings(prev => ({ ...prev, voice }))}
          onClose={() => setIsVoicesModalOpen(false)}
          voiceMeta={VOICE_META}
          onPreview={handlePreviewVoice}
          previewingVoice={previewingVoice}
        />
      )}

      {/* Mobile Drawer Button - Redesigned */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => createNewFile()}
          className="w-14 h-14 bg-[var(--color-accent)] text-white rounded-full shadow-[0_8px_24px_var(--accent-soft)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
