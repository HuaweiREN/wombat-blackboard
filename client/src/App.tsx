import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from './hooks/useConversation';
import InputPanel from './components/InputPanel';
import MessageBubble from './components/MessageBubble';
import PreviewPanel from './components/PreviewPanel';
import CodePanel from './components/CodePanel';
import TemplateSelector from './components/TemplateSelector';

export default function App() {
  const {
    messages,
    isLoading,
    error,
    currentCode,
    diagramType,
    sendMessage,
    reset,
  } = useConversation();

  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 新消息出现时自动滚动到底部，保持对话式生成的连续感。
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (msg: string) => {
      sendMessage(msg, selectedTemplate);
    },
    [sendMessage, selectedTemplate]
  );

  const handleTemplateSelect = useCallback((templateId: string | null) => {
    setSelectedTemplate(templateId ?? undefined);
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setSelectedTemplate(undefined);
  }, [reset]);

  const hasMessages = messages.length > 0;
  const examplePrompts = [
    '画 HWP 功能从 Standby 到 Active 再到 Failure 的状态机',
    '智驾域控 Orin、TDA4、MCU 与摄像头/雷达/底盘 CAN 的架构图',
    '驾驶员拨杆变道时，感知、规划、EPS、VCU 的交互时序',
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#d8efff,transparent_34%),linear-gradient(135deg,#f8fafc,#e7eef8_55%,#f7efe2)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(31,149,220,0.24),transparent_32%),linear-gradient(135deg,#08111f,#0f172a_55%,#152033)] dark:text-slate-100">
      <div className="mx-auto flex h-screen max-w-[1600px] flex-col px-3 py-3 sm:px-5 sm:py-5">
        <header className="glass-panel mb-3 flex shrink-0 flex-col gap-3 rounded-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-wombat-moss text-white shadow-glow">
              <span className="text-xl">◈</span>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight sm:text-lg">Wombat Blackboard</h1>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">AI Diagram SaaS</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">智驾场景描述 → Mermaid 代码 → 飞书画板即时出图</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">系统主题 · 自动跟随</span>
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-100">飞书 WS Ready</span>
            <TemplateSelector onSelect={handleTemplateSelect} disabled={isLoading} />
          </div>
        </header>

      {error && (
        <div className="mb-3 flex shrink-0 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1">{error}</span>
        </div>
      )}

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(360px,0.82fr)_minmax(460px,1.18fr)]">
          <section className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-panel">
            <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
              <p className="text-sm font-semibold">场景对话</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">支持持续微调，上下文随请求传递。</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
            {hasMessages ? (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex h-full flex-col justify-center gap-5 text-slate-600 dark:text-slate-300">
                <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/70 p-5 dark:border-brand-400/25 dark:bg-brand-400/10">
                  <p className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">从一句智驾场景开始</p>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">描述系统架构、ODD 决策树、状态机或模块时序，Wombat 会生成可直接粘贴到飞书的 Mermaid 代码。</p>
                </div>
                <div className="grid gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-brand-400/10"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-400/10">
                  <svg className="h-4 w-4 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            )}
            </div>

            <InputPanel onSend={handleSend} onReset={handleReset} isLoading={isLoading} />
          </section>

          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
            <div className="glass-panel min-h-[300px] overflow-hidden rounded-panel">
              <PreviewPanel mermaidCode={currentCode} />
            </div>
            <CodePanel mermaidCode={currentCode} diagramType={diagramType} />
          </section>
        </main>
      </div>
    </div>
  );
}
