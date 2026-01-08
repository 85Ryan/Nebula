import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const styles = {
        success: {
            icon: CheckCircle2,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
        },
        error: {
            icon: AlertCircle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
        },
        info: {
            icon: Info,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
        },
    };

    const currentStyle = styles[type];
    const Icon = currentStyle.icon;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-full backdrop-blur-md shadow-2xl border ${currentStyle.bg} ${currentStyle.border}`}>
                <Icon size={18} className={currentStyle.color} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{message}</span>
                <button
                    onClick={onClose}
                    className="ml-2 p-1 hover:bg-[var(--color-bg-hover)] rounded-full transition-colors opacity-50 hover:opacity-100"
                >
                    <X size={14} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>
        </div>
    );
}
