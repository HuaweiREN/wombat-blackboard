import React, { useState, useRef, useEffect, useCallback } from 'react';

interface InputPanelProps {
  onSend: (message: string) => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function InputPanel({ onSend, onReset, isLoading }: InputPanelProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxHeight = lineHeight * 5;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <div className="border-t border-slate-200/80 bg-white/65 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-white/5">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要的示意图..."
            disabled={isLoading}
            rows={1}
            className="w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-0 disabled:opacity-50 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <span className="absolute bottom-2 right-3 select-none text-xs text-slate-400 dark:text-slate-500">
            {input.length}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          title="发送"
        >
          {isLoading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Enter 发送 · Shift + Enter 换行
        </span>
        <button
          onClick={onReset}
          className="text-xs font-medium text-slate-500 transition hover:text-red-500 dark:text-slate-400 dark:hover:text-red-300"
          title="重置对话"
        >
          重置对话
        </button>
      </div>
    </div>
  );
}
