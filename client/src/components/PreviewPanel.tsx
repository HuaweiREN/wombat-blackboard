import React, { useCallback } from 'react';
import { useMermaidRender } from '../hooks/useMermaidRender';

interface PreviewPanelProps {
  mermaidCode: string;
}

export default function PreviewPanel({ mermaidCode }: PreviewPanelProps) {
  const { svg, error, rendering } = useMermaidRender(mermaidCode);
  const hasContent = mermaidCode.trim().length > 0;

  const openInNewWindow = useCallback(() => {
    if (!svg) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mermaid 预览</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f8fafc;
          }
          svg { max-width: 90vw; height: auto; }
        </style>
      </head>
      <body>${svg}</body>
      </html>
    `);
    win.document.close();
  }, [svg]);

  // Empty state
  if (!hasContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-gray-500">
        <svg className="mb-3 h-16 w-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <p className="text-sm text-slate-500 dark:text-slate-400">输入描述后在此预览</p>
      </div>
    );
  }

  // Loading state
  if (rendering) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <svg className="mb-3 h-10 w-10 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-slate-500 dark:text-slate-400">渲染中...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-400/30 dark:bg-red-500/10">
          <div className="mb-2 flex items-center gap-2 text-red-600 dark:text-red-200">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm font-medium">渲染失败</span>
          </div>
          <p className="break-all text-xs text-red-600 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  // Success state with SVG
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">实时画布预览</span>
        <button
          onClick={openInNewWindow}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-400/10"
          title="在新窗口中打开预览"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          新窗口预览
        </button>
      </div>
      <div
        className="mermaid-preview surface-grid flex-1 overflow-auto p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: svg || '' }}
      />
    </div>
  );
}
