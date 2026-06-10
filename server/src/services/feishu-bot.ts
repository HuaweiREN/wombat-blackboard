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
        markdown: '✅ 已清除你之前的对话上下文。下一条需求会作为全新的画图任务开始。',
      });
      return;
    }

    let thinkingMessageId: string | null = null;
    try {
      const thinkResp = await channel.send(msg.chatId, {
        markdown: '🤔 已收到你的描述，正在生成 Mermaid 图表...',
      });
      thinkingMessageId = thinkResp.messageId;
    } catch {
      // ignore
    }

    const previousMessages = getSessionMessages(sessionKey);
    dlog('key=' + sessionKey + ' historyCount=' + previousMessages.length + ' input=' + cleaned.slice(0, 60));
    if (previousMessages.length > 0) {
      dlog('  lastRole=' + previousMessages[previousMessages.length - 1].role + ' lastContent=' + previousMessages[previousMessages.length - 1].content.slice(0, 200));
    }
    const result = await generateDiagram({
      source: 'feishu',
      messages: [...previousMessages, { role: 'user', content: cleaned }],
    });

    if (!result.success) {
      const errText = `❌ 生成失败：${result.error}\n\n你可以简化描述后重试，或发送 /reset 清空上下文。`;
      if (thinkingMessageId) {
        try { await channel.updateCard(thinkingMessageId, buildResultCard({ title: '生成失败', summary: errText, code: '' })); } catch { /* ignore */ }
      } else {
        await channel.send(msg.chatId, { markdown: errText });
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

    const summary = `${previousMessages.length > 0 ? '已基于你的上一轮上下文优化。' : '已创建新的图表。'}\n${cleaned.slice(0, 160)}`;
    const card = buildResultCard({
      title: 'Wombat 已生成示意图',
      summary,
      code: result.mermaidCode,
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

function buildResultCard(input: { title: string; summary: string; code: string }): object {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: input.code ? 'blue' : 'red',
      title: { tag: 'plain_text', content: input.title },
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: input.summary } },
      ...(input.code ? [
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'lark_md', content: '请复制下面 Mermaid 代码到飞书文档 `/mermaid` 块中渲染：' } },
        { tag: 'div', text: { tag: 'lark_md', content: '```mermaid\n' + input.code + '\n```' } },
      ] : []),
    ],
  };
}

function buildMermaidMarkdown(code: string, summary: string): string {
  return `${summary}\n\n请复制下面 Mermaid 代码到飞书文档 \`/mermaid\` 块中渲染：\n\`\`\`mermaid\n${code}\n\`\`\``;
}

function isResetCommand(text: string): boolean {
  return text.trim().toLowerCase() === '/reset';
}
