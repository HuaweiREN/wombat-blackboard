# Wombat-Blackboard

自然语言 → Mermaid 代码 + 预览图 → 飞书卡片即时回复。

用中文描述场景，即可生成带预览图的 Mermaid 图表代码，支持飞书机器人交互和 Web UI。

## 目标用户

汽车智能驾驶系统的产品经理、Feature Owner、系统工程师、架构师。

## 在新电脑上运行

### 前提

- Node.js >= 22（[下载](https://nodejs.org/) 或用 [nvm](https://github.com/nvm-sh/nvm) 安装）
- 能访问外网（调用 DeepSeek API + 飞书 WebSocket 长连接）
- 飞书应用（[飞书开发者后台](https://open.feishu.cn/) 创建）
  - 事件订阅：使用长连接接收事件
  - 添加事件：`im.message.receive_v1`
  - 开启机器人能力

### 1. 获取代码

```bash
git clone <仓库地址>
cd wombat-blackboard
```

### 2. 安装依赖

```bash
npm install
cd client && npm install && npm run build && cd ..
cd server && npx tsc && cd ..
```

### 3. 配置 .env

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`，填入必填项：

```ini
DEEPSEEK_API_KEY=sk-xxxxxxxx        # DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
DEEPSEEK_MODEL=deepseek-v4-pro
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001

FEISHU_WS_ENABLED=true
FEISHU_APP_ID=cli_xxxxxxxx          # 飞书应用 App ID
FEISHU_APP_SECRET=xxxxxxxx          # 飞书应用 App Secret
FEISHU_DOMAIN=https://open.feishu.cn
FEISHU_MAX_REPLY_RETRIES=2

WOMBAT_MOCK_LLM=false               # true=LLM 返回固定 mock
FEISHU_MOCK_SEND=false              # true=不真实发送飞书消息
NO_BROWSER=true                     # 启动时不弹浏览器
```

### 4. 启动

```bash
cd server

# 前台运行
node dist/index.js

# 后台运行（Linux / macOS）
nohup node dist/index.js > ../logs/server.log 2>&1 &
```

### 5. 验证

```bash
curl http://localhost:3001/api/health
# → {"success":true,"status":"ok",...}
```

飞书里 @机器人 发送画图指令测试。也可浏览器打开 `http://localhost:3001` 使用 Web UI。

## 使用方式

### 飞书机器人

在群聊或单聊中 @机器人发送：

```
画一个 HWP 状态机，包含 OFF、Standby、Active、Override、Failure
把 FAILURE 改名为 FAULT
/reset
```

Bot 会先回复一张"思考中"蓝色卡片，生成完成后**原地更新**为预览图 + Mermaid 代码。

### 命令

| 命令 | 作用 |
|------|------|
| `/reset` | 清空当前用户上下文，下次作为新任务开始 |
| `/ping` | 确认机器人是否在线 |

### Web UI

浏览器打开 `http://localhost:3001`，输入描述即可生成图表。

## 项目结构

```
wombat-blackboard/
├── client/                # React + Vite 前端
├── server/                # Express + Feishu Bot 后端
│   └── src/
│       ├── index.ts              # 入口
│       ├── config.ts             # 配置
│       ├── routes/generate.ts    # HTTP API
│       └── services/
│           ├── feishu-bot.ts     # 飞书机器人（LarkChannel）
│           ├── feishu-session.ts # 按用户隔离 Session
│           ├── diagram-service.ts # 图表生成编排
│           ├── llm-client.ts     # LLM API 封装
│           └── prompt-builder.ts # Prompt 构建
├── shared/                # 共享类型
├── prompts/               # System Prompt + few-shot + glossary
│   ├── system-prompt.md
│   ├── glossary.md
│   └── few-shot/
├── templates/             # 领域模板
├── docs/                  # 文档
│   ├── PRD.md
│   ├── tutorial.md        # 部署 & 搬迁教程
│   └── technical-solution.md
└── tests/                 # 测试
```

## 技术栈

- **后端**: Express + TypeScript + Anthropic SDK (DeepSeek 兼容 API)
- **飞书**: LarkChannel (WebSocket 长连接) + 交互式卡片 + 图片上传
- **前端**: React + Vite + Tailwind + Mermaid.js
- **预览图**: mermaid.ink 在线渲染 → 上传飞书嵌入卡片
- **运行**: Node.js 原生运行，不依赖 tsx 热重载

## 常见问题

| 问题 | 排查 |
|------|------|
| 飞书消息无响应 | 检查 `logs/debug.log` 是否有 `SERVER_STARTED` 多次出现 |
| 预览图不显示 | 检查 `logs/debug.log` 中 `[preview]` 日志 |
| 端口被占用 | `npx kill-port 3001` 或改 `.env` 中 `PORT` |
| Node 版本过低 | >= 22 才有原生 `fetch` |
