import React from 'react';
import { Play, Pause, Download, Volume2, Activity } from 'lucide-react';
import { GeneratedAudio } from '../types';

interface AudioPlayerProps {
    generatedAudio: GeneratedAudio | null;
    isGenerating: boolean;
    isPlaying: boolean;
    currentTime: number;
    duration?: number; // Calculated effective duration
    onPlayPause: () => void;
}

export function AudioPlayer({ generatedAudio, isGenerating, isPlaying, currentTime, duration, onPlayPause }: AudioPlayerProps) {
    // Use passed duration, or fallback to file duration, or 1 to avoid div by zero
    const displayDuration = duration || generatedAudio?.duration || 1;
    const progress = generatedAudio ? (currentTime / displayDuration) * 100 : 0;

    return (
        <div className="mt-4 flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl py-6 px-8 overflow-hidden relative">
            {!generatedAudio && !isGenerating && (
                <div className="flex items-center justify-center h-12 text-[var(--color-text-secondary)]/50 gap-2.5">
                    <Activity size={16} strokeWidth={1} />
                    <span className="text-[11px] font-medium tracking-[0.2em] uppercase">声音引擎就绪</span>
                </div>
            )}

            {isGenerating && (
                <div className="flex items-center justify-center h-12 gap-3 text-[var(--color-accent)]">
                    <div className="flex gap-1 items-end h-4">
                        <div className="w-0.5 bg-current animate-[wave_1s_infinite] h-2 origin-bottom"></div>
                        <div className="w-0.5 bg-current animate-[wave_1s_infinite_-0.2s] h-4 origin-bottom"></div>
                        <div className="w-0.5 bg-current animate-[wave_1s_infinite_-0.4s] h-3 origin-bottom"></div>
                        <div className="w-0.5 bg-current animate-[wave_1s_infinite_-0.6s] h-1.5 origin-bottom"></div>
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase">正在深度处理音频流...</span>
                </div>
            )}

            {generatedAudio && !isGenerating && (
                <div className="flex items-center gap-10">
                    <button
                        onClick={onPlayPause}
                        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 scale-button
                            ${isPlaying
                                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-lg'
                                : 'bg-[var(--color-accent)] text-white shadow-lg'}`}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mb-0.5">播放中</span>
                                <span className="text-[13px] font-medium text-[var(--color-text-primary)]">预览音频流.wav</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)]/50 px-2.5 py-1 rounded border border-[var(--color-border-subtle)]">
                                <span>{currentTime.toFixed(1)}s</span>
                                <span className="opacity-30">/</span>
                                <span>{displayDuration.toFixed(1)}s</span>
                            </div>
                        </div>

                        <div className="relative w-full h-1 bg-[var(--color-text-secondary)]/10 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--accent-soft)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <a
                        href={generatedAudio.url}
                        download={`nebula-audio-${Date.now()}.wav`}
                        className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all group"
                        title="导出 WAV"
                    >
                        <Download size={20} strokeWidth={2.5} />
                    </a>
                </div>
            )}

            <style>{`
                .scale-button:active { transform: scale(0.92); }
            `}</style>
        </div>
    );
}
