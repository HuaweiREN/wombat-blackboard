import { config } from '../config';
import type { ConversationMessage } from './diagram-service';

interface FeishuUserSession {
  messages: ConversationMessage[];
  updatedAt: number;
}

const sessions = new Map<string, FeishuUserSession>();
const sessionQueues = new Map<string, Promise<void>>();

export function getSessionMessages(sessionKey: string): ConversationMessage[] {
  const entry = sessions.get(sessionKey);
  try { require('fs').appendFileSync('D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log', new Date().toISOString() + ' [getSession] key=' + sessionKey + ' found=' + Boolean(entry) + ' msgCount=' + (entry?.messages.length ?? 0) + '\n'); } catch {}
  return [...(entry?.messages ?? [])];
}

export function appendSessionTurn(sessionKey: string, userContent: string, assistantContent: string): void {
  const current = sessions.get(sessionKey)?.messages ?? [];
  const nextMessages: ConversationMessage[] = [
    ...current,
    { role: 'user' as const, content: userContent },
    { role: 'assistant' as const, content: assistantContent },
  ].slice(-config.maxHistoryMessages);

  sessions.set(sessionKey, {
    messages: nextMessages,
    updatedAt: Date.now(),
  });
  try { require('fs').appendFileSync('D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log', new Date().toISOString() + ' [appendSession] key=' + sessionKey + ' size=' + sessions.size + ' messages=' + nextMessages.length + '\n'); } catch {}

  pruneExpiredSessions();
  try { require('fs').appendFileSync('D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log', new Date().toISOString() + ' [afterPrune] size=' + sessions.size + '\n'); } catch {}
}

export function clearSession(sessionKey: string): void {
  try { require('fs').appendFileSync('D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log', new Date().toISOString() + ' [clearSession] key=' + sessionKey + '\n' + new Error().stack + '\n'); } catch {}
  sessions.delete(sessionKey);
  sessionQueues.delete(sessionKey);
}

export function enqueueSessionTask(sessionKey: string, task: () => Promise<void>): Promise<void> {
  // 同一用户的飞书消息串行处理，避免“上一条基础上优化”时上下文被并发写乱。
  const previous = sessionQueues.get(sessionKey) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(task)
    .finally(() => {
      if (sessionQueues.get(sessionKey) === next) {
        sessionQueues.delete(sessionKey);
      }
    });

  sessionQueues.set(sessionKey, next);
  return next;
}

function pruneExpiredSessions(): void {
  const now = Date.now();
  const maxIdleMs = 24 * 60 * 60 * 1000;
  for (const [key, session] of sessions.entries()) {
    if (now - session.updatedAt > maxIdleMs) {
      sessions.delete(key);
    }
  }

  // 防止极端情况下内存无限增长，只保留最近更新的 500 个用户会话。
  if (sessions.size > 500) {
    const sorted = [...sessions.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    for (const [key] of sorted.slice(0, sessions.size - 500)) {
      sessions.delete(key);
    }
  }
}
