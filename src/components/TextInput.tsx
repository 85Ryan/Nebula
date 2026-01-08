import { ToneToolbar } from './ToneToolbar';
import { useRef, useEffect } from 'react';

interface TextInputProps {
    text: string;
    onChange: (text: string) => void;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    isGenerating: boolean;
}

// Helper: highlight [TAG] text
const highlightText = (text: string) => {
    if (!text) return '';
    // Regex matches [TAG] or [/TAG]
    const parts = text.split(/(\[[A-Z_]+\]|\[\/[A-Z_]+\])/g);
    return parts.map(part => {
        if (part.match(/^\[[A-Z_]+\]$/) || part.match(/^\[\/[A-Z_]+\]$/)) {
            return `<span class="tag-highlight">${part}</span>`;
        }
        // HTML escape basic chars for safety if needed, but innerText usually handles it on input
        // For render, we must be careful.
        // Simple escape:
        return part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }).join('');
};

/*
 * Cursor Management Helpers
 */
const getCaretCharacterOffsetWithin = (element: HTMLElement) => {
    let caretOffset = 0;
    const doc = element.ownerDocument || document;
    const win = doc.defaultView || window;
    const sel = win.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
};

const setCaretPosition = (element: HTMLElement, offset: number) => {
    const createRange = (node: Node, chars: { count: number }, range?: Range): Range => {
        if (!range) {
            range = document.createRange();
            range.selectNode(node);
            range.setStart(node, 0);
        }
        if (chars.count === 0) {
            range.setEnd(node, chars.count);
        } else if (node && chars.count > 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent && node.textContent.length < chars.count) {
                    chars.count -= node.textContent.length;
                } else {
                    range.setEnd(node, chars.count);
                    chars.count = 0;
                }
            } else {
                for (let lp = 0; lp < node.childNodes.length; lp++) {
                    range = createRange(node.childNodes[lp], chars, range);
                    if (chars.count === 0) {
                        break;
                    }
                }
            }
        }
        return range;
    };

    const range = createRange(element, { count: offset });
    if (range) {
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
    }
};

export function TextInput({ text, onChange, prompt, onPromptChange }: TextInputProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const cursorOffset = useRef<number>(0);

    // Sync external text to contentEditable innerHTML
    // We only update if semantic text content differs to avoid recreating DOM on every cursor move
    useEffect(() => {
        if (editorRef.current) {
            const currentText = editorRef.current.innerText;
            // If text prop is different from current innerText, it means external update (e.g. file switch, or toolbar insert)
            // But we must NOT update if the difference is just due to cursor movement or simple typing which already triggered onChange
            // Wait, onChange updates 'text'. 'text' updates here.
            // If we type 'a', onChange('a'), text becomes 'a'. Here currentText is 'a'. Match. No render.
            // But if we want highlighting, we MUST render HTML if HTML doesn't match expected highlight.
            if (currentText !== text) {
                // External change (or very fast typing?)
                editorRef.current.innerHTML = highlightText(text);
                // cursorOffset.current might be stale if external change.
            } else {
                // Text matches, but does HTML match highlighting?
                // Example: typed "[", text is "[". highlightText("[") is "[".
                // Typed "TAG]", text is "[TAG]". highlightText is <span>[TAG]</span>.
                // current innerHTML might be "[TAG]". We need to upgrade it to span.
                const expectedHtml = highlightText(text);
                if (editorRef.current.innerHTML !== expectedHtml) {
                    // Save cursor
                    const savedOffset = cursorOffset.current; // Use tracked offset or get current?
                    // Better get current real numeric offset from DOM before we trash it
                    // But we might not have focus if this is a delayed effect?
                    // Safe to check focus.
                    const isFocused = document.activeElement === editorRef.current;
                    let realOffset = savedOffset;
                    if (isFocused) {
                        realOffset = getCaretCharacterOffsetWithin(editorRef.current);
                    }

                    editorRef.current.innerHTML = expectedHtml;

                    if (isFocused) {
                        setCaretPosition(editorRef.current, realOffset);
                    }
                }
            }
        }
    }, [text]);

    const handleInput = () => {
        if (editorRef.current) {
            const newText = editorRef.current.innerText;
            // Save cursor position right after input
            cursorOffset.current = getCaretCharacterOffsetWithin(editorRef.current);
            if (newText !== text) {
                onChange(newText);
            }
        }
    };

    const handleToneInsert = (tag: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Ensure we have focus or use stored range?
        // Simpler: Just append if not focused, or insert at cursor.
        // We need to use Selection API on the DIV
        let start = text.length;
        let end = text.length;

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
            // Calculate offset.
            // This is tricky with nested nodes.
            // We use our helper if possible? getCaretCharacterOffsetWithin gives single offset.
            // For selection range, we need start and end.
            const range = sel.getRangeAt(0);
            const preRange = range.cloneRange();
            preRange.selectNodeContents(editor);
            preRange.setEnd(range.startContainer, range.startOffset);
            start = preRange.toString().length;
            end = start + range.toString().length;
        }

        const prefix = `[${tag}]`;
        const suffix = `[/${tag}]`;

        let newText = '';
        if (start === end) {
            newText = text.substring(0, start) + prefix + suffix + text.substring(end);
        } else {
            newText = text.substring(0, start) + prefix + text.substring(start, end) + suffix + text.substring(end);
        }

        onChange(newText);

        // Focus and set cursor
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.focus();
                // Set cursor between tags or after block
                let newPos = 0;
                if (start === end) {
                    newPos = start + prefix.length;
                } else {
                    newPos = start + prefix.length + (end - start) + suffix.length;
                }
                setCaretPosition(editorRef.current, newPos);
                cursorOffset.current = newPos;
            }
        }, 0);
    };

    return (
        <div className="flex-1 flex flex-col bg-[var(--color-bg-primary)] overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
            <style>{`
                .tag-highlight {
                    color: var(--color-accent);
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: bold;
                    font-size: 0.75em;
                }
                [contenteditable]:empty:before {
                    content: attr(placeholder);
                    color: rgba(var(--color-text-secondary-rgb), 0.4);
                    pointer-events: none;
                    display: block;
                }
                /* Hide scrollbar for cleaner look if desired, or keep custom one */
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
                    className="w-full h-48 bg-transparent border-none resize-none px-6 focus:ring-0 text-sm leading-6 placeholder-[var(--color-text-secondary)]/40 focus:outline-none text-[var(--color-text-primary)] font-sans"
                    spellCheck={false}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative py-4">
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

                {/* ContentEditable Editor */}
                <div className="relative flex-1 w-full min-h-0">
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        className="absolute inset-0 w-full h-full px-6 overflow-y-auto custom-scrollbar bg-transparent border-none focus:ring-0 text-[15px] leading-8 text-[var(--color-text-primary)] focus:outline-none whitespace-pre-wrap break-words font-sans outline-none"
                        placeholder="在此输入需要转换的内容..."
                        spellCheck={false}
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
