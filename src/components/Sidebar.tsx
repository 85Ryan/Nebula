import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Library, Edit2, Check, X } from 'lucide-react';
import { TextFile } from '../types';

interface SidebarProps {
    files: TextFile[];
    activeFileId: string | null;
    onSelect: (file: TextFile) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onCreate: () => void;
}

export function Sidebar({ files, activeFileId, onSelect, onDelete, onRename, onCreate }: SidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingId]);

    const startEditing = (e: React.MouseEvent, file: TextFile) => {
        e.stopPropagation();
        setEditingId(file.id);
        setEditTitle(file.title);
    };

    const saveEdit = () => {
        if (editingId && editTitle.trim()) {
            onRename(editingId, editTitle.trim());
            setEditingId(null);
        } else {
            setEditingId(null); // Cancel if empty
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    };

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
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                            <FileText size={14} className={`shrink-0 ${activeFileId === file.id ? 'text-[var(--color-accent)]' : 'opacity-40'}`} />

                            {editingId === file.id ? (
                                <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                    <input
                                        ref={inputRef}
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={saveEdit}
                                        className="w-full bg-[var(--color-bg-primary)] text-[13px] px-1 py-0.5 rounded border border-[var(--color-accent)] outline-none text-[var(--color-text-primary)]"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col truncate min-w-0">
                                    <span className="text-[13px] font-medium truncate">
                                        {file.title || '无标题草稿'}
                                    </span>
                                    <span className="text-[9px] opacity-40 font-mono mt-0.5">
                                        {new Date(file.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingId === file.id ? (
                                // While editing, buttons are hidden by input takeover or logic, 
                                // but for safety we can hide actions or just rely on Blur/Enter.
                                // Actually, let's keep it simple: Input takes space.
                                null
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => startEditing(e, file)}
                                        className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] rounded transition-all"
                                        title="重命名"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => onDelete(e, file.id)}
                                        className="p-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                        title="删除"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            )}
                        </div>
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
