import React from 'react';

interface TextInputProps {
    text: string;
    onChange: (text: string) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    isGenerating: boolean;
}

export function TextInput({ text, onChange, prompt, onPromptChange }: TextInputProps) {
    return (
        <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)] overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
            {/* Prompt Area */}
            <div className="flex flex-col border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/50 py-4">
                <div className="flex items-center px-6 pb-2 gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">系统提示词 (Prompt)</span>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="输入指令，例如：用沉稳有磁性的男声朗读，在重点词汇处稍作停顿..."
                    className="w-full h-60 bg-transparent border-none resize-none px-6 focus:ring-0 text-sm leading-6 placeholder-[var(--color-text-secondary)]/40 focus:outline-none text-[var(--color-text-primary)] font-sans"
                    spellCheck={false}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative py-4">
                <div className="flex items-center px-6 pb-2 gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">待转换正文</span>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="在此输入需要转换的内容..."
                    className="flex-1 w-full bg-transparent border-none resize-none px-6 focus:ring-0 text-[15px] leading-8 placeholder-[var(--color-text-secondary)]/40 focus:outline-none text-[var(--color-text-primary)]"
                    spellCheck={false}
                />

                <div className="px-6 pt-4 flex justify-between items-center border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/30">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wider">
                        已输入 {text.length} 字符
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] opacity-40 font-mono">
                        MODERN NEURAL ENGINE 2.5
                    </span>
                </div>
            </div>
        </div>
    );
}
