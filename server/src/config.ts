import dotenv from 'dotenv';
dotenv.config();

// BUILD_API_KEY is injected by esbuild at build time (for SEA exe)
// In dev mode (tsx), this variable won't exist, so we fall back to env
declare global { var BUILD_API_KEY: string | undefined; }
const buildKey = (typeof globalThis.BUILD_API_KEY !== 'undefined') ? globalThis.BUILD_API_KEY : undefined;

export const config = {
  apiKey: buildKey || process.env.DEEPSEEK_API_KEY || '',
  baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
  port: parseInt(process.env.PORT || '3001', 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || '3001'}`,
  maxRetries: 2,
  maxTokens: 4096,
  llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '120000', 10),
  maxHistoryMessages: 20,
  mockLlm: process.env.WOMBAT_MOCK_LLM === 'true',
  feishu: {
    enabled: process.env.FEISHU_WS_ENABLED === 'true',
    appId: process.env.FEISHU_APP_ID || 'cli_a939ec1049f8dbcc',
    appSecret: process.env.FEISHU_APP_SECRET || '',
    domain: process.env.FEISHU_DOMAIN || 'https://open.feishu.cn',
    maxReplyRetries: parseInt(process.env.FEISHU_MAX_REPLY_RETRIES || '2', 10),
    mockSend: process.env.FEISHU_MOCK_SEND === 'true',
  },
};
