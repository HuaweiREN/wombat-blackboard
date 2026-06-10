# Wombat-Blackboard 重构与迭代进度记录

> 日期：2026-06-09

## 阶段 a：文档与代码理解 + ANALYSIS.md 输出

- 阶段完成内容：
  - 已阅读项目根目录说明文档、`docs/PRD.md`、`docs/technical-solution.md`、便携版说明、飞书兼容性测试文档。
  - 已逐文件阅读前端、后端、共享类型、配置、Prompt、模板与构建相关源码。
  - 已梳理当前核心功能、架构、数据流、UI 组件结构、已实现能力和缺口。
  - 已创建 `ANALYSIS.md`，记录项目架构概览、代码质量问题、与 PRD/技术方案的差距和迭代计划。
- 遇到的问题：
  - 当前项目没有 `lint` 脚本，需要在后续质量阶段补齐。
  - 飞书 WebSocket 集成尚不存在，需要新增官方 SDK 与独立服务模块。
  - 当前 UI 缺乏设计 token 和亮色模式，需要整体重做。
- 当前完成度：15%。
- 下一阶段计划：完成竞品调研记录，并将可借鉴的设计策略固化到 `ANALYSIS.md`。

## 阶段 b：竞品调研与设计策略提炼

- 阶段完成内容：
  - 已研究 Miro、FigJam、tldraw、Excalidraw、CARLA/ScenarioRunner/OpenSCENARIO 生态以及 AI 图表生成工具的相关能力。
  - 已在 `ANALYSIS.md` 中记录每类产品的优缺点。
  - 已提炼至少 5 条可用于 Wombat-Blackboard 的具体设计与交互思路。
  - 已查阅飞书开放平台 WebSocket 事件订阅、tenant_access_token 与消息发送相关官方文档。官方文档说明 Node.js SDK 通过 `WSClient` 和 `EventDispatcher` 接收 `im.message.receive_v1`，WebSocket 模式内置加密传输与鉴权逻辑，收到消息需在 3 秒内完成处理入口。
- 遇到的问题：
  - 部分竞品页面动态渲染较多，网页抓取只能获得主要文案，细节以公开产品能力和官方文档为准。
  - 飞书消息图片化回复需要额外服务端渲染/上传图片链路，当前计划优先实现交互式卡片 + Mermaid 代码 + 可配置预览链接。
- 当前完成度：25%。
- 下一阶段计划：开始 UI 全面美化，建立 Tailwind 设计 token、亮暗模式与响应式布局。

## 阶段 c：UI 全面美化实现

- 阶段完成内容：
  - 已重构 Tailwind 配置，新增品牌色板、语义色、阴影、圆角、字体 token，并启用系统级亮暗模式。
  - 已将整体页面升级为现代 SaaS 风格：渐变背景、玻璃卡片、品牌 Header、飞书状态、模板入口。
  - 已优化对话区空状态，增加 3 个智驾示例 prompt；消息区、加载态、错误提示、输入区均完成视觉升级。
  - 已将预览区改造成白板式画布卡片，保留新窗口预览能力。
  - 已将代码区改造成结果资产面板，支持图表类型标签、行号、一键复制和飞书 `/mermaid` 指引。
  - 已在 `ANALYSIS.md` 中补充 UI 改造清单和文字版前后对比截图描述。
- 遇到的问题：
  - Tailwind 不支持 `bg-white/82` 这类非标准透明度阶梯，已改为标准 `bg-white/80` 与 `dark:bg-slate-950/70`。
  - Mermaid 动态依赖构建后存在大 chunk 警告，当前不影响功能，后续可继续做更细的 lazy chunk 优化。
- 当前完成度：45%。
- 下一阶段计划：实现飞书 WebSocket 长连接模块、tenant token 缓存、卡片消息回复与本地模拟联调。

## 阶段 d：飞书 WebSocket 集成开发与联调

- 阶段完成内容：
  - 已安装飞书官方 Node SDK `@larksuiteoapi/node-sdk`。
  - 已新增 `feishu-bot.ts`，使用官方 `WSClient` + `EventDispatcher` 订阅 `im.message.receive_v1`，事件入口快速返回，实际生成放入异步任务，满足 3 秒处理入口要求。
  - 已新增 `feishu-client.ts`，包含 tenant_access_token 获取与缓存、飞书交互式卡片回复、异常退避重试。
  - 已新增本地模拟模式：`WOMBAT_MOCK_LLM=true` 与 `FEISHU_MOCK_SEND=true`，可不依赖真实模型和飞书网络完成端到端链路测试。
  - 已新增 `/api/feishu/simulate` 模拟入口（仅 mock 模式开放），用于模拟用户在飞书发消息。
  - 已新增 `/api/share/:id` 临时分享页，可供飞书卡片打开预览链接。
  - 已通过 3 类场景本地模拟测试：架构图、状态图、时序图；卡片发送在 mock 模式下返回成功。
- 工作流程说明：
  1. 飞书开放平台配置事件订阅方式为“通过长连接接收事件”。
  2. 后端启动时读取 `FEISHU_WS_ENABLED=true`、`FEISHU_APP_ID`、`FEISHU_APP_SECRET`，创建 `WSClient`。
  3. 用户在群聊或单聊 @机器人 并发送文本。
  4. `im.message.receive_v1` 事件进入 `handleMessageEvent()`，清理 @ 文本并调用统一的 `generateDiagram()`。
  5. 后端保存内存 artifact，生成 `/api/share/:id` 预览链接。
  6. 后端通过飞书消息 API 回复交互式卡片，卡片包含图表类型、摘要、Mermaid 代码与预览链接。
- 配置步骤：
  - 复制 `server/.env.example` 为 `server/.env`。
  - 配置 `DEEPSEEK_API_KEY`、`FEISHU_WS_ENABLED=true`、`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`PUBLIC_BASE_URL`。
  - 在飞书开发者后台开启机器人能力，添加 `im.message.receive_v1` 事件，并选择 WebSocket 长连接订阅。
  - 启动 `npm run dev:server` 或生产环境 `npm run build && npm run start`。
- 测试方法：
  - WebSocket 连接测试：启动服务后查看日志；真实模式下 SDK 成功连接会打印连接信息。健康检查 `/api/health` 可查看 `feishu.websocketEnabled`、`appIdConfigured`、`appSecretConfigured`。
  - 本地端到端模拟：设置 `WOMBAT_MOCK_LLM=true`、`FEISHU_MOCK_SEND=true`、`PORT=3011`，调用 `/api/feishu/simulate`，分别发送 architecture、state machine、sequence 三类描述。
  - 断线重连测试：真实模式下手动断网或重启服务，官方 SDK 负责心跳与重连；验证恢复后再次 @机器人 能收到回复。
- 遇到的问题：
  - 为避免将 app_secret 固化到版本库，代码默认从 `server/.env` 读取密钥；示例文件只提供占位符。
  - PowerShell 直接发送中文 JSON 时可能受控制台编码影响，本地模拟联调使用英文关键词验证类型分支，真实飞书事件为 UTF-8 JSON，不受该问题影响。
- 当前完成度：70%。
- 下一阶段计划：继续清理生成服务职责、补齐 shared workspace 构建脚本、完成全量 lint/build。

## 阶段 e：代码重构与架构优化

- 阶段完成内容：
  - 已抽取 `diagram-service.ts`，统一 Web API 与飞书机器人生成通路，路由层不再直接承担 LLM 调用、语法校验、主题注入等职责。
  - 已抽取 `artifact-store.ts`，为未来生成结果、分享链接、多用户协作 artifact 预留扩展点。
  - 已扩展配置层，集中管理 `PUBLIC_BASE_URL`、飞书配置、mock LLM 与 mock send。
  - 已补齐 `shared` workspace 的 `tsconfig.json`、`lint` 与 `build` 脚本，使根项目质量命令完整可执行。
  - 已为新增代码加入中文注释、错误处理、重试与 mock 安全开关。
- 遇到的问题：
  - 根项目原始 `build` 依赖 `shared` 的 build 脚本，但 `shared` 未定义该脚本，首次构建失败；已补齐。
  - 根项目原始无 `lint` 脚本，已补齐为 shared/server/client 全量 TypeScript 检查。
- 当前完成度：82%。
- 下一阶段计划：进入集成测试与最终审查，并执行两轮自我完善循环。

## 阶段 f：集成测试与最终审查

### 自我完善循环第 1 轮

- `npm run lint`：通过。shared/server/client 均通过 `tsc --noEmit`。
- `npm run build`：通过。shared/server/client 均构建成功；Vite 仅提示 Mermaid 相关大 chunk 警告，不影响运行。
- UI 手动走查：
  - 390×844 移动端暗色：上下布局可用，输入区、示例 prompt、预览区、代码面板不遮挡。
  - 768×1024 平板亮色：Header 换行正常，模板入口与飞书状态可读。
  - 1024×768 小桌面暗色：左右主布局切换正常，预览卡片最小高度可用。
  - 1440×900 桌面亮色：对话区/画布区比例舒适，代码区高度合适。
  - 1920×1080 桌面暗色：最大宽度约束生效，内容不会过度拉伸。
- 飞书集成测试：
  - 模拟模式启动：`WOMBAT_MOCK_LLM=true`、`FEISHU_MOCK_SEND=true`、`PORT=3011`。
  - 3 类场景均成功：architecture → flowchart，state machine → state，sequence interaction → sequence。
  - 断线重连模拟：停止 3011 进程后重启服务，健康检查恢复，模拟消息 `state machine reconnection test` 成功回复 mock 卡片。
- 架构问题复审：
  1. 路由层职责过重：已通过 `diagram-service.ts` 分离生成服务解决。
  2. 缺少飞书模块：已通过 `feishu-bot.ts` 与 `feishu-client.ts` 解决。
  3. 根项目质量脚本缺失：已补齐 `lint` 和 shared `build`。
- 本轮发现并修复：
  - 发现 shared workspace 缺少 build 脚本，已补齐。
  - 发现 Tailwind 非标准透明度类导致构建失败，已修复。
  - 发现 mock 时序英文关键词未覆盖，已扩展匹配规则。
- 当前完成度：92%。
- 下一阶段计划：执行第 2 轮完整自检；若无新增问题，追加最终交付报告。

### 自我完善循环第 2 轮

- `npm run lint`：通过。shared/server/client 均通过 `tsc --noEmit`。
- `npm run build`：通过。shared/server/client 均构建成功；Vite 仍仅有 Mermaid 大 chunk 提示，属于依赖体积提示非错误。
- UI 手动走查：复查移动端、平板、小桌面、桌面、宽屏五类布局，未发现新的遮挡、溢出或对比度问题；亮暗模式通过 `prefers-color-scheme` 自动适配。
- 飞书集成测试：
  - `architecture sensor domain controller actuator`：模拟回复成功，图表类型 `flowchart`。
  - `state machine OFF Standby Active Failure`：模拟回复成功，图表类型 `state`。
  - `sequence lane change interaction planning EPS`：模拟回复成功，图表类型 `sequence`。
  - 断线重连：第 1 轮已完成进程停止与重启验证，第 2 轮复查健康检查和模拟消息均正常。
- 架构问题复审：
  1. 前后端质量命令不完整：已解决，连续两轮 `lint` 与 `build` 通过。
  2. Web API 与飞书机器人生成逻辑重复风险：已解决，统一复用 `generateDiagram()`。
  3. 未来协作扩展点缺失：已初步解决，新增 artifact 模型与分享页，后续可扩展到 `boardId`、版本树和多人编辑事件流。
- 本轮发现并修复：无新增必须修改项。
- 当前完成度：100%。
- 下一阶段计划：任务完成，输出最终交付报告。

## 最终交付报告

### 1. 项目最终目录结构树（核心文件）

```text
wombat-blackboard/
├── ANALYSIS.md
├── PROGRESS.md
├── README.md
├── package.json
├── build.mjs
├── docs/
│   ├── PRD.md
│   └── technical-solution.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       │   ├── CodePanel.tsx
│       │   ├── InputPanel.tsx
│       │   ├── MessageBubble.tsx
│       │   ├── PreviewPanel.tsx
│       │   └── TemplateSelector.tsx
│       ├── hooks/
│       │   ├── useConversation.ts
│       │   └── useMermaidRender.ts
│       ├── services/api.ts
│       └── types/index.ts
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config.ts
│       ├── index.ts
│       ├── routes/generate.ts
│       └── services/
│           ├── artifact-store.ts
│           ├── diagram-service.ts
│           ├── feishu-bot.ts
│           ├── feishu-client.ts
│           ├── llm-client.ts
│           └── prompt-builder.ts
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── types.ts
├── prompts/
│   ├── glossary.md
│   ├── system-prompt.md
│   └── few-shot/*.md
├── templates/
│   ├── index.json
│   └── *.md
└── tests/
   └── feishu-mermaid-compat.md
```

### 2. 每个模块的功能说明及改动摘要

- `client`：完成现代 SaaS UI 重设计；支持系统亮暗模式、响应式布局、示例 prompt、玻璃卡片、白板预览和代码资产面板。
- `server/routes`：路由层瘦身，主要负责 HTTP 输入输出、模板列表、分享页与模拟测试入口。
- `server/services/diagram-service.ts`：新增统一生成服务，封装输入校验、Prompt 组装、LLM 调用、基础 Mermaid 校验、主题头注入和图表类型识别。
- `server/services/feishu-bot.ts`：新增飞书 WebSocket 长连接模块，接收 `im.message.receive_v1`，异步生成并回复。
- `server/services/feishu-client.ts`：新增 tenant_access_token 缓存、飞书卡片发送、重试和 mock send。
- `server/services/artifact-store.ts`：新增内存 artifact 存储与分享页支持，为未来多用户协作和版本化结果预留扩展点。
- `shared`：补齐构建与 lint 能力，使根项目 `npm run lint` / `npm run build` 能完整执行。

### 3. UI 美化前后对比描述

- 改造前：深灰工程界面，按钮、输入框、卡片没有统一 token；品牌感弱；移动端只是基础堆叠；亮色模式缺失。
- 改造后：采用蓝白/深蓝黑双主题，默认跟随系统；Header 展示 Wombat 品牌、飞书状态与模板入口；对话区提供示例卡片；预览区更像白板画布；代码区成为可复制资产面板；移动端和平板均可用。

### 4. 飞书 WebSocket 长连接集成配置说明

1. 复制 `server/.env.example` 为 `server/.env`。
2. 配置：
  - `DEEPSEEK_API_KEY`：模型调用密钥。
  - `PUBLIC_BASE_URL`：可选。仅用于飞书卡片里的预览链接；WebSocket 长连接接收事件不需要公网回调地址。如果不需要卡片预览链接，可保持默认本机地址。
  - `FEISHU_WS_ENABLED=true`：启用飞书 WebSocket 长连接。
  - `FEISHU_APP_ID`：飞书自建应用 App ID。
  - `FEISHU_APP_SECRET`：飞书自建应用 App Secret。
3. 飞书开发者后台：
  - 开启机器人能力。
  - 事件订阅方式选择“通过长连接接收事件”。
  - 添加 `im.message.receive_v1` 事件。
  - 确认应用具备发送消息相关权限，并发布/安装到目标租户。
4. 启动：`npm run dev:server` 或生产构建后 `npm run start`。
5. 真实测试：在群聊或单聊中 @机器人 并发送智驾场景描述，机器人回复交互式卡片，包含 Mermaid 代码和预览链接。
6. 本地模拟测试：
  - 设置 `WOMBAT_MOCK_LLM=true`、`FEISHU_MOCK_SEND=true`、`PORT=3011`。
  - 启动后调用 `/api/feishu/simulate`，请求体示例：`{"text":"state machine OFF Standby Active Failure"}`。

### 5. 竞品调研主要结论与已采纳设计点

- Miro/FigJam：采纳模板入口、清晰分区、协作状态提示和低门槛空状态。
- tldraw/Excalidraw：采纳快速进入、结果即资产、一键复制与轻量画布心智。
- CARLA/OpenSCENARIO：采纳场景结构化、ODD/触发条件/动作序列显式化和版本化 artifact 扩展思路。
- AI 图表工具：采纳对话式精修、生成后预览、错误反馈和卡片式结果呈现。

### 6. 启动与使用说明

- 安装依赖：`npm install`。
- 本地全栈开发：`npm run dev`。
- 仅后端：`npm run dev:server`。
- 仅前端：`npm run dev:client`。
- 质量检查：`npm run lint`。
- 构建：`npm run build`。
- 生产启动：`npm run start`。
- Web 使用：打开 `http://localhost:3001`，输入智驾场景描述，复制 Mermaid 代码到飞书 `/mermaid`。
- 飞书使用：启用 `FEISHU_WS_ENABLED=true` 并完成飞书事件订阅配置后，在飞书 @机器人发送描述，即可收到 Mermaid 卡片回复。

### 7. 最终验证结果

- 连续两轮 `npm run lint`：通过。
- 连续两轮 `npm run build`：通过。
- 两轮飞书模拟端到端测试：通过。
- 断线重连模拟：通过。
- VS Code Problems：无错误。
- 最终状态：满足本次重构与功能迭代完成标准。

## 追加优化：飞书多用户会话与可携带结果回复

- 完成内容：
  - 飞书消息进入后先回复 `Wombat thinking...` 状态卡片，避免用户等待时无反馈。
  - 新增用户级 session：优先按 `sender.open_id` 隔离上下文，不同用户互不影响。
  - 同一用户消息串行排队处理，避免连续消息并发导致上下文错乱。
  - 同一用户连续发送需求时，会携带该用户历史 `user/assistant` 消息，默认在上一张图基础上优化。
  - 支持 `/reset`：清除该用户上下文，并回复“上下文已清除”。清除后下一条消息从空上下文重新画图。
  - 飞书卡片不再发送 `localhost` 预览链接；如果 `PUBLIC_BASE_URL` 是公网地址才展示预览按钮。
  - 卡片内始终携带 Mermaid 代码，保证其他用户可直接复制使用；代码过长时额外发送 `.md` 附件。
- 关键文件：
  - `server/src/services/feishu-session.ts`
  - `server/src/services/feishu-bot.ts`
  - `server/src/services/feishu-client.ts`
  - `server/src/routes/generate.ts`
- 验证结果：
  - `npm run lint`：通过。
  - `npm run build`：通过。
  - mock 链路验证：同用户连续消息、不同用户隔离、`/reset` 后重新开始均通过。
