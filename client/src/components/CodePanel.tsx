import React, { useState, useCallback, useRef, useEffect } from 'react';

interface CodePanelProps {
  mermaidCode: string;
  diagramType: string;
}

export default function CodePanel({ mermaidCode, diagramType }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCode = mermaidCode.trim().length > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    if (!mermaidCode) return;
    const markCopied = () => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    };

    navigator.clipboard
      .writeText(mermaidCode)
      .then(markCopied)
      .catch(() => {
        // 非 HTTPS 或旧浏览器可能禁止 Clipboard API，降级为选中代码提示用户手动复制。
        const selection = window.getSelection();
        const codeNode = document.getElementById('wombat-code-output');
        if (selection && codeNode) {
          const range = document.createRange();
          range.selectNodeContents(codeNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        markCopied();
      });
  }, [mermaidCode]);

  const lines = mermaidCode.split('\n');

  return (
    <div className="glass-panel overflow-hidden rounded-panel">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mermaid 代码资产</span>
          {diagramType && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {diagramType}
            </span>
          )}
        </div>
        {hasCode && (
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-brand-700 dark:bg-white/10 dark:hover:bg-brand-500'
            }`}
            title="复制代码"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已复制 ✓
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                复制代码
              </>
            )}
          </button>
        )}
      </div>

      {/* Code area */}
      <div className="code-panel max-h-48 overflow-auto bg-slate-950">
        {hasCode ? (
          <pre className="relative flex p-3 font-mono text-xs leading-6">
            <code className="select-none pr-4 text-right text-slate-600">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </code>
            <code id="wombat-code-output" className="text-emerald-200">
              {lines.map((line, i) => (
                <div key={i}>
                  {line || <span className="select-none">&nbsp;</span>}
                </div>
              ))}
            </code>
          </pre>
        ) : (
          <div className="flex items-center justify-center py-10 text-sm text-slate-400">
            生成代码后将在此显示
          </div>
        )}
      </div>

      {/* Helper text */}
      {hasCode && (
        <div className="border-t border-slate-200/80 bg-white/70 px-4 py-2 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            提示：粘贴到飞书文档，输入 /mermaid 后粘贴
          </p>
        </div>
      )}
    </div>
  );
}
