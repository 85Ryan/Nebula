import React, { useState, useEffect, useRef } from 'react';
import { GlassPanel } from './components/GlassPanel';
import { 
  FileText, Plus, Trash2, Settings2, Play, Pause, Download, 
  Volume2, Mic, Activity, Loader2, User, Sparkles, Music2, Terminal
} from './components/Icons';
import { TextFile, AudioSettings, VoiceName, GeneratedAudio, VoiceMetadata } from './types';
import { saveFile, getFiles, deleteFile } from './db';
import { generateSpeech } from './services/geminiService';
import { base64ToUint8Array, createWavFile } from './audioUtils';

// --- Constants & Data ---

const DEFAULT_SETTINGS: AudioSettings = {
  voice: VoiceName.Zephyr, // Default to Zephyr (Best for generic Chinese)
  pitch: 0,
  speed: 1.0,
  volume: 1.0,
  format: 'wav',
};

const SAMPLE_RATE = 24000;

// Voice Metadata for UI
// Ordered by suitability for Chinese Mandarin
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
};

export default function App() {
  // -- State --
  const [files, setFiles] = useState<TextFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('tts_settings');
    // Ensure the saved voice exists in our current map, otherwise fallback
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    return parsed;
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
    loadFiles();
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
        if (file && file.content !== text) {
          const updatedFile = { ...file, content: text };
          // Optimistically update local state
          setFiles(prev => prev.map(f => f.id === activeFileId ? updatedFile : f));
          saveFile(updatedFile);
        }
      }
    }, 800);
    return () => clearTimeout(saveTimeout);
  }, [text, activeFileId]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (generatedAudio?.url) URL.revokeObjectURL(generatedAudio.url);
    };
  }, []);

  // -- Actions --

  const loadFiles = async () => {
    const loadedFiles = await getFiles();
    setFiles(loadedFiles);
    if (!activeFileId && loadedFiles.length > 0) {
      setActiveFileId(loadedFiles[0].id);
      setText(loadedFiles[0].content);
    }
  };

  const createNewFile = async (initialContent: string = '') => {
    const newFile: TextFile = {
      id: crypto.randomUUID(),
      title: `未命名草稿 ${files.length + 1}`,
      content: initialContent,
      createdAt: Date.now(),
    };
    await saveFile(newFile);
    const updatedFiles = await getFiles(); 
    setFiles(updatedFiles);
    setActiveFileId(newFile.id);
    setText(initialContent);
    setGeneratedAudio(null);
    return newFile.id;
  };

  const handleTextChange = async (newText: string) => {
    setText(newText);
    if (!activeFileId && files.length === 0 && newText.length > 0) {
      await createNewFile(newText);
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
      } else {
        setActiveFileId(null);
        setText('');
      }
      setGeneratedAudio(null);
      stopAudio();
    }
  };

  const handleFileSelect = (file: TextFile) => {
    setActiveFileId(file.id);
    setText(file.content);
    setGeneratedAudio(null);
    stopAudio();
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

    setPreviewingVoice(voice);
    try {
      // Updated preview text for better Chinese representation
      const sampleText = "您好，我是您的智能语音助手。";
      const base64 = await generateSpeech({ text: sampleText, voice });
      const rawBytes = base64ToUint8Array(base64);
      
      const samples = new Float32Array(rawBytes.length / 2);
      const dataView = new DataView(rawBytes.buffer);
      for (let i = 0; i < samples.length; i++) {
         samples[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }
      const wavBlob = createWavFile(samples, SAMPLE_RATE);
      const url = URL.createObjectURL(wavBlob);
      
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewingVoice(null);
      audio.play();
    } catch (err) {
      console.error(err);
      setPreviewingVoice(null);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    stopAudio();
    setGeneratedAudio(null);

    try {
      const base64 = await generateSpeech({ text, voice: settings.voice });
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

      setGeneratedAudio({ url, blob: wavBlob, duration: buffer.duration });

    } catch (err) {
      alert("生成失败，请检查网络或 API Key");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    initAudioContext();

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
    startTimeRef.current = audioContextRef.current.currentTime - offset;

    source.start(0, offset);
    setIsPlaying(true);

    source.onended = () => {
      const expectedEnd = startTimeRef.current + (audioBufferRef.current?.duration || 0) / settings.speed;
      if (audioContextRef.current && audioContextRef.current.currentTime >= expectedEnd - 0.1) {
        setIsPlaying(false);
        pausedTimeRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      pausedTimeRef.current = (audioContextRef.current.currentTime - startTimeRef.current) * settings.speed; 
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
    }
    setIsPlaying(false);
    pausedTimeRef.current = 0;
    setCurrentTime(0);
  };

  useEffect(() => {
    let animFrame: number;
    const updateProgress = () => {
      if (isPlaying && audioContextRef.current && startTimeRef.current) {
        const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * settings.speed;
        setCurrentTime(Math.max(0, elapsed));
        animFrame = requestAnimationFrame(updateProgress);
      }
    };
    if (isPlaying) {
      animFrame = requestAnimationFrame(updateProgress);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, settings.speed]);

  // -- Render --

  return (
    <div className="flex h-screen w-full text-gray-300 font-sans selection:bg-tech-blue/30 selection:text-white">
      
      {/* 1. Left Sidebar: File List */}
      <GlassPanel className="w-72 m-4 flex flex-col border-r-0 mr-2 z-10 hidden md:flex">
        <div className="p-5 border-b border-glass-border flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-2 text-tech-blue drop-shadow-[0_0_8px_rgba(0,132,255,0.4)]">
            <Terminal size={18} />
            <span className="font-bold tracking-wider text-sm">ARCHIVE</span>
          </div>
          <button 
            onClick={() => createNewFile()}
            className="p-1.5 hover:bg-tech-blue/20 rounded-lg transition-all text-gray-400 hover:text-tech-blue active:scale-95"
            title="新建文件"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {files.map(file => (
            <div 
              key={file.id}
              onClick={() => handleFileSelect(file)}
              className={`group flex items-center justify-between p-3.5 rounded-lg cursor-pointer transition-all duration-300 border 
                ${activeFileId === file.id 
                  ? 'bg-tech-blue/10 border-tech-blue/30 shadow-[inset_0_0_20px_rgba(0,132,255,0.1)]' 
                  : 'border-transparent hover:bg-white/5 hover:border-white/5'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText size={16} className={`transition-colors ${activeFileId === file.id ? 'text-tech-blue drop-shadow-[0_0_5px_rgba(0,132,255,0.5)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                <div className="flex flex-col truncate">
                  <span className={`text-sm font-medium truncate transition-colors ${activeFileId === file.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {file.title}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono mt-0.5">{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button 
                onClick={(e) => handleDeleteFile(e, file.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-24 text-gray-700 space-y-3">
              <div className="p-4 rounded-full bg-white/5 mb-1">
                <FileText size={24} className="opacity-40"/>
              </div>
              <span className="text-xs font-medium uppercase tracking-widest opacity-60">No Data</span>
              <span className="text-[10px] opacity-40">开始输入以创建记录</span>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* 2. Middle: Main Content */}
      <div className="flex-1 flex flex-col m-4 mx-2 gap-4 relative z-0">
        
        {/* Input Area */}
        <GlassPanel className="flex-1 flex flex-col p-1 relative overflow-hidden group">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tech-blue to-transparent opacity-50 shadow-[0_0_10px_#0084FF]"></div>
          
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="等待指令输入 // 文本转语音系统就绪..."
            className="w-full h-full bg-transparent border-none resize-none p-8 focus:ring-0 text-lg leading-loose placeholder-gray-700 focus:outline-none text-gray-200 font-mono"
            spellCheck={false}
          />
          <div className="absolute bottom-4 right-4 text-xs text-tech-blue/60 bg-black/60 px-3 py-1.5 rounded border border-tech-blue/20 font-mono backdrop-blur-md">
            LENGTH: {text.length}
          </div>
        </GlassPanel>

        {/* Player Area */}
        <GlassPanel className="h-36 flex flex-col justify-center px-8 py-5 relative">
            {!generatedAudio && !isGenerating && (
               <div className="flex items-center justify-center h-full text-gray-600 gap-3">
                 <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                 <span className="text-xs font-mono uppercase tracking-widest">System Idle</span>
               </div>
            )}
            
            {isGenerating && (
              <div className="flex items-center justify-center h-full gap-4 text-tech-blue animate-pulse">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-sm font-mono tracking-widest uppercase">Processing Audio Stream...</span>
              </div>
            )}

            {generatedAudio && !isGenerating && (
              <div className="flex items-center gap-8">
                <button 
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-tech-blue text-white shadow-[0_0_20px_rgba(0,132,255,0.4)] hover:bg-white hover:text-tech-blue transition-all active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                  {isPlaying ? <Pause size={28} fill="currentColor" className="relative z-10" /> : <Play size={28} fill="currentColor" className="ml-1 relative z-10" />}
                </button>

                <div className="flex-1 flex flex-col gap-3">
                   {/* Visualizer Bar */}
                   <div className="h-10 flex items-end gap-[4px] opacity-100">
                     {Array.from({ length: 50 }).map((_, i) => (
                       <div 
                        key={i} 
                        className={`flex-1 rounded-[1px] transition-all duration-100 ${isPlaying ? 'bg-tech-blue shadow-[0_0_8px_rgba(0,132,255,0.6)]' : 'bg-gray-800'}`}
                        style={{ height: isPlaying ? `${10 + Math.random() * 90}%` : '5%' }}
                      ></div>
                     ))}
                   </div>
                   {/* Progress Bar */}
                   <div className="relative w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="absolute top-0 left-0 h-full bg-tech-blue shadow-[0_0_15px_#0084FF]"
                        style={{ width: `${(currentTime / (generatedAudio.duration || 1)) * 100}%` }}
                      ></div>
                   </div>
                   <div className="flex justify-between text-[10px] text-tech-blue/80 font-mono tracking-widest">
                     <span>{currentTime.toFixed(2)}s</span>
                     <span>{generatedAudio.duration?.toFixed(2)}s</span>
                   </div>
                </div>

                <a 
                  href={generatedAudio.url} 
                  download={`aether-voice-${Date.now()}.wav`}
                  className="p-4 rounded-xl border border-white/5 hover:border-tech-blue/50 hover:bg-tech-blue/10 text-gray-400 hover:text-tech-blue transition-all group"
                  title="Export WAV"
                >
                  <Download size={20} className="group-hover:drop-shadow-[0_0_5px_rgba(0,132,255,0.8)]"/>
                </a>
              </div>
            )}
        </GlassPanel>

        {/* Generate Button (Floating) */}
        <div className="absolute bottom-40 right-8 md:bottom-40 md:right-8 lg:static lg:self-end lg:mb-0">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="group relative flex items-center gap-3 px-10 py-3.5 bg-tech-blue text-white font-bold rounded-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,132,255,0.3)] hover:shadow-[0_0_50px_rgba(0,132,255,0.6)] hover:bg-white hover:text-tech-blue transition-all active:scale-95 uppercase tracking-wider text-sm clip-path-button"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <Sparkles size={16} className="group-hover:animate-ping" />
            <span>Initialize Synthesis</span>
          </button>
        </div>

      </div>

      {/* 3. Right Sidebar: Settings */}
      <GlassPanel className="w-80 m-4 ml-2 flex flex-col border-l-0 hidden lg:flex">
        <div className="p-5 border-b border-glass-border flex items-center gap-2 text-tech-blue bg-black/20">
          <Settings2 size={18} className="drop-shadow-[0_0_5px_rgba(0,132,255,0.5)]"/>
          <span className="font-bold tracking-wider text-sm uppercase">CONTROLS</span>
        </div>

        <div className="p-5 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Advanced Voice Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Music2 size={14} className="text-gray-500"/>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Voice Model</label>
            </div>
            
            <div className="flex flex-col gap-3">
              {Object.values(VOICE_META).map((meta) => {
                 const isSelected = settings.voice === meta.id;
                 const isPreviewing = previewingVoice === meta.id;
                 return (
                   <div 
                    key={meta.id}
                    onClick={() => setSettings(s => ({ ...s, voice: meta.id }))}
                    className={`relative p-3.5 rounded border transition-all cursor-pointer group
                      ${isSelected 
                        ? 'bg-tech-blue/10 border-tech-blue shadow-[0_0_15px_rgba(0,132,255,0.15)]' 
                        : 'bg-black/20 border-white/5 hover:border-tech-blue/40'
                      }`}
                   >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center rounded ${isSelected ? 'bg-tech-blue text-white shadow-[0_0_10px_#0084FF]' : 'bg-gray-800 text-gray-500'}`}>
                            <span className="text-xs font-bold">{meta.name[0]}</span>
                          </div>
                          <div>
                            <div className={`text-sm font-bold tracking-wide ${isSelected ? 'text-white text-glow' : 'text-gray-400 group-hover:text-gray-200'}`}>
                              {meta.name}
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono uppercase">{meta.gender}</div>
                          </div>
                        </div>
                        {/* Preview Button */}
                        <button
                          onClick={(e) => handlePreviewVoice(e, meta.id)}
                          className={`p-2 rounded hover:scale-105 active:scale-95 transition-all ${isPreviewing ? 'text-tech-blue animate-pulse' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}
                          title="试听"
                        >
                          {isPreviewing ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14}/>}
                        </button>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1.5 opacity-80">
                        {meta.tags.map(tag => (
                          <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${tag.includes('首选') || tag.includes('推荐') ? 'bg-tech-blue/20 text-tech-blue border-tech-blue/30' : 'bg-white/5 text-gray-400 border-white/5'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-gray-500 leading-snug">
                         {meta.description}
                      </div>
                   </div>
                 );
              })}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent w-full"></div>

          {/* Sliders */}
          <div className="space-y-6">
            {/* Pitch */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pitch</label>
                  <span className="text-xs font-mono text-tech-blue">{settings.pitch > 0 ? '+' : ''}{settings.pitch}</span>
               </div>
               <input 
                 type="range" 
                 min="-1200" 
                 max="1200" 
                 step="100"
                 value={settings.pitch}
                 onChange={(e) => setSettings(s => ({ ...s, pitch: Number(e.target.value) }))}
                 className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-tech-blue hover:accent-white transition-all"
               />
            </div>

            {/* Speed */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Speed</label>
                  <span className="text-xs font-mono text-tech-blue">{settings.speed}x</span>
               </div>
               <input 
                 type="range" 
                 min="0.5" 
                 max="2.0" 
                 step="0.1"
                 value={settings.speed}
                 onChange={(e) => setSettings(s => ({ ...s, speed: Number(e.target.value) }))}
                 className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-tech-blue hover:accent-white transition-all"
               />
            </div>

            {/* Volume */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gain</label>
                  <span className="text-xs font-mono text-tech-blue">{(settings.volume * 100).toFixed(0)}%</span>
               </div>
               <input 
                  type="range" 
                  min="0" 
                  max="2.0" 
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => setSettings(s => ({ ...s, volume: Number(e.target.value) }))}
                  className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-tech-blue hover:accent-white transition-all"
                />
            </div>
          </div>

          {/* Reset Button */}
          <button 
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            className="w-full py-3 mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-white border border-gray-800 hover:border-gray-500 hover:bg-white/5 rounded transition-all"
          >
            Reset Parameters
          </button>

        </div>
      </GlassPanel>

      {/* Mobile Drawer Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button onClick={() => createNewFile()} className="p-3 bg-tech-blue rounded-full shadow-[0_0_20px_#0084FF] text-white">
           <Plus size={20} />
        </button>
      </div>

    </div>
  );
}