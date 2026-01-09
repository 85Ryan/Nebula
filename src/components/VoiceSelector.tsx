import React from 'react';
import { ChevronDown, Headset, Check } from 'lucide-react';
import { VoiceName, AudioSettings, VoiceMetadata } from '../types';

interface VoiceSelectorProps {
    settings: AudioSettings;
    onSettingsChange: (settings: AudioSettings) => void;
    onOpenModal: () => void;
    voiceMeta: Record<VoiceName, VoiceMetadata>;
}

export function VoiceSelector({
    settings,
    onSettingsChange,
    onOpenModal,
    voiceMeta
}: VoiceSelectorProps) {
    // Current selected voice should be the first one
    const selectedVoiceId = settings.voice;

    // Recommendations: take some diverse voices, excluding the selected one
    const recommendations: VoiceName[] = [
        VoiceName.Charon,
        VoiceName.Kore,
        VoiceName.Fenrir,
        VoiceName.Puck,
        VoiceName.Zephyr
    ].filter(v => v !== selectedVoiceId).slice(0, 5);

    // Always ensure we have 5 recommendations if the current one was one of them
    if (recommendations.length < 5) {
        const others = Object.values(VoiceName).filter(v => v !== selectedVoiceId && !recommendations.includes(v));
        recommendations.push(...others.slice(0, 5 - recommendations.length));
    }

    // Dynamic import of all avatars
    const avatarGlob = import.meta.glob('/src/assets/avatars/*.png', { eager: true, query: '?url', import: 'default' });

    // Helper to get bundled URL
    const getAvatarSrc = (name: string) => {
        // Try exact match first
        const path = `/src/assets/avatars/${name}.png`;
        if (avatarGlob[path]) return avatarGlob[path];
        return null;
    };

    const displayedVoices = [selectedVoiceId, ...recommendations];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Headset size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">音色模型选择</span>
                </div>
            </div>

            <div className="bg-[var(--color-bg-primary)]/40 border border-[var(--color-glass-border)] rounded-lg pt-2 flex flex-col items-center overflow-hidden">
                <div className="grid grid-cols-3 gap-y-2 gap-x-2 w-full space-between p-2">
                    {displayedVoices.map((v) => {
                        const meta = voiceMeta[v];
                        const isSelected = v === selectedVoiceId;
                        const avatarSrc = getAvatarSrc(meta.name);
                        return (
                            <button
                                key={v}
                                onClick={() => onSettingsChange({ ...settings, voice: v })}
                                className="flex flex-col items-center gap-2 group outline-none"
                            >
                                <div className={`relative w-14 h-14 rounded-full border-2 transition-all duration-300 transform group-hover:scale-110
                                    ${isSelected ? 'border-[var(--color-accent)] shadow-[0_0_15px_var(--accent-soft)]' : 'border-transparent group-hover:border-[var(--color-glass-border)]'}`}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] border border-[var(--color-glass-border)] flex items-center justify-center">
                                        <img
                                            src={avatarSrc || `https://ui-avatars.com/api/?name=${meta.name}&background=random&color=fff&size=128`}
                                            alt={meta.name}
                                            className={`w-full h-full object-contain ${avatarSrc ? 'p-1' : 'object-cover'}`}
                                            onError={(e) => {
                                                // Fallback to initial
                                                const target = e.target as HTMLImageElement;
                                                target.src = `https://ui-avatars.com/api/?name=${meta.name}&background=random&color=fff&size=128`;
                                                target.classList.remove('object-contain', 'p-1');
                                                target.classList.add('object-cover');
                                            }}
                                        />
                                    </div>
                                    {isSelected && (
                                        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]">
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-accent)] text-white rounded-full flex items-center justify-center shadow-lg animate-fade-in">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium transition-all truncate w-full text-center
                                    ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'}`}>
                                    {meta.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={onOpenModal}
                    className="mt-2 w-full flex items-center justify-center p-0.5 bg-[var(--color-bg-hover)]/30 hover:bg-[var(--color-bg-hover)]/60 transition-all group"
                    title="显示全部声音"
                >
                    <ChevronDown size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-transform group-hover:translate-y-0.5" />
                </button>
            </div>
        </div>
    );
}
