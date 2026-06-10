import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Template } from '../types';
import { fetchTemplates } from '../services/api';

interface TemplateSelectorProps {
  onSelect: (templateId: string | null) => void;
  disabled: boolean;
}

export default function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchTemplates()
      .then((data) => {
        setTemplates(data);
      })
      .catch(() => {
        // Silently fail - templates are optional
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (templateId: string | null) => {
      setSelected(templateId);
      setOpen(false);
      onSelect(templateId);
    },
    [onSelect]
  );

  // Group templates by category
  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    const cat = t.category || '未分类';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  const selectedName = selected
    ? templates.find((t) => t.id === selected)?.name || '已选择模板'
    : '不使用模板';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled || loading}
        className="btn-secondary max-w-full gap-2 disabled:opacity-50"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="max-w-[140px] truncate">{loading ? '加载中...' : selectedName}</span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-slate-950">
          <button
            onClick={() => handleSelect(null)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-white/5 ${
              selected === null ? 'text-brand-600 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>不使用模板</span>
          </button>

          <div className="border-t border-slate-200 dark:border-white/10" />

          {categories.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-slate-500">暂无可用模板</div>
          )}

          {categories.map((category) => (
            <div key={category}>
              <div className="bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/5 dark:text-slate-400">
                {category}
              </div>
              {grouped[category].map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-white/5 ${
                    selected === template.id ? 'text-brand-600 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-400/10 dark:text-brand-100">
                    {template.diagramType === 'flowchart' ? 'F' :
                     template.diagramType === 'sequence' ? 'S' :
                     template.diagramType === 'state' ? 'St' :
                     template.diagramType === 'class' ? 'C' :
                     template.diagramType === 'er' ? 'E' : '?'}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{template.name}</div>
                    {template.description && (
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">{template.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
