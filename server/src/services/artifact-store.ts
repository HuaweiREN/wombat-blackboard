import crypto from 'crypto';

export interface DiagramArtifact {
  id: string;
  title: string;
  description: string;
  mermaidCode: string;
  diagramType: string;
  source: 'web' | 'feishu' | 'test';
  createdAt: number;
}

const artifacts = new Map<string, DiagramArtifact>();

export function saveArtifact(input: Omit<DiagramArtifact, 'id' | 'createdAt'>): DiagramArtifact {
  // 使用随机 ID 避免用户输入被拼进 URL，降低泄露和注入风险。
  const id = crypto.randomBytes(12).toString('hex');
  const artifact: DiagramArtifact = { ...input, id, createdAt: Date.now() };
  artifacts.set(id, artifact);

  // 简单内存清理：最多保留最近 200 份，避免长时间运行占用过多内存。
  if (artifacts.size > 200) {
    const oldest = [...artifacts.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) artifacts.delete(oldest.id);
  }

  return artifact;
}

export function getArtifact(id: string): DiagramArtifact | null {
  return artifacts.get(id) ?? null;
}
