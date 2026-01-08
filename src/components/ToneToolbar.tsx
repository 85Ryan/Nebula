import React, { useRef } from 'react';
import { Zap, Timer, Mic, Star, Key, VenetianMask, Coffee, Siren, Target, Heart, Sparkles } from 'lucide-react';

interface ToneToolbarProps {
    onInsert: (tag: string) => void;
}

const TONES = [
    { id: 'EXPLOSIVE', label: '爆发感', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    { id: 'SPEED_RUN', label: '倍速解说', icon: Timer, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { id: 'EMPHASIZE', label: '重点强调', icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
    { id: 'AMAZED', label: '惊叹', icon: Star, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { id: 'SECRETIVE', label: '神秘耳语', icon: Key, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
    { id: 'SARCASTIC', label: '讽刺/吐槽', icon: VenetianMask, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' },
    { id: 'CASUAL', label: '轻松随圆', icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { id: 'WARNING', label: '警告/紧急', icon: Siren, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'CHALLENGING', label: '挑战/互动', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
    { id: 'SINCERE', label: '真诚呼吁', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
];

export function ToneToolbar({ onInsert }: ToneToolbarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    return (
        <div
            className="flex items-center gap-2 overflow-x-auto py-2 px-1 mb-2 custom-scrollbar select-none"
            ref={scrollContainerRef}
            onWheel={handleWheel}
        >
            <div className="flex items-center gap-1.5 pr-4">
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider shrink-0 mr-1 opacity-60">
                    <Sparkles size={10} className="inline mr-1" />
                    Tone
                </span>
                {TONES.map((tone) => (
                    <button
                        key={tone.id}
                        onClick={() => onInsert(tone.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-medium transition-all hover:brightness-125 whitespace-nowrap group active:scale-95 ${tone.bg} ${tone.border} ${tone.color}`}
                    >
                        <tone.icon size={11} strokeWidth={2.5} />
                        <span>{tone.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
