import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diffMs = now - ts;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return '刚刚';
  if (diffSec < 60) return `${diffSec} 秒前`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} 天前`;

  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  flowchart: '流程图',
  sequence: '时序图',
  state: '状态图',
  class: '类图',
  er: 'ER图',
};

function getDiagramTypeLabel(type: string | undefined): string | null {
  if (!type) return null;
  return DIAGRAM_TYPE_LABELS[type.toLowerCase()] || type;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const label = getDiagramTypeLabel(message.mermaidCode ? message.mermaidCode.split('\n').find(Boolean) : undefined);

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[88%] sm:max-w-[82%]">
        <div className={`mb-1 text-xs font-medium ${isUser ? 'text-right text-brand-600 dark:text-brand-200' : 'text-left text-slate-500 dark:text-slate-400'}`}>
          {isUser ? '你' : 'Wombat'}
        </div>

        <div
          className={`rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-soft ${
            isUser
              ? 'rounded-tr-lg bg-gradient-to-br from-brand-600 to-brand-700 text-white'
              : 'rounded-tl-lg border border-slate-200 bg-white/85 text-slate-800 dark:border-white/10 dark:bg-white/7 dark:text-slate-100'
          }`}
        >
          {message.content}

          {!isUser && message.mermaidCode && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                已生成示意图{label ? ` · ${label}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className={`mt-1 text-xs text-slate-400 dark:text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
