import React from 'react';
import { FileText, Plus, Trash2, Library } from 'lucide-react';
import { TextFile } from '../types';

interface SidebarProps {
    files: TextFile[];
    activeFileId: string | null;
    onSelect: (file: TextFile) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onCreate: () => void;
}

export function Sidebar({ files, activeFileId, onSelect, onDelete, onCreate }: SidebarProps) {
    return (
        <div className="w-64 flex flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] h-full hidden md:flex">
            <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
                <div className="flex items-center gap-2 text-[var(--color-text-primary)] opacity-80">
                    <Library size={14} strokeWidth={2.5} />
                    <span className="font-bold tracking-tight text-xs uppercase">我的库</span>
                </div>
                <button
                    onClick={onCreate}
                    className="p-1 cursor-pointer hover:bg-[var(--color-accent-soft)] rounded transition-all text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] active:scale-90"
                    title="新建项目"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
                {files.map(file => (
                    <div
                        key={file.id}
                        onClick={() => onSelect(file)}
                        className={`group flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all duration-200 
              ${activeFileId === file.id
                                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-transparent'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]'}`}
                    >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText size={14} className={activeFileId === file.id ? 'text-[var(--color-accent)]' : 'opacity-40'} />
                            <div className="flex flex-col truncate">
                                <span className="text-[13px] font-medium truncate">
                                    {file.title || '无标题草稿'}
                                </span>
                                <span className="text-[9px] opacity-40 font-mono mt-0.5">
                                    {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={(e) => onDelete(e, file.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                            title="删除"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}

                {files.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-12 px-4 py-8 text-center space-y-3 opacity-30">
                        <Library size={24} strokeWidth={1.5} />
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest">空空如也</p>
                            <p className="text-[10px]">点击右上角 + 创建首个项目</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
