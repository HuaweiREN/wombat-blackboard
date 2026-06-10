import { buildSystemPrompt, buildMessages } from './prompt-builder';
import { generateMermaidCode } from './llm-client';
import { config } from '../config';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateDiagramInput {
  messages: ConversationMessage[];
  templateId?: string;
  source?: 'web' | 'feishu' | 'test';
}

export interface GenerateDiagramResult {
  success: true;
  content: string;
  mermaidCode: string;
  diagramType: string;
}

export interface GenerateDiagramFailure {
  success: false;
  error: string;
  code: 'VALIDATION_ERROR' | 'LLM_ERROR' | 'INTERNAL_ERROR';
}

export type GenerateDiagramResponse = GenerateDiagramResult | GenerateDiagramFailure;

const THEME_INIT = `%%{init: {'theme': 'base', 'flowchart': {'curve': 'linear'}, 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%`;

const DDLOG = 'D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log';
function ddlog(msg: string) { try { require('fs').appendFileSync(DDLOG, new Date().toISOString() + ' ' + msg + '\n'); } catch {} }

export async function generateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramResponse> {
  const validation = validateGenerateInput(input.messages);
  if (!validation.valid) {
    ddlog('[gen] validation FAILED: ' + validation.error);
    return { success: false, error: validation.error, code: 'VALIDATION_ERROR' };
  }

  try {
    const systemPrompt = buildSystemPrompt(input.templateId);
    const apiMessages = buildMessages(input.messages);
    ddlog('[gen] calling LLM, msgCount=' + apiMessages.length + ' totalChars=' + apiMessages.reduce((s,m) => s + m.content.length, 0));
    let lastError = '';
    let code = '';

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        ddlog('[gen] LLM attempt ' + attempt + ' start');
        const t0 = Date.now();
        const response = await generateMermaidCode(systemPrompt, apiMessages);
        ddlog('[gen] LLM attempt ' + attempt + ' done in ' + (Date.now() - t0) + 'ms');
        code = extractMermaidCode(response);
        const syntax = validateMermaidSyntax(code);
        if (syntax.valid) break;

        lastError = syntax.error;
        apiMessages.push({
          role: 'user',
          content: `Mermaid语法错误: ${syntax.error}\n请修复错误后重新输出完整代码块。只输出代码。`,
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        ddlog('[gen] LLM attempt ' + attempt + ' ERROR: ' + lastError);
        if (attempt >= config.maxRetries) {
          return { success: false, error: lastError || 'LLM 调用失败', code: 'LLM_ERROR' };
        }
      }
    }

    if (!code) {
      return { success: false, error: lastError || '生成失败', code: 'LLM_ERROR' };
    }

    code = ensureThemeInit(code);
    const diagramType = detectDiagramType(code);
    return {
      success: true,
      content: '```mermaid\n' + code + '\n```',
      mermaidCode: code,
      diagramType,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      code: 'INTERNAL_ERROR',
    };
  }
}

function validateGenerateInput(messages: ConversationMessage[]): { valid: boolean; error: string } {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'messages is required' };
  }

  const totalLength = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalLength > 30000) {
    return { valid: false, error: '输入过长，请缩短描述或重置对话后重试' };
  }

  for (const message of messages) {
    if (!['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
      return { valid: false, error: 'messages contains invalid item' };
    }
  }

  return { valid: true, error: '' };
}

export function extractMermaidCode(response: string): string {
  const match = response.match(/```mermaid\n([\s\S]*?)\n```/);
  if (match) return cleanMermaid(match[1].trim());

  const altMatch = response.match(/```\n([\s\S]*?)\n```/);
  if (altMatch) return cleanMermaid(altMatch[1].trim());

  return cleanMermaid(response.replace(/^(mermaid\s*)?/, '').trim());
}

function cleanMermaid(code: string): string {
  return stripBareText(code.replace(/<br\s*\/?>/gi, ' '));
}

// 去掉 Mermaid 代码块内的裸文本行（保留 Note 块内的续行）
function stripBareText(code: string): string {
  const lines = code.split('\n');
  let inNote = false;

  const isMermaidLine = (line: string): boolean => {
    const t = line.trim();
    if (!t || t.startsWith('%%')) { inNote = false; return true; }
    // Note 块的续行（Note 可以跨多行，直到下一个 Mermaid 关键字）
    if (inNote) {
      if (/^(participant|actor|Note|rect\s|end\s*$|activate|deactivate|autonumber|loop\s|alt\s|else\s*$|opt\s|par\s|and\s|critical|break|group|sequenceDiagram|flowchart|stateDiagram|classDiagram|erDiagram|%%|\s*\[\*\])/i.test(t)) { inNote = false; }
      else return true; // Note 续行
    }
    // Mermaid 关键字开头
    if (/^(participant|actor|Note|rect\s|end\s*$|activate|deactivate|autonumber|loop\s|alt\s|else\s*$|opt\s|par\s|and\s|critical|break|group|sequenceDiagram|flowchart|stateDiagram|classDiagram|erDiagram|gantt|pie|mindmap|timeline|subgraph|style|classDef|class\s|title\s|state\s|%%|\s*\[\*\])/i.test(t)) {
      if (/^Note\s/.test(t)) inNote = true;
      return true;
    }
    // 箭头
    if (/-->|->>|-->>|->|-[x.]>|==>|--->/.test(t)) return true;
    // 带节点 ID 的括号（A[标签] / B(圆角) / C{菱形}）
    if (/\w[\[\(\{][^\]]*[\]\)\}]/.test(t)) return true;
    // class 样式应用
    if (/^\s*class\s+[\w,]+/.test(t)) return true;
    return false;
  };

  return lines.filter(isMermaidLine).join('\n').trim();
}

export function validateMermaidSyntax(code: string): { valid: boolean; error: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: '代码为空' };
  }

  const bracketPairs: [string, string, string][] = [
    ['[', ']', '方括号'],
    ['(', ')', '圆括号'],
    ['{', '}', '花括号'],
  ];

  for (const [open, close, name] of bracketPairs) {
    let depth = 0;
    for (const ch of code) {
      if (ch === open) depth++;
      if (ch === close) depth--;
    }
    if (depth !== 0) return { valid: false, error: `${name}不匹配 (差值: ${depth})` };
  }

  const validTypes = [
    'flowchart',
    'sequenceDiagram',
    'stateDiagram',
    'stateDiagram-v2',
    'classDiagram',
    'erDiagram',
    'gantt',
    'pie',
    'mindmap',
    'timeline',
  ];
  const firstUsefulLine = code
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('%%{'));

  if (!firstUsefulLine || !validTypes.some((type) => firstUsefulLine.startsWith(type))) {
    return { valid: false, error: `无效的图表类型声明。必须以 ${validTypes.join(', ')} 开头` };
  }

  return { valid: true, error: '' };
}

export function detectDiagramType(code: string): string {
  for (const rawLine of code.trim().split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%{')) continue;
    if (line.startsWith('flowchart')) return 'flowchart';
    if (line.startsWith('sequenceDiagram')) return 'sequence';
    if (line.startsWith('stateDiagram')) return 'state';
    if (line.startsWith('classDiagram')) return 'class';
    if (line.startsWith('erDiagram')) return 'er';
    if (line.startsWith('gantt')) return 'gantt';
    if (line.startsWith('pie')) return 'pie';
    if (line.startsWith('mindmap')) return 'mindmap';
    if (line.startsWith('timeline')) return 'timeline';
  }
  return 'unknown';
}

export function ensureThemeInit(code: string): string {
  if (code.startsWith('%%{init:')) return code;
  const lines = code.split('\n');
  const firstLine = lines[0].trim();
  if (/^(flowchart|sequenceDiagram|stateDiagram|classDiagram|erDiagram|gantt|pie|mindmap|timeline)/.test(firstLine)) {
    lines.splice(0, 1, THEME_INIT, firstLine);
    return lines.join('\n');
  }
  return THEME_INIT + '\n' + code;
}
