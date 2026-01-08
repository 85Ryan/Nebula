import React from 'react';
import { AlertTriangle, XCircle, Info, Check } from 'lucide-react';

export type DialogType = 'confirm' | 'error' | 'info';

export interface DialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type: DialogType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel: () => void;
}

export function AlertDialog({ isOpen, title, message, type, confirmText = '确定', cancelText = '取消', onConfirm, onCancel }: DialogProps) {
    if (!isOpen) return null;

    const styles = {
        confirm: {
            icon: AlertTriangle,
            iconColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/20',
            btnBg: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
        },
        error: {
            icon: XCircle,
            iconColor: 'text-red-400',
            borderColor: 'border-red-500/30',
            btnBg: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-400',
            borderColor: 'border-blue-500/20',
            btnBg: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20',
        },
    };

    const currentStyle = styles[type];
    const Icon = currentStyle.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Dialog Content */}
            <div className={`relative w-full max-w-sm bg-[var(--color-bg-secondary)] border ${currentStyle.borderColor} rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200`}>
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)]`}>
                            <Icon size={24} className={currentStyle.iconColor} />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
                    </div>

                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex items-center justify-end gap-3 mt-2">
                        {/* Only show cancel if it logic requires choice (confirm) or explicit cancel */}
                        {onConfirm && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (onConfirm) onConfirm();
                                else onCancel(); // If info/error only, main button creates closure
                            }}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all active:scale-95 flex items-center gap-2 ${onConfirm ? currentStyle.btnBg : 'bg-[var(--color-bg-tertiary)] hover:brightness-110 text-[var(--color-text-primary)] border-[var(--color-border-subtle)]'}`}
                        >
                            {/* If error/info, button is usually 'Close' or 'OK' */}
                            {onConfirm ? confirmText : '我知道了'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
