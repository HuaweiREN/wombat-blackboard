import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

const client = new Anthropic({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
  timeout: config.llmTimeoutMs,
});

function extractText(response: any): string {
  const content = response.content;

  if (Array.isArray(content)) {
    // DeepSeek returns [thinking_block, text_block]
    // Find the text block (skip thinking blocks)
    for (const block of content) {
      if (block.type === 'text' && block.text) return block.text;
    }
    // Fallback: any block with text
    for (const block of content) {
      if (block.text && block.type !== 'thinking') return block.text;
    }
  }

  if (typeof content === 'string') return content;
  if (response.text) return response.text;
  if (response.message) return extractText(response.message);

  throw new Error(`Cannot extract text. content type: ${typeof content}, isArray: ${Array.isArray(content)}`);
}

const LLMLOG = 'D:/00_Huawei/Documents/02_learn/My_AI_Projects/vscode_workspace/wombat-blackboard/logs/debug.log';
function llog(msg: string) { try { require('fs').appendFileSync(LLMLOG, new Date().toISOString() + ' ' + msg + '\n'); } catch {} }

export async function generateMermaidCode(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onRetry?: (error: string) => Promise<string>
): Promise<string> {
  if (config.mockLlm) {
    llog('[llm] MOCK mode, returning mock response');
    return buildMockMermaid(messages[messages.length - 1]?.content || '');
  }

  if (!config.apiKey) {
    llog('[llm] ERROR: no API key');
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const requestMessages = messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  try {
    llog('[llm] calling API, model=' + config.model + ' msgCount=' + requestMessages.length);
    const t0 = Date.now();
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: requestMessages,
    });
    llog('[llm] API response in ' + (Date.now() - t0) + 'ms');

    return extractText(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    llog('[llm] API call FAILED: ' + errorMessage);
    console.error('[llm-client] Primary call failed:', errorMessage);

    if (onRetry && config.maxRetries > 0) {
      try {
        const fixInstruction = await onRetry(errorMessage);
        const retryMessages = [
          ...requestMessages,
          { role: 'user' as const, content: fixInstruction },
        ];

        const retryResponse = await client.messages.create({
          model: config.model,
          max_tokens: config.maxTokens,
          system: systemPrompt,
          messages: retryMessages,
        });

        return extractText(retryResponse);
      } catch (retryErr) {
        const retryErrorMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        throw new Error(`LLM API error (retry failed): ${retryErrorMsg}`);
      }
    }

    throw new Error(`LLM API error: ${errorMessage}`);
  }
}

function buildMockMermaid(input: string): string {
  // 本地联调专用：不调用外部模型，按关键词返回稳定 Mermaid，便于测试飞书长连接链路。
  if (/状态|state|切换|流转/i.test(input)) {
    return `\`\`\`mermaid
stateDiagram-v2
    [*] --> OFF: 系统下电
    OFF --> STANDBY: 上电自检通过
    STANDBY --> ACTIVE: ODD满足且驾驶员确认
    ACTIVE --> OVERRIDE: 驾驶员干预
    ACTIVE --> FAILURE: 系统故障
    FAILURE --> OFF: 重新上电
\`\`\``;
  }

  if (/时序|交互|调用|发送|变道|sequence|interaction|lane change/i.test(input)) {
    return `\`\`\`mermaid
sequenceDiagram
    autonumber
    participant DRV as "驾驶员"
    participant ADS as "智驾域控"
    participant PLAN as "规划模块"
    participant EPS as "转向EPS"
    DRV->>ADS: 发送场景指令
    ADS->>PLAN: 生成轨迹规划
    PLAN->>EPS: 下发转向请求
    EPS-->>ADS: 执行反馈
\`\`\``;
  }

  return `\`\`\`mermaid
flowchart TD
    subgraph Sensor["传感器层"]
        CAM[前视摄像头]
        RAD[毫米波雷达]
    end
    subgraph Compute["计算层"]
        ADS[智驾域控]
        PER[感知融合]
        PLAN[规划控制]
    end
    ACT[执行器EPS/ESC]
    CAM -->|GMSL| ADS
    RAD -->|CAN-FD| ADS
    ADS --> PER --> PLAN --> ACT
\`\`\``;
}
