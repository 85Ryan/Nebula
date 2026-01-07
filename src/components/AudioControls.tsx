import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { AudioSettings } from '../types';

interface AudioControlsProps {
    settings: AudioSettings;
    onSettingsChange: (settings: AudioSettings) => void;
    onReset: () => void;
}

export function AudioControls({ settings, onSettingsChange, onReset }: AudioControlsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Sliders size={14} className="text-[var(--color-accent)]" />
                <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">声学特性精调</label>
            </div>

            <div className="space-y-7">
                {/* Pitch */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">音调调整 (Pitch)</label>
                        <span className="text-[11px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded">
                            {settings.pitch > 0 ? '+' : ''}{settings.pitch}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="-1200"
                        max="1200"
                        step="100"
                        value={settings.pitch}
                        onChange={(e) => onSettingsChange({ ...settings, pitch: Number(e.target.value) })}
                        className="modern-range w-full"
                    />
                </div>

                {/* Speed */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">播放速度 (Speed)</label>
                        <span className="text-[11px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded">
                            {settings.speed.toFixed(1)}x
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={settings.speed}
                        onChange={(e) => onSettingsChange({ ...settings, speed: Number(e.target.value) })}
                        className="modern-range w-full"
                    />
                </div>

                {/* Volume */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[11px] font-medium text-[var(--color-text-secondary)]">增益补偿 (Gain)</label>
                        <span className="text-[11px] font-mono font-bold text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 rounded">
                            {(settings.volume * 100).toFixed(0)}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2.0"
                        step="0.1"
                        value={settings.volume}
                        onChange={(e) => onSettingsChange({ ...settings, volume: Number(e.target.value) })}
                        className="modern-range w-full"
                    />
                </div>
            </div>

            <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-secondary)] rounded-xl transition-all"
            >
                <RotateCcw size={14} />
                <span>重置为默认引擎参数</span>
            </button>

            <style>{`
                .modern-range {
                    -webkit-appearance: none;
                    height: 4px;
                    background: var(--border-subtle);
                    border-radius: 999px;
                    outline: none;
                }
                .modern-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    background: var(--text-primary);
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px var(--accent-soft);
                    transition: all 0.2s;
                }
                .modern-range::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    background: var(--accent-color);
                }
            `}</style>
        </div>
    );
}
