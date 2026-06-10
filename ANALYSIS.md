# Wombat-Blackboard 深度分析与迭代计划

> 日期：2026-06-09  
> 范围：wombat-blackboard 根目录文档、前端 React/Vite、后端 Express/TypeScript、Prompt/模板系统、飞书集成方向。

## 1. 当前项目核心功能与架构概览

Wombat-Blackboard 当前是一款面向汽车智能驾驶领域的自然语言转 Mermaid 示意图工具。用户在 Web UI 中输入中文或中英混合的场景描述，前端将对话历史与可选模板 ID 发送给后端，后端通过 Prompt Builder 注入系统提示词、领域术语词典、Few-shot 示例与模板描述，再调用 DeepSeek/Anthropic 兼容接口生成 Mermaid 代码。前端使用 Mermaid.js 对生成代码进行实时预览，并提供复制到飞书文档 `/mermaid` 的使用路径。

### 1.1 模块划分

- 前端 `client/`
  - `App.tsx`：页面容器，组合 Header、对话区、预览区、代码区。
  - `components/`：输入、消息气泡、模板选择器、预览、代码复制等 UI 组件。
  - `hooks/useConversation.ts`：维护对话状态、加载状态、错误状态与当前 Mermaid 代码。
  - `hooks/useMermaidRender.ts`：动态加载 Mermaid 并渲染 SVG。
  - `services/api.ts`：封装 `/api/generate` 与 `/api/templates`。
- 后端 `server/`
  - `index.ts`：Express 入口、静态资源服务、健康检查、SPA fallback。
  - `routes/generate.ts`：生成接口、模板索引接口、基础语法校验、主题头注入。
  - `services/prompt-builder.ts`：读取 Prompt、Glossary、Few-shot、模板并组装 system prompt。
  - `services/llm-client.ts`：Anthropic SDK 封装，调用 DeepSeek 兼容接口。
  - `config.ts`：读取模型、端口、API key 等配置。
- 共享层 `shared/`
  - 存放通用类型，但目前前后端没有真正通过 workspace 包复用。
- 资产层
  - `prompts/`：系统提示词、领域术语词典、Few-shot 示例。
  - `templates/`：智驾领域模板自然语言描述。
  - `tests/feishu-mermaid-compat.md`：飞书 Mermaid 兼容性手工验证用例。

### 1.2 数据流与前后端交互

1. 用户在前端输入场景描述。
2. `useConversation.sendMessage()` 将用户消息追加到本地消息数组。
3. 前端调用 `/api/generate`，请求体包含最近对话历史与可选 `templateId`。
4. 后端组装 system prompt 与历史消息，调用 LLM。
5. 后端从 LLM 返回中提取 Mermaid 代码，执行括号与图表类型的基础校验，必要时进行最多 2 次修复提示重试。
6. 后端注入主题头并返回 `content`、`mermaidCode`、`diagramType`。
7. 前端追加助手消息，`PreviewPanel` 通过 Mermaid.js 渲染 SVG，`CodePanel` 提供复制。

## 2. 代码质量与架构层面的主要问题

1. UI 设计过于工程化，深色硬编码较多，缺少统一设计 token、亮暗主题切换、响应式信息层级与品牌表达。
2. API 生成逻辑集中在 `routes/generate.ts`，路由层同时承担请求校验、LLM 调用、语法校验、主题注入、类型识别，职责过重。
3. 前后端类型重复：`client/src/types/index.ts` 与 `shared/types.ts` 各自定义请求/响应类型，存在漂移风险。
4. `useMermaidRender` 使用固定 DOM id，多次渲染或 React Strict Mode 下可能出现 Mermaid 重复 ID/缓存问题。
5. 复制失败没有降级处理，移动端和非安全上下文下可能失败。
6. 后端 CORS 全开放，缺少基本输入长度限制、错误码枚举与更清晰的边界校验。
7. 没有飞书 WebSocket 事件订阅能力，与 PRD Phase 3 的“群聊 @机器人 即出图”存在明显差距。
8. 缺少可供未来多人协作扩展的领域模型，例如 `boardId`、版本、生成 artifact、事件分发等抽象。
9. 根项目没有 `lint` 脚本，无法满足持续质量检查要求。
10. `build.mjs` 会把 API key 注入 bundle，便携构建场景存在密钥固化风险，需要后续改为运行时配置或本地受控分发。

## 3. 与 PRD / 技术方案理想状态的差距

- 已实现：Web UI、自然语言到 Mermaid、模板系统、实时预览、一键复制、基础对话式迭代、Prompt/术语词典/Few-shot。
- 部分实现：语法校验目前主要是正则和括号校验，浏览器端渲染失败不会自动调用后端修复。
- 未实现：飞书机器人 WebSocket 长连接、飞书消息回复、图片/卡片结果发送、历史记录管理、团队模板共享、多用户协作、真正的共享类型包、完整 lint/test 流程。
- UI 差距：技术方案中要求 Web UI 后续打磨（响应式、暗色模式、快捷操作），当前界面只满足基础可用，视觉层级、品牌感和移动端体验不足。

## 4. 竞品 Benchmark 简记

### 4.1 Miro

- 优点：无限画布心智成熟，模板库丰富，协作光标与评论体系完善，适合复杂团队工作坊。
- 缺点：大型白板成本高、专业图表生成依赖较多插件，汽车领域语义不强。
- 可借鉴：空状态模板引导、画布/侧边栏分区、协作状态、模板分类、分享入口常驻。

### 4.2 FigJam

- 优点：视觉风格轻量友好，贴纸/便签/投票等协作交互低门槛，组件质感强。
- 缺点：复杂工程图表达能力不如专业建模工具，AI 与行业术语深度有限。
- 可借鉴：亲和但专业的品牌语气、轻量卡片、清晰工具栏、状态反馈动效、空白页示例提示。

### 4.3 tldraw

- 优点：启动极快，画布交互直接，SDK 友好，可嵌入自定义协作场景。
- 缺点：默认图形能力偏通用，需要额外领域模板与语义层。
- 可借鉴：低摩擦入口、快捷键提示、可嵌入 SDK 思路、本地优先、简洁工具栏。

### 4.4 Excalidraw

- 优点：手绘风格降低正式感，导入导出便利，分享和协作简单。
- 缺点：工程审美与汇报级视觉不一定匹配，复杂 Mermaid/PlantUML 语义仍需额外生成。
- 可借鉴：一键复制/导出、低压感空状态、结果即资产、分享链接、工具操作即时反馈。

### 4.5 CARLA / ScenarioRunner / OpenSCENARIO 生态

- 优点：自动驾驶场景标准化程度高，强调道路、参与者、触发条件、动作序列与可复现测试。
- 缺点：学习曲线高，偏仿真测试工程，不适合 PM/FO 快速画沟通图。
- 可借鉴：场景元素结构化、触发条件/ODD 显式表达、版本化场景资产、测试用例思维、参数化模板。

### 4.6 AI 图表/流程图生成工具

- 优点：自然语言输入、快速得到流程图、可迭代修改。
- 缺点：多数产品缺少智驾领域术语、飞书生态闭环与 Mermaid 兼容优化。
- 可借鉴：Prompt 示例库、生成后编辑、错误自动修复、卡片式结果、对话式精修。

## 5. 可借鉴到 Wombat-Blackboard 的具体设计/交互思路

1. 顶部建立清晰品牌栏与运行状态，像 SaaS 工具一样让用户随时知道模型、模板、飞书连接状态。
2. 左侧保留对话式生成，右侧强化“画布预览”，底部代码区改为可收纳/可复制的资产面板。
3. 空状态提供智驾场景示例 chip，降低用户第一次输入成本。
4. 生成结果以“可复制代码 + 飞书卡片/链接 + 实时预览”三种资产形态呈现。
5. 用统一设计 token 管理色彩、阴影、圆角、间距，支持系统亮暗模式。
6. 借鉴 ScenarioRunner/OpenSCENARIO，将 ODD、触发条件、参与者、动作序列作为模板和后续协作扩展的核心领域模型。
7. 为多人协作预留 `boardId`、`artifactId`、`version`、`source` 等字段，未来可接入实时协作。
8. 飞书机器人回复使用交互式卡片：展示图表类型、摘要、代码片段、预览链接与复制指引。

## 6. 后续优化迭代计划

1. 重构后端生成服务：抽取 `diagram-service`，让 Web API 与飞书机器人复用同一生成通路。
2. 增加飞书模块：配置、tenant token 缓存、消息发送、WebSocket 长连接启动、事件解析、幂等与重试。
3. 重做 UI：Tailwind design token、亮暗主题、响应式布局、现代 SaaS 风格、模板卡片、状态栏与更好的错误/复制反馈。
4. 统一类型：扩展请求/响应、飞书状态、生成 artifact 类型，为多用户协作预留字段。
5. 增加质量脚本：补齐 `lint`，确保 `npm run lint` 与 `npm run build` 可执行。
6. 更新文档：在 `PROGRESS.md` 记录阶段进度、飞书配置与测试方法，最终追加交付报告。

## 7. UI 改造清单

- 已统一 Tailwind token：新增 `brand` 与 `wombat` 色板、`shadow-panel`、`shadow-glow`、`rounded-panel` 与字体层级。
- 已默认跟随系统亮暗模式：Tailwind `darkMode: 'media'`，页面背景、卡片、输入框、按钮和错误态均适配暗色。
- Header 已增加品牌标识、产品定位、飞书 WS Ready 状态、系统主题说明与模板入口。
- 对话区已升级为 SaaS 卡片式面板，空状态提供 3 个智驾示例 prompt，降低首次使用门槛。
- 预览区已改造成独立画布卡片，支持新窗口预览、加载态、空状态和错误态。
- 代码区已升级为资产面板，保留行号、图表类型标签、一键复制和飞书 `/mermaid` 使用提示。
- 移动端已改成上下布局：对话区、预览区、代码区按纵向堆叠，输入区固定在对话卡片底部。

## 8. UI 前后对比（文字截图描述）

- 改造前：深灰背景、蓝色按钮、三栏功能可用但视觉粗糙，缺少统一品牌感和亮色模式。
- 改造后：页面呈现 2025 SaaS 工具风格，浅色模式下为蓝白玻璃卡片与柔和渐变背景，暗色模式下为深蓝黑背景与低对比玻璃面板；顶部品牌区清晰展示 Wombat Blackboard、AI Diagram SaaS、飞书 WS Ready；左侧对话区有示例 prompt 卡片，右侧为白板式预览画布，下方为代码资产面板。整体间距更舒适，信息层级更明确，移动端可纵向浏览和生成。
