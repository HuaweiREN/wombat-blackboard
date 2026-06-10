import { Router, Request, Response } from 'express';
import { templateIndex } from '../services/prompt-builder';
import { generateDiagram } from '../services/diagram-service';
import { getArtifact, saveArtifact } from '../services/artifact-store';
import fs from 'fs';
import path from 'path';

const router = Router();
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');
const USE_EMBEDDED_TEMPLATES = templateIndex && templateIndex.length > 0;

interface GenerateRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  templateId?: string;
}

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { messages, templateId } = req.body as GenerateRequest;
    const result = await generateDiagram({ messages, templateId, source: 'web' });
    if (!result.success) {
      const status = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      res.status(status).json(result);
      return;
    }

    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content || 'Web 生成';
    const artifact = saveArtifact({
      title: 'Web 生成的 Mermaid 示意图',
      description: latestUserMessage.slice(0, 160),
      mermaidCode: result.mermaidCode,
      diagramType: result.diagramType,
      source: 'web',
    });

    res.json({
      ...result,
      artifactId: artifact.id,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// GET /api/templates - return template index
router.get('/templates', (_req: Request, res: Response) => {
  try {
    // Use embedded templates in production mode
    if (USE_EMBEDDED_TEMPLATES) {
      res.json(templateIndex);
      return;
    }
    const indexPath = path.join(TEMPLATES_DIR, 'index.json');
    if (!fs.existsSync(indexPath)) {
      res.json([]);
      return;
    }
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

router.post('/feishu/simulate', async (_req: Request, res: Response) => {
  res.status(503).json({ success: false, error: '模拟接口暂不可用，请使用飞书直接测试 Channel 模式' });
});

router.get('/share/:id', (req: Request, res: Response) => {
  const artifact = getArtifact(req.params.id);
  if (!artifact) {
    res.status(404).send('Artifact not found or expired');
    return;
  }

  res.type('html').send(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(artifact.title)}</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
    header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; background: white; }
    main { padding: 24px; display: grid; gap: 20px; }
    .canvas { overflow: auto; border: 1px solid #e2e8f0; border-radius: 18px; background: white; padding: 24px; }
    pre { overflow: auto; border-radius: 14px; background: #0f172a; color: #d1fae5; padding: 16px; }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, securityLevel: 'strict' });
  </script>
</head>
<body>
  <header>
    <strong>Wombat-Blackboard</strong>
    <div>${escapeHtml(artifact.description)}</div>
  </header>
  <main>
    <section class="canvas"><pre class="mermaid">${escapeHtml(artifact.mermaidCode)}</pre></section>
    <pre>${escapeHtml(artifact.mermaidCode)}</pre>
  </main>
</body>
</html>`);
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default router;
