import React, { useRef, useState, useLayoutEffect } from 'react';
import { ToneToolbar } from './ToneToolbar';

interface TextInputProps {
    text: string;
    onChange: (text: string) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    isGenerating: boolean;
}

// Helper: highlight [TAG] text
const highlightText = (text: string) => {
    if (!text) return '<br/>'; // Ensure height with <br/> if empty

    // Escape HTML first
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Highlight tags
    let highlighted = escaped.replace(/(\[[A-Z_]+\]|\[\/[A-Z_]+\])|(\[[a-z]+ ?[1-4]?\])/g, (match, emotion, pronunciation) => {
        if (emotion) {
            return `<span class="tag-highlight">${match}</span>`;
        }
        if (pronunciation) {
            return `<span class="pronunciation-highlight">${match}</span>`;
        }
        return match;
    });

    // Handle newlines for display
    // We add a zero-width space after the last newline to ensure the container expands if the text ends with a newline
    if (highlighted.endsWith('\n')) {
        highlighted += '<br/>';
    }

    return highlighted.replace(/\n/g, '<br/>');
};

export function TextInput({ text, onChange, prompt, onPromptChange }: TextInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Sync scroll from textarea to backdrop
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        const top = e.currentTarget.scrollTop;
        if (backdropRef.current) {
            backdropRef.current.scrollTop = top;
        }
        setScrollTop(top);
    };

    // Ensure strict sync on every render/text change
    useLayoutEffect(() => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, [text, scrollTop]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Backspace') {
            const textarea = e.currentTarget;
            const { selectionStart, selectionEnd, value } = textarea;

            // Only handle if no text is selected (cursor is collapsed)
            if (selectionStart === selectionEnd && selectionStart > 0) {
                const textBeforeCursor = value.slice(0, selectionStart);

                // Matches format like [TAG], [/TAG], or [pinyin] at the end of string
                // Corresponds to regex in highlightText: (\[[A-Z_]+\]|\[\/[A-Z_]+\])|(\[[a-z]+ ?[1-4]?\])
                const tagRegex = /((?:\[[A-Z_]+\])|(?:\[\/[A-Z_]+\])|(?:\[[a-z]+ ?[1-4]?\]))$/;
                const match = textBeforeCursor.match(tagRegex);

                if (match) {
                    e.preventDefault();
                    const tag = match[0];
                    const newText = value.slice(0, selectionStart - tag.length) + value.slice(selectionStart);
                    const newCursorPos = selectionStart - tag.length;

                    onChange(newText);

                    // Restore cursor
                    setTimeout(() => {
                        if (textareaRef.current) {
                            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                        }
                    }, 0);
                }
            }
        }
    };

    const handleToneInsert = (tag: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;

        const prefix = `[${tag}]`;
        const suffix = `[/${tag}]`;

        let newText = '';
        let newCursorPos = 0;

        if (start === end) {
            // Insert at cursor
            newText = currentText.substring(0, start) + prefix + suffix + currentText.substring(end);
            newCursorPos = start + prefix.length;
        } else {
            // Wrap selection
            newText = currentText.substring(0, start) + prefix + currentText.substring(start, end) + suffix + currentText.substring(end);
            newCursorPos = start + prefix.length + (end - start) + suffix.length;
        }

        onChange(newText);

        // Restore focus and set caret
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    return (
        <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)] overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
            <style>{`
                .tag-highlight {
                    color: #00c951;
                }
                .pronunciation-highlight {
                    color: #F59E0B;
                }
                /* Shared font settings are CRITICAL for alignment */
                .editor-shared {
                    font-size: 15px;
                    line-height: 2; 
                    letter-spacing: 0px; 
                    font-variant-ligatures: none;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    box-sizing: border-box;
                }
                .editor-textarea {
                    color: transparent;
                    caret-color: var(--color-text-primary);
                    background: transparent;
                    resize: none;
                    width: 100%;
                    height: 100%;
                    border: none;
                    outline: none;
                    z-index: 10;
                }
                .editor-backdrop {
                    color: var(--color-text-primary);
                    background: transparent;
                    z-index: 0;
                    pointer-events: none;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    border: none;
                }
                
                .editor-textarea::selection {
                    background-color: rgba(59, 130, 246, 0.3);
                    color: transparent;
                }
                
                .editor-textarea::placeholder {
                    color: var(--color-text-secondary);
                    opacity: 0.5;
                }
            `}</style>

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
                    className="w-full h-48 bg-transparent border-none resize-none px-6 focus:ring-0 text-sm leading-6 focus:outline-none text-[var(--color-text-primary)] font-sans"
                    spellCheck={false}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative py-4 min-h-0">
                <div className="flex items-center justify-between px-6 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">待转换正文</span>
                    </div>
                </div>

                {/* Tone Toolbar */}
                <div className="px-6 mb-2">
                    <ToneToolbar onInsert={handleToneInsert} />
                </div>

                {/* Stacked Editor Area */}
                <div className="relative flex-1 w-full min-h-0 container-shared">
                    {/* Backdrop (Highlighter) */}
                    <div
                        ref={backdropRef}
                        className="absolute inset-0 editor-shared editor-backdrop px-6"
                        dangerouslySetInnerHTML={{ __html: highlightText(text) }}
                    />

                    {/* Foreground (Input) */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        spellCheck={false}
                        className="absolute inset-0 editor-shared editor-textarea px-6 custom-scrollbar"
                        placeholder="在此输入需要转换的内容..."
                    />
                </div>

                <div className="px-6 pt-4 flex justify-between items-center border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/30 mt-auto">
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
