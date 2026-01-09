import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Plus, Terminal } from 'lucide-react';
import { TextFile, AudioSettings, VoiceName, GeneratedAudio, VoiceMetadata } from './types';
import { saveFile, getFiles, deleteFile, savePreview, getPreview, renameFile } from './db';
import { generateSpeech } from './services/geminiService';
import { base64ToUint8Array, createWavFile } from './audioUtils';

// Components
import { Sidebar } from './components/Sidebar';
import { Toast, ToastType } from './components/Toast';
import { AlertDialog, DialogType } from './components/AlertDialog';
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

import { DEFAULT_SETTINGS, SAMPLE_RATE, PREVIEW_TEXT, VOICE_META } from './constants';

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
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [selectedModel, setSelectedModel] = useState<TTSModel>(TTSModel.Flash);

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

  // -- UI State --
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: DialogType;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const showDialog = (type: DialogType, title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // -- Effects --

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    updateAudioNodeParams();
  }, [settings]);

  useEffect(() => {
    loadFiles();
    if (!localStorage.getItem('gemini_api_key')) {
      setIsSettingsOpen(true);
    }
  }, []);

  // Auto-save logic
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (activeFileId) {
        const file = files.find(f => f.id === activeFileId);
        // Deep check is cleaner, but for now simple check
        if (file) {
          const hasChanged =
            file.content !== text ||
            file.prompt !== prompt ||
            JSON.stringify(file.settings) !== JSON.stringify(settings) ||
            file.model !== selectedModel;

          if (hasChanged) {
            const updatedFile = {
              ...file,
              content: text,
              prompt,
              settings,
              model: selectedModel
            };
            setFiles(prev => prev.map(f => f.id === activeFileId ? updatedFile : f));
            saveFile(updatedFile);
          }
        }
      }
    }, 800);
    return () => clearTimeout(saveTimeout);
  }, [text, prompt, activeFileId, settings, selectedModel]);

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
      const firstFile = loadedFiles[0];
      setActiveFileId(firstFile.id);
      setText(firstFile.content);
      setPrompt(firstFile.prompt || "");

      if (firstFile.audioBlob) {
        const url = URL.createObjectURL(firstFile.audioBlob);
        setGeneratedAudio({
          url,
          blob: firstFile.audioBlob,
          duration: firstFile.audioDuration
        });
      }

      // Hydrate settings
      if (firstFile.settings) setSettings(firstFile.settings);
      else setSettings(DEFAULT_SETTINGS);

      if (firstFile.model) setSelectedModel(firstFile.model);
      else setSelectedModel(TTSModel.Flash);
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
    setSettings(DEFAULT_SETTINGS);
    setSelectedModel(TTSModel.Flash);
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

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showDialog(
      'confirm',
      '删除确认',
      '确定要永久删除这个文件吗？此操作无法撤销。',
      async () => {
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
        closeDialog(); // Logic completed, close dialog
      },
      '确认删除'
    );
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
    audioBufferRef.current = null;

    // Reconstruct GeneratedAudio object
    if (file.audioBlob) {
      const url = URL.createObjectURL(file.audioBlob);
      setGeneratedAudio({
        url,
        blob: file.audioBlob,
        duration: file.audioDuration
      });
    } else {
      setGeneratedAudio(null);
    }

    // Hydrate settings
    if (file.settings) setSettings(file.settings);
    else setSettings(DEFAULT_SETTINGS);

    if (file.model) setSelectedModel(file.model);
    else setSelectedModel(TTSModel.Flash);
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
        // Silent error for preview, just reset state
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
        previewAudioRef.current = null;
      };

      // Ensure we actually start playing
      try {
        await audio.play();
      } catch (playError) {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (String(err).includes('403') || String(err).includes('Key')) {
        showDialog('error', '鉴权失败', '密钥验证失败，请在设置中更新您的 API KEY。', () => setIsSettingsOpen(true), '去设置');
      } else {
        showDialog('error', '预览失败', '无法生成语音预览，请稍后重试。');
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

      // Show Success Toast
      showToast('音频生成完成', 'success');

    } catch (err) {
      if (String(err).includes('403') || String(err).includes('Key')) {
        showDialog('error', '鉴权失败', 'API Key 无效或过期，请点击设置图标更新。', () => setIsSettingsOpen(true), '去设置');
      } else {
        showDialog('error', '生成失败', `服务器响应超时或发生错误: ${String(err)}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async () => {
    initAudioContext();
    if (!audioContextRef.current || (!audioBufferRef.current && !generatedAudio)) return;

    // If buffer is missing but we have blob (e.g. loaded from DB), decode it
    if (!audioBufferRef.current && generatedAudio?.blob) {
      try {
        const arrayBuffer = await generatedAudio.blob.arrayBuffer();
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
      } catch (e) {
        showToast("音频解码失败", "error");
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

      {/* Custom UI Overlays */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={closeToast}
      />
      <AlertDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        onCancel={closeDialog}
        confirmText={dialog.confirmText}
      />
    </div>
  );
}
