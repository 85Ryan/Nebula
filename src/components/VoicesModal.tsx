import React from 'react';
import { X, AudioLines, Volume2, Check, ExternalLink } from 'lucide-react';
import { VoiceName, VoiceMetadata } from '../types';

interface VoicesModalProps {
    selectedVoice: VoiceName;
    onSelect: (voice: VoiceName) => void;
    onClose: () => void;
    voiceMeta: Record<VoiceName, VoiceMetadata>;
    onPreview: (e: React.MouseEvent, voice: VoiceName) => void;
    previewingVoice: VoiceName | null;
}

export function VoicesModal({
    selectedVoice,
    onSelect,
    onClose,
    voiceMeta,
    onPreview,
    previewingVoice
}: VoicesModalProps) {
    const voices = Object.values(voiceMeta);

    // Dynamic import of all avatars
    const avatarGlob = import.meta.glob('/src/assets/avatars/*.png', { eager: true, query: '?url', import: 'default' });

    // Helper to get bundled URL
    const getAvatarSrc = (name: string) => {
        // Try exact match first
        const path = `/src/assets/avatars/${name}.png`;
        if (avatarGlob[path]) return avatarGlob[path];

        // Fallback or debug
        // console.warn(`Missing avatar bundle for: ${name}`);
        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl max-h-[85vh] bg-[var(--color-bg-primary)] border border-[var(--color-glass-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-xl">
                            <AudioLines size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">全部声音库</h2>
                            <p className="text-sm text-[var(--color-text-secondary)]">探索 Gemini 2.5 提供的所有 30 种神经渲染声音</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-full text-[var(--color-text-secondary)] transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Sub-header / Search - Proactive enhancement if time permits, for now just a label */}
                <div className="px-6 py-4 bg-[var(--color-bg-secondary)]/30 flex items-center justify-between shrink-0">
                    <div className="flex gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-50">共计 30 个音色</span>
                    </div>
                    <a
                        href="https://ai.google.dev/gemini-api/docs/speech-generation?hl=zh-cn#voices"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-accent)] hover:underline"
                    >
                        官方文档 <ExternalLink size={10} />
                    </a>
                </div>

                {/* Body - Grid */}
                <div className="flex-1 overflow-y-auto px-6 pb-12 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {voices.map((meta) => {
                            const avatarSrc = getAvatarSrc(meta.name);
                            return (
                                <div
                                    key={meta.id}
                                    className={`group flex flex-col p-4 rounded-xl border transition-all duration-300 relative
                                    ${selectedVoice === meta.id
                                            ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]'
                                            : 'bg-transparent border-[var(--color-glass-border)]/75 hover:border-[var(--color-glass-border)] hover:bg-[var(--color-bg-secondary)]'}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all
                                            ${selectedVoice === meta.id ? 'border-[var(--color-accent)]' : 'border-transparent group-hover:border-[var(--color-glass-border)]'}`}>
                                                <img
                                                    src={avatarSrc || `https://ui-avatars.com/api/?name=${meta.name}&background=random&color=fff&size=128`}
                                                    alt={meta.name}
                                                    className={`w-full h-full object-contain bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] ${avatarSrc ? 'p-1' : 'object-cover'}`}
                                                    onError={(e) => {
                                                        // Fallback to initial
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://ui-avatars.com/api/?name=${meta.name}&background=random&color=fff&size=128`;
                                                        target.classList.remove('object-contain', 'p-1');
                                                        target.classList.add('object-cover');
                                                    }}
                                                />
                                            </div>
                                            {selectedVoice === meta.id && (
                                                <div className="absolute -bottom-0 -right-0 w-4 h-4 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center shadow-lg animate-fade-in">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-[var(--color-text-primary)] truncate">{meta.name}</h3>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase
                                                ${meta.gender === 'Female' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {meta.gender === 'Female' ? '女' : '男'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {meta.tags.map(tag => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-[var(--color-bg-primary)]/50 text-[var(--color-text-secondary)] rounded-md border border-[var(--color-glass-border)]">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 mt-3 mb-4 flex-1">
                                        {meta.description}
                                    </p>

                                    <div className="flex items-center gap-2 mt-auto">
                                        <button
                                            onClick={(e) => onPreview(e, meta.id)}
                                            disabled={previewingVoice !== null}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
                                            ${previewingVoice === meta.id
                                                    ? 'bg-[var(--color-accent)] text-white'
                                                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-glass-border)]'}`}
                                        >
                                            {previewingVoice === meta.id ? (
                                                <>
                                                    <div className="flex gap-0.5 items-end mb-0.5">
                                                        <div className="w-0.5 h-2 bg-current animate-[wave_1s_infinite] origin-bottom"></div>
                                                        <div className="w-0.5 h-3 bg-current animate-[wave_1s_infinite_-0.2s] origin-bottom"></div>
                                                        <div className="w-0.5 h-1.5 bg-current animate-[wave_1s_infinite_-0.4s] origin-bottom"></div>
                                                        <div className="w-0.5 h-1 bg-current animate-[wave_1s_infinite_-0.6s] origin-bottom"></div>
                                                    </div>
                                                    试听中...
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 size={12} />
                                                    试听音色
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => onSelect(meta.id)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all
                                            ${selectedVoice === meta.id
                                                    ? 'bg-[var(--color-accent)] text-white shadow-[0_4px_12px_var(--accent-soft)]'
                                                    : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white'}`}
                                        >
                                            {selectedVoice === meta.id ? '已选择' : '选择'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
