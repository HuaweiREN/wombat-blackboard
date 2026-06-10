import * as Lark from '@larksuiteoapi/node-sdk';
import { config } from '../config';

interface TenantTokenCache {
  token: string;
  expiresAt: number;
}

export interface FeishuSendCardInput {
  chatId: string;
  title: string;
  summary: string;
  mermaidCode: string;
  diagramType: string;
  previewUrl?: string;
  attachMarkdownFile?: boolean;
}

export interface FeishuStatusCardInput {
  chatId: string;
  title: string;
  summary: string;
  template?: 'blue' | 'green' | 'yellow' | 'red';
}

let tenantTokenCache: TenantTokenCache | null = null;
const MARKDOWN_FILE_THRESHOLD = 1800;

export function createFeishuOpenClient() {
  return new Lark.Client({
    appId: config.feishu.appId,
    appSecret: config.feishu.appSecret,
    domain: config.feishu.domain,
  });
}

export async function getTenantAccessToken(): Promise<string> {
  const now = Date.now();
  if (tenantTokenCache && tenantTokenCache.expiresAt - now > 30 * 60 * 1000) {
    return tenantTokenCache.token;
  }

  if (!config.feishu.appSecret) {
    throw new Error('FEISHU_APP_SECRET 未配置，无法获取 tenant_access_token');
  }

  const response = await fetch(`${config.feishu.domain}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: config.feishu.appId, app_secret: config.feishu.appSecret }),
  });

  const data = await response.json() as { code: number; msg: string; tenant_access_token?: string; expire?: number };
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取 tenant_access_token 失败: ${data.msg || response.statusText}`);
  }

  tenantTokenCache = {
    token: data.tenant_access_token,
    expiresAt: now + ((data.expire || 7200) - 300) * 1000,
  };
  return tenantTokenCache.token;
}

export async function sendFeishuCard(input: FeishuSendCardInput): Promise<void> {
  if (config.feishu.mockSend) {
    console.log('[feishu:mock-send]', JSON.stringify({ chatId: input.chatId, title: input.title, diagramType: input.diagramType, attachMarkdownFile: input.attachMarkdownFile }));
    return;
  }

  const client = createFeishuOpenClient();
  const card = buildResultCard(input);

  for (let attempt = 0; attempt <= config.feishu.maxReplyRetries; attempt++) {
    try {
      await client.im.v1.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: input.chatId,
          msg_type: 'interactive',
          content: JSON.stringify(card),
        },
      });
      if (input.attachMarkdownFile || input.mermaidCode.length > MARKDOWN_FILE_THRESHOLD) {
        await sendMarkdownFile({
          chatId: input.chatId,
          fileName: buildMarkdownFileName(input.diagramType),
          markdown: buildMarkdownContent(input),
        });
      }
      return;
    } catch (err) {
      if (attempt >= config.feishu.maxReplyRetries) {
        throw new Error(`飞书消息发送失败: ${err instanceof Error ? err.message : String(err)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export async function sendFeishuStatusCard(input: FeishuStatusCardInput): Promise<string | undefined> {
  if (config.feishu.mockSend) {
    console.log('[feishu:mock-send]', JSON.stringify({ chatId: input.chatId, title: input.title, type: 'status' }));
    return undefined;
  }

  const client = createFeishuOpenClient();
  const card = buildStatusCard(input);
  for (let attempt = 0; attempt <= config.feishu.maxReplyRetries; attempt++) {
    try {
      const resp = await client.im.v1.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: input.chatId,
          msg_type: 'interactive',
          content: JSON.stringify(card),
        },
      });
      return (resp as any)?.data?.message_id as string | undefined;
    } catch (err) {
      if (attempt >= config.feishu.maxReplyRetries) {
        throw new Error(`飞书状态消息发送失败: ${err instanceof Error ? err.message : String(err)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

export async function updateFeishuCard(messageId: string, input: FeishuSendCardInput): Promise<void> {
  if (config.feishu.mockSend) {
    console.log('[feishu:mock-update]', JSON.stringify({ messageId, title: input.title, diagramType: input.diagramType }));
    return;
  }

  const client = createFeishuOpenClient();
  const card = buildResultCard(input);

  for (let attempt = 0; attempt <= config.feishu.maxReplyRetries; attempt++) {
    try {
      await client.im.v1.message.patch({
        path: { message_id: messageId },
        data: {
          content: JSON.stringify(card),
        },
      });
      if (input.attachMarkdownFile || input.mermaidCode.length > MARKDOWN_FILE_THRESHOLD) {
        await sendMarkdownFile({
          chatId: input.chatId,
          fileName: buildMarkdownFileName(input.diagramType),
          markdown: buildMarkdownContent(input),
        });
      }
      return;
    } catch (err) {
      if (attempt >= config.feishu.maxReplyRetries) {
        throw new Error(`飞书卡片更新失败: ${err instanceof Error ? err.message : String(err)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}

function buildResultCard(input: FeishuSendCardInput) {
  const isError = !input.mermaidCode;
  const codePreview = input.mermaidCode.length > 1200
    ? `${input.mermaidCode.slice(0, 1200)}\n...（代码过长，请打开预览链接或 Web UI 查看完整内容）`
    : input.mermaidCode;

  const actions = input.previewUrl && !isLocalPreviewUrl(input.previewUrl)
    ? [{ tag: 'button', text: { tag: 'plain_text', content: '打开预览链接' }, type: 'primary', url: input.previewUrl }]
    : [];

  const fileHint = input.attachMarkdownFile || (input.mermaidCode && input.mermaidCode.length > MARKDOWN_FILE_THRESHOLD)
    ? '\n\n代码较长，已额外发送 `.md` 附件，任何人都可以下载后复制到飞书 `/mermaid` 块中渲染。'
    : '';

  return {
    config: { wide_screen_mode: true },
    header: {
      template: isError ? 'red' : 'blue',
      title: { tag: 'plain_text', content: input.title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: `**图表类型：** ${input.diagramType}\n**说明：** ${input.summary}${fileHint}` } },
      ...(isError ? [] : [
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: '请复制下面 Mermaid 代码到飞书文档 `/mermaid` 块中渲染：' } },
        { tag: 'div', text: { tag: 'lark_md', content: '```mermaid\n' + codePreview + '\n```' } },
      ] as any[]),
      ...(actions.length > 0 ? [{ tag: 'action', actions }] : []),
    ],
  };
}

function buildStatusCard(input: FeishuStatusCardInput) {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: input.template || 'blue',
      title: { tag: 'plain_text', content: input.title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: input.summary } },
    ],
  };
}

async function sendMarkdownFile(input: { chatId: string; fileName: string; markdown: string }): Promise<void> {
  const client = createFeishuOpenClient();
  const uploadResp = await client.im.file.create({
    data: {
      file_type: 'stream',
      file_name: input.fileName,
      file: Buffer.from(input.markdown, 'utf-8'),
    },
  });

  const fileKey = (uploadResp as any).file_key || (uploadResp as any).data?.file_key;
  if (!fileKey) {
    throw new Error('飞书文件上传失败：未返回 file_key');
  }

  await client.im.v1.message.create({
    params: { receive_id_type: 'chat_id' },
    data: {
      receive_id: input.chatId,
      msg_type: 'file',
      content: JSON.stringify({ file_key: fileKey }),
    },
  });
}

function buildMarkdownContent(input: FeishuSendCardInput): string {
  return [
    `# ${input.title}`,
    '',
    `- 图表类型：${input.diagramType}`,
    `- 说明：${input.summary}`,
    '',
    '## Mermaid 代码',
    '',
    '```mermaid',
    input.mermaidCode,
    '```',
    '',
    '## 使用方法',
    '',
    '1. 在飞书文档输入 `/mermaid`。',
    '2. 复制上方代码块内容。',
    '3. 粘贴后即可渲染图表。',
  ].join('\n');
}

function buildMarkdownFileName(diagramType: string): string {
  const safeType = diagramType.replace(/[^a-z0-9_-]/gi, '') || 'diagram';
  return `wombat-${safeType}-${Date.now()}.md`;
}

function isLocalPreviewUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);
}
