import React, { useState } from 'react';
import { X, ShieldCheck, Eye, EyeOff, Save } from 'lucide-react';

interface SettingsModalProps {
    apiKey: string;
    onSave: (key: string) => void;
    onClose: () => void;
}

export function SettingsModal({ apiKey, onSave, onClose }: SettingsModalProps) {
    const [inputKey, setInputKey] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);

    const maskKey = (key: string) => {
        if (!key) return "";
        if (key.length <= 4) return key;
        return `•••• •••• ${key.slice(-4)}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in px-4">
            <div className="w-full max-w-[420px] bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-5 flex justify-between items-center border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                            <ShieldCheck size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold tracking-tight text-sm">配置中心</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-[var(--color-bg-secondary)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Google Gemini API 密钥</label>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-[var(--color-accent)] hover:underline font-medium">获取密钥</a>
                        </div>

                        <div className="relative group">
                            <input
                                type={showKey ? "text" : "password"}
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                placeholder="请输入您的 API Key"
                                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all font-mono"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                                    title={showKey ? "隐藏密钥" : "显示密钥"}
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-secondary)]/50 p-3 rounded-lg border border-[var(--color-border-subtle)]">
                            ⚠️ <strong>安全提示：</strong>您的密钥仅存储在本地浏览器的副本中，我们承诺不会将其上传至任何第三方服务器。
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[var(--color-border-subtle)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => {
                            onSave(inputKey);
                            onClose();
                        }}
                        className="btn-primary flex items-center gap-2 py-2 text-xs"
                    >
                        <Save size={14} />
                        <span>保存配置</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
