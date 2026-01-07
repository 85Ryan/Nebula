import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import { TTSModel } from '../types';

interface ModelSelectorProps {
    selectedModel: TTSModel;
    onModelChange: (model: TTSModel) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
                    选用引擎模型
                </label>
                <span className="text-[10px] bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 rounded font-bold uppercase">
                    V2.5 Preview
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)]">
                <button
                    onClick={() => onModelChange(TTSModel.Flash)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-300 cursor-pointer group
            ${selectedModel === TTSModel.Flash
                            ? 'bg-[var(--color-accent)] text-white shadow-md'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                >
                    <Zap size={14} className={selectedModel === TTSModel.Flash ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]'} />
                    <div className="flex flex-col items-start translate-y-[1px]">
                        <span className="text-xs font-bold leading-none mb-0.5">Flash</span>
                        <span className={`text-[9px] opacity-60 leading-none ${selectedModel === TTSModel.Flash ? 'text-white' : ''}`}>低延迟 / 高效率</span>
                    </div>
                </button>

                <button
                    onClick={() => onModelChange(TTSModel.Pro)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all duration-300 cursor-pointer group
            ${selectedModel === TTSModel.Pro
                            ? 'bg-[var(--color-accent)] text-white shadow-md'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                >
                    <Cpu size={14} className={selectedModel === TTSModel.Pro ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]'} />
                    <div className="flex flex-col items-start translate-y-[1px]">
                        <span className="text-xs font-bold leading-none mb-0.5">Pro</span>
                        <span className={`text-[9px] opacity-60 leading-none ${selectedModel === TTSModel.Pro ? 'text-white' : ''}`}>高质量 / 强推理</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
