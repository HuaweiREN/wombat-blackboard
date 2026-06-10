import { createLarkChannel, NormalizedMessage } from '@larksuiteoapi/node-sdk';
import { config } from '../config';
import { generateDiagram } from './diagram-service';
import { saveArtifact } from './artifact-store';
import { appendSessionTurn, clearSession, getSessionMessages } from './feishu-session';
import fs from 'fs';

const DEBUG_LOG = 'D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log';
function dlog(msg: string) {
  try { fs.appendFileSync(DEBUG_LOG, new Date().toISOString() + ' ' + msg + '\n'); } catch { /* ignore */ }
}

export async function startFeishuChannel(): Promise<void> {
  if (!config.feishu.enabled) {
    console.log('[feishu] Channel disabled. Set FEISHU_WS_ENABLED=true to enable.');
    return;
  }

  if (!config.feishu.appSecret) {
    console.warn('[feishu] FEISHU_APP_SECRET missing. Channel not started.');
    return;
  }

  const channel = createLarkChannel({
    appId: config.feishu.appId,
    appSecret: config.feishu.appSecret,
    domain: config.feishu.domain,
  });

  channel.on('message', async (msg: NormalizedMessage) => {
    const sessionKey = `user:${msg.senderId}`;
    const cleaned = msg.content.trim();
    if (!cleaned) return;

    if (isResetCommand(cleaned)) {
      clearSession(sessionKey);
      await channel.send(msg.chatId, {
        markdown: '✅ 已清除对话上下文，下一条需求将作为全新画图任务开始。',
      });
      return;
    }

    // 发送"思考中"卡片
    let thinkingMessageId: string | null = null;
    try {
      const thinkCard = buildThinkingCard();
      const thinkResp = await channel.rawClient.im.v1.message.create({
        params: { receive_id_type: 'chat_id' },
        data: {
          receive_id: msg.chatId,
          msg_type: 'interactive',
          content: JSON.stringify(thinkCard),
        },
      });
      thinkingMessageId = (thinkResp as any)?.data?.message_id as string | null;
    } catch {
      try {
        const fallback = await channel.send(msg.chatId, { markdown: '🤔 正在生成...' });
        thinkingMessageId = fallback.messageId;
      } catch { /* ignore */ }
    }

    const previousMessages = getSessionMessages(sessionKey);
    dlog('key=' + sessionKey + ' historyCount=' + previousMessages.length + ' input=' + cleaned.slice(0, 60));
    const result = await generateDiagram({
      source: 'feishu',
      messages: [...previousMessages, { role: 'user', content: cleaned }],
    });

    if (!result.success) {
      const errCard = buildResultCard({ title: '生成失败', summary: `❌ ${result.error}\n\n可简化描述后重试，或发送 /reset。`, code: '' });
      if (thinkingMessageId) {
        try { await channel.updateCard(thinkingMessageId, errCard); } catch { /* ignore */ }
      } else {
        await channel.send(msg.chatId, { markdown: `❌ 生成失败：${result.error}` });
      }
      return;
    }

    appendSessionTurn(sessionKey, cleaned, result.content);
    dlog('sessionSaved key=' + sessionKey + ' totalMessages=' + (previousMessages.length + 2));

    saveArtifact({
      title: '飞书生成的 Mermaid 示意图',
      description: cleaned.slice(0, 160),
      mermaidCode: result.mermaidCode,
      diagramType: result.diagramType,
      source: 'feishu',
    });

    // 渲染预览图并上传到飞书
    const imageKey = await renderPreviewImage(result.mermaidCode, channel.rawClient);

    const summary = `${previousMessages.length > 0 ? '已基于上一轮上下文优化。' : '已创建新的图表。'}\n${cleaned.slice(0, 160)}`;
    const card = buildResultCard({
      title: '已生成示意图',
      summary,
      code: result.mermaidCode,
      imageKey,
    });

    if (thinkingMessageId) {
      try { await channel.updateCard(thinkingMessageId, card); } catch {
        await channel.send(msg.chatId, { markdown: buildMermaidMarkdown(result.mermaidCode, summary) });
      }
    } else {
      await channel.send(msg.chatId, { markdown: buildMermaidMarkdown(result.mermaidCode, summary) });
    }
  });

  channel.on('error', (err) => {
    console.error('[feishu:channel] error:', err.message);
  });

  const startupId = Math.random().toString(36).slice(2, 8);
  await channel.connect();
  console.log('[feishu] Channel connected, PID=' + process.pid + ' startupId=' + startupId);
  dlog('SERVER_STARTED pid=' + process.pid + ' startupId=' + startupId + ' mockLlm=' + config.mockLlm);
}

// --- 预览图渲染 ---

async function renderPreviewImage(mermaidCode: string, rawClient: any): Promise<string | undefined> {
  try {
    // 去掉 %%{init} 块和 classDef 行以缩短 URL
    let cleanCode = mermaidCode.replace(/^%%\{init:[\s\S]*?\}%%\s*/m, '');
    const classDefs = cleanCode.match(/^classDef\s+\w+[\s\S]*?(?=\n\S|\n*$)/gm) || [];
    cleanCode = cleanCode.replace(/^classDef\s+\w+[\s\S]*?(?=\n\S|\n*$)/gm, '');
    // 去掉 class 应用行（如 class A,B sensor），因为 classDef 已被移除
    cleanCode = cleanCode.replace(/^\s*class\s+[\w,]+(?:\s+\w+)?\s*$/gm, '');

    const encoded = Buffer.from(cleanCode, 'utf-8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const inkUrl = `https://mermaid.ink/img/${encoded}?theme=base&scale=2`;
    dlog('[preview] urlLen=' + inkUrl.length);

    const resp = await fetch(inkUrl);
    dlog('[preview] status=' + resp.status);
    if (!resp.ok) {
      // 重试：进一步精简（去掉多余空白）
      const compact = cleanCode.replace(/\n{2,}/g, '\n').trim();
      const enc2 = Buffer.from(compact, 'utf-8').toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url2 = `https://mermaid.ink/img/${enc2}?theme=base&scale=2`;
      dlog('[preview] retry urlLen=' + url2.length);
      const resp2 = await fetch(url2);
      dlog('[preview] retry status=' + resp2.status);
      if (!resp2.ok) return undefined;
      const buf2 = Buffer.from(await resp2.arrayBuffer());
      const up2 = await rawClient.im.v1.image.create({ data: { image_type: 'message', image: buf2 } });
      return (up2 as any)?.image_key as string | undefined;
    }

    const imageBuffer = Buffer.from(await resp.arrayBuffer());
    dlog('[preview] downloaded ' + imageBuffer.length + ' bytes');

    const uploadResp = await rawClient.im.v1.image.create({
      data: { image_type: 'message', image: imageBuffer },
    });
    const imageKey = (uploadResp as any)?.image_key as string | undefined;
    dlog('[preview] uploaded, imageKey=' + imageKey);
    return imageKey;
  } catch (err) {
    dlog('[preview] ERROR: ' + (err instanceof Error ? err.message : String(err)));
    return undefined;
  }
}

// --- 卡片构建 ---

function buildThinkingCard(): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { tag: 'plain_text', content: '鲛人书 Arielgram' },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: '🤔 已收到你的描述，正在生成 Mermaid 图表...' } },
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: '请稍候，正在结合上下文生成...' } },
    ],
  };
}

function buildResultCard(input: { title: string; summary: string; code: string; imageKey?: string }): object {
  const elements: any[] = [
    { tag: 'div', text: { tag: 'lark_md', content: input.summary } },
  ];

  if (input.imageKey) {
    elements.push({ tag: 'hr' });
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: '**预览图：**' } });
    elements.push({
      tag: 'img',
      img_key: input.imageKey,
      alt: { tag: 'plain_text', content: 'Mermaid 预览图' },
    });
  }

  if (input.code) {
    elements.push({ tag: 'hr' });
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: '**Mermaid 代码：**\n```mermaid\n' + input.code + '\n```' } });
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      template: input.code ? 'blue' : 'red',
      title: { tag: 'plain_text', content: input.title },
    },
    elements,
  };
}

function buildMermaidMarkdown(code: string, summary: string): string {
  return `${summary}\n\nMermaid 代码：\n\`\`\`mermaid\n${code}\n\`\`\``;
}

function isResetCommand(text: string): boolean {
  return text.trim().toLowerCase() === '/reset';
}
