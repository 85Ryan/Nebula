import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Settings, Sun, Moon, Laptop, Palette } from 'lucide-react';

interface HeaderProps {
    onOpenSettings: () => void;
    theme: 'light' | 'dark' | 'system';
    onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function Header({ onOpenSettings, theme, onThemeChange }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const getThemeIcon = (t: 'light' | 'dark' | 'system') => {
        switch (t) {
            case 'light': return <Sun size={14} />;
            case 'dark': return <Moon size={14} />;
            case 'system': return <Laptop size={14} />;
        }
    };

    const getThemeLabel = (t: 'light' | 'dark' | 'system') => {
        switch (t) {
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            case 'system': return 'System';
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];

    return (
        <header className="h-14 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] flex items-center justify-between px-4 shrink-0 z-50">
            <div className="flex items-center gap-2.5 group cursor-default">
                <div className="w-7 h-7 flex items-center justify-center">
                    <img src="/logo.svg" alt="Nebula Logo" className="w-full h-full" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xs font-bold tracking-[0.2em] text-[var(--color-text-primary)]">NEBULA</h1>
                    <span className="text-[8px] font-medium text-[var(--color-text-secondary)] tracking-widest uppercase opacity-80">星云智能语音引擎</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md transition-all border border-transparent 
                        ${isMenuOpen ? 'bg-[var(--color-bg-secondary)] border-[var(--color-glass-border)]' : 'hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-glass-border)]'}`}
                        title="选择主题"
                    >
                        <Palette size={18} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 w-36 bg-[var(--color-bg-primary)]/95 border border-[var(--color-glass-border)] rounded-lg p-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                            {themes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        onThemeChange(t);
                                        setIsMenuOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                                    ${theme === t
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]/50 hover:text-[var(--color-text-primary)]'}`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${theme === t ? 'bg-[var(--color-text-primary)] scale-100' : 'bg-transparent scale-0'}`}></div>
                                    <div className="flex-1 flex items-center gap-2.5">
                                        <span className={`transition-all ${theme === t
                                            ? 'text-[var(--color-text-primary)]'
                                            : 'text-[var(--color-text-secondary)] opacity-60 group-hover:text-[var(--color-text-primary)] group-hover:opacity-100'}`}>
                                            {getThemeIcon(t)}
                                        </span>
                                        <span className="text-xs font-medium">{getThemeLabel(t)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-1"></div>

                <button
                    onClick={onOpenSettings}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-md transition-all border border-transparent hover:border-[var(--color-glass-border)]"
                    title="设置"
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
}
