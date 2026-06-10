import { useEffect, useState, useRef } from 'react';

let mermaidInstance: any = null;

async function getMermaid() {
  if (!mermaidInstance) {
    const mermaid = await import('mermaid');
    mermaid.default.initialize({ startOnLoad: false, theme: 'default' });
    mermaidInstance = mermaid.default;
  }
  return mermaidInstance;
}

export function useMermaidRender(code: string) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!code || code.trim().length === 0) {
      setSvg(null);
      setError(null);
      setRendering(false);
      return;
    }

    let cancelled = false;
    setRendering(true);
    setError(null);

    getMermaid()
      .then(async (mermaid) => {
        if (cancelled) return;
        try {
          // 每次渲染使用不同 ID，避免 React 严格模式和 Mermaid 内部缓存导致冲突。
          const renderId = `${idRef.current}-${Date.now().toString(36)}`;
          const { svg: renderedSvg } = await mermaid.render(renderId, code.trim());
          if (!cancelled) {
            setSvg(renderedSvg);
            setError(null);
          }
        } catch (err: any) {
          if (!cancelled) {
            setError(err?.message || String(err));
            setSvg(null);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Mermaid 渲染库加载失败');
          setSvg(null);
        }
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return { svg, error, rendering };
}
