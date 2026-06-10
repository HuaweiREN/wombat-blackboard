import fs from 'fs';
import path from 'path';
import { embeddedAssets, templateIndex } from '../embedded-assets';

// In dev mode (tsx), __dirname = server/src/services/
// In prod after tsc, __dirname = server/dist/services/
// In bundled mode (esbuild -> SEA), embedded assets are used
const PROMPTS_DIR = path.resolve(__dirname, '../../../prompts');
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

const USE_EMBEDDED = Object.keys(embeddedAssets).length > 0;

function loadFile(filePath: string): string {
  if (USE_EMBEDDED) {
    // Normalize path to match embedded asset keys
    const relPath = filePath.replace(/\\/g, '/');
    for (const key of Object.keys(embeddedAssets)) {
      if (key.endsWith(relPath.split('/').slice(-1).join('/')) || key === relPath) {
        return embeddedAssets[key] || '';
      }
    }
    // Try exact match
    if (embeddedAssets[relPath]) return embeddedAssets[relPath];
  }

  // Fallback to filesystem
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn(`[prompt-builder] Warning: file not found at ${filePath}`);
    return '';
  }
}

function loadPrompt(filename: string): string {
  const filePath = path.join(PROMPTS_DIR, filename);
  return loadFile(filePath);
}

function loadGlossary(): string {
  // Try embedded first
  for (const key of Object.keys(embeddedAssets)) {
    if (key.includes('glossary.md')) return embeddedAssets[key];
  }
  return loadPrompt('glossary.md');
}

function loadFewShots(): string {
  const fewShotDir = path.join(PROMPTS_DIR, 'few-shot');

  if (USE_EMBEDDED) {
    const parts: string[] = [];
    for (const key of Object.keys(embeddedAssets).sort()) {
      if (key.includes('few-shot/') && key.endsWith('.md')) {
        parts.push(embeddedAssets[key]);
      }
    }
    return parts.join('\n\n---\n\n');
  }

  try {
    const files = fs
      .readdirSync(fewShotDir)
      .filter((f) => f.endsWith('.md'))
      .sort();
    return files
      .map((f) => loadFile(path.join(fewShotDir, f)))
      .filter(Boolean)
      .join('\n\n---\n\n');
  } catch {
    return '';
  }
}

function loadTemplateDescription(templateId?: string): string {
  if (!templateId) return '';

  const filename = `${templateId}.md`;

  if (USE_EMBEDDED) {
    for (const key of Object.keys(embeddedAssets)) {
      if (key.includes(filename)) return embeddedAssets[key];
    }
  }

  const templatePath = path.join(TEMPLATES_DIR, filename);
  return loadFile(templatePath);
}

const STYLE_INJECTION = `

# ⚠️ 样式强制规则（最高优先级，违反将导致输出无效）

每个 Mermaid 代码块必须以以下精确字符串开头（直接复制粘贴，不要修改）：

\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%

flowchart 类型还必须包含这些 classDef 定义并应用到节点：
classDef sensor fill:#D6E8FA,stroke:#2E6DB4,color:#1B3A5C
classDef compute fill:#E3DFF0,stroke:#5E4FA2,color:#2D1B4E
classDef actuator fill:#FDE4D0,stroke:#E87722,color:#5C2D0E
classDef safety fill:#FADDDD,stroke:#D14343,color:#5C1A1A
classDef decision fill:#FFF3CD,stroke:#E6A817,color:#5C4A0E
classDef external fill:#E2E8F0,stroke:#718096,color:#2D3748

传感器→class sensor, 芯片/域控/计算→class compute, 执行器→class actuator, 安全→class safety, 判断→class decision, HMI/驾驶员/外部→class external

sequenceDiagram 类型必须包含 autonumber 和 participant as 别名。
stateDiagram-v2 使用 stateDiagram-v2，复合状态用 state ... { } 嵌套。

**这不是建议，是强制规则。如果代码块不以 %%{init}%% 开头，输出无效。**
`;

export function buildSystemPrompt(templateId?: string): string {
  let systemPrompt = loadPrompt('system-prompt.md');

  if (!systemPrompt) {
    systemPrompt =
      '你是一位专业的 Mermaid 代码生成专家，专精于汽车智能驾驶（AD/ADAS）领域。\n' +
      '你的任务是将用户的自然语言描述转换为正确的 Mermaid 代码。\n\n' +
      '{DOMAIN_GLOSSARY}\n\n' +
      '请严格按照以下要求输出：\n' +
      '1. 只输出 Mermaid 代码块，格式为 ```mermaid\\n<代码>\\n```\n' +
      '2. 代码必须是合法、完整的 Mermaid 语法\n' +
      '3. 根据描述内容自动选择最合适的图表类型\n' +
      '4. 使用中文标签和注释\n' +
      '5. 保持布局清晰，适当使用 subgraph 组织复杂结构\n' +
      '6. 车辆领域术语保留英文缩写（如 HWP, NOD, ODD, ASIL 等）';
  }

  const glossary = loadGlossary();
  if (glossary) {
    systemPrompt = systemPrompt.replace('{DOMAIN_GLOSSARY}', glossary);
  }

  const fewShots = loadFewShots();
  if (fewShots) {
    systemPrompt += `\n\n## 参考示例\n\n${fewShots}`;
  }

  if (templateId) {
    const templateDesc = loadTemplateDescription(templateId);
    if (templateDesc) {
      systemPrompt =
        `## 模板上下文\n\n` +
        `用户正在使用以下模板生成图表，请参考模板描述进行生成：\n\n` +
        templateDesc +
        `\n\n---\n\n` +
        systemPrompt;
    }
  }

  // Append style injection at the END (LLM pays most attention to the end)
  systemPrompt += STYLE_INJECTION;

  return systemPrompt;
}

export function buildMessages(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return conversationHistory.slice(-20);
}

export { templateIndex };
