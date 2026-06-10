# Wombat-Blackboard 产品需求文档 (PRD)

> 版本: v1.1 | 日期: 2026-06-08 | 状态: 立项 | 输出格式: Mermaid

---

## 1. 项目定位

### 1.1 一句话描述

**Wombat-Blackboard** 是一款将自然语言场景描述自动转换为 Mermaid 代码的 AI 工具，面向汽车智能驾驶领域的产品经理、Feature Owner、系统工程师与架构师，代码粘贴到飞书画板即可自动渲染出图。

### 1.2 要解决的问题

| 痛点 | 现状 | 目标 |
|---|---|---|
| 画图耗时过长 | 用 Visio/Draw.io 拖拽画一张系统架构图需要 30-60 分钟 | 1-3 分钟完成 |
| 文字评审缺乏可视化 | PRD/FS 中满是纯文本逻辑描述，评审时各人脑补不一致 | 自动生成一致的示意图 |
| 飞书画板缺乏代码绘图能力 | 飞书支持 Mermaid 块但用户不会写代码 | 一键粘贴，自动渲染 |
| 领域术语多样 | 智驾系统涉及传感器、感知、规控、定位、HMI 等多领域 | AI 理解领域术语并生成专业图表 |
| 版本迭代后图过期 | 手动画的图跟不上设计变更 | 改文字描述即可重新生成 |

### 1.3 产品愿景

成为汽车智能驾驶领域的"示意图即时生成器" —— 工程师讨论中随口描述一个场景，立刻拿到可粘贴到飞书的 Mermaid 代码，无需离开聊天窗口或文档页面。

### 1.4 为什么专注 Mermaid

- 中文原生支持，飞书中零配置渲染
- 语法简洁（比 PlantUML 短 30-50%），LLM 生成正确率明显更高
- GitHub 73k+ stars，LLM 训练语料丰富
- 覆盖智驾领域全部高频图表类型（流程图、时序图、状态图、类图、ER 图、甘特图）
- 架构图可用 Flowchart subgraph 表达，效果足够

---

## 2. 目标用户

### 2.1 核心用户画像

| 用户角色 | 典型场景 | 高频图表类型 |
|---|---|---|
| **产品经理 (PM)** | 写 PRD/FS，定义功能逻辑、ODD 边界、交互流程 | Flowchart、State、Sequence |
| **Feature Owner (FO)** | 拆解功能需求，定义模块交互 | Sequence、Flowchart、Class |
| **系统工程师** | 设计系统架构、模块接口、数据流 | Flowchart (架构)、ER |
| **架构师** | 定义跨域方案、技术选型、分层设计 | Flowchart (架构)、Class、ER |

### 2.2 用户特征

- 有丰富的领域知识，但不熟悉 Mermaid 语法
- 日常工作在飞书生态中（文档、多维表格、群聊）
- 对画图效率敏感，但最终图的美观度也影响汇报效果
- 场景描述习惯使用领域缩写和英文术语（如 ODD、DMS、ADAS、SOA、CAN、ETH、RTK、GNSS/IMU 等）

---

## 3. Mermaid 支持的图表类型

以下为飞书画板支持的 Mermaid 图表类型及示例代码。

### 3.1 Flowchart 流程图

最常用的图表类型，适用于功能逻辑、决策分支、ODD 判断流程、系统架构拓扑。

```
flowchart TD
    A(入学) --> B(基础课程学习)
    B --> C{课程考核}
    C -->|通过| D(专业课程学习)
    C -->|不通过| E(重修基础课程)
    D --> F(实践项目)
    F --> G(毕业)
```

支持的节点形状：矩形 `[]`、圆角 `()`、菱形 `{}`、圆形 `(())` 等，方向可选 TD/LR/RL/BT。

### 3.2 Sequence Diagram 时序图

适用于模块交互、ECU 通信、协议握手、功能调用链。

```
sequenceDiagram
    participant Alice
    participant Bob
    Bob->>Alice: Hi Alice
    Alice->>Bob: Hi Bob
```

支持参与者生命线、激活框、注释、循环 `loop`、条件 `alt/else`、并行 `par` 等。

### 3.3 Mindmap 思维导图

适用于功能拆解、问题树、头脑风暴整理。

```
mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology <br/>author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid
```

支持图标（Font Awesome）、多级嵌套、HTML 换行。

### 3.4 Pie Chart 饼图

适用于比例分布展示，如测试覆盖、资源分配、问题分类。

```
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
```

### 3.5 Timeline 时间线

适用于项目里程碑、功能迭代路径、技术演进历史。

```
timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter
```

### 3.6 Class Diagram 类图

适用于数据模型、接口定义、信号结构。

```
classDiagram
    class Animal {
      +String name
      +void eat()
    }
    class Dog {
      +Int age
      +void bark()
    }
    Animal <|-- Dog
```

支持继承、组合、聚合、依赖等关系，以及泛型、抽象类/方法。

### 3.7 ER Diagram 实体关系图

适用于信号矩阵、数据字典、数据库设计。

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string custNumber
        string sector
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
```

### 3.8 State Diagram 状态图

适用于功能状态机、驾驶模式切换、HMI 状态流转。

```
stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

支持复合状态、并发状态、历史状态、条件转移标注。

### 3.9 Gantt Chart 甘特图

适用于项目计划、里程碑排期。

```
---
displayMode: compact
---
gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD

    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :a2, 2014-01-20, 25d
    Another one      :a3, 2014-02-10, 20d
```

### 3.10 图表类型与智驾场景映射

| 图表类型 | 智驾典型应用 |
|---|---|
| Flowchart | 功能逻辑、ODD 决策树、系统架构拓扑、信号流 |
| Sequence | 模块交互（感知→规控→执行）、ECU 通信时序、协议握手 |
| State | 功能状态机（OFF→Standby→Active→Override→Failure）、HMI 状态 |
| Class | 数据模型、接口定义、信号结构体 |
| ER | 信号矩阵、CAN 信号映射、数据字典 |
| Mindmap | 功能拆解、问题分析树、ODD 条件梳理 |
| Gantt | 迭代计划、功能 roadmap |
| Pie | 测试覆盖、资源分布、问题分类 |
| Timeline | 里程碑时间线、技术演进历史 |

---

## 4. 功能需求

### 4.1 核心功能：NL → Mermaid Code (P0)

**输入**：用户用自然语言（中文为主，中英混合）描述一个场景或结构。
**输出**：一段可直接粘贴到飞书画板的 Mermaid 代码。

**典型输入示例 1（系统架构 → Flowchart）**：
> "智驾域控有三个主要芯片：Orin 做感知和规控，TDA4 做数据接入和显示，MCU 做车辆控制和功能安全。Orin 通过 GMSL 接 11 个摄像头，TDA4 通过 ETH 接 5 个雷达，MCU 通过 CAN 接底盘。"

**典型输入示例 2（模块交互 → Sequence）**：
> "驾驶员拨转向灯杆变道，智驾系统先检查 ADAS 功能是否激活，然后判断邻车道是否安全，再规划变道路径，最后控制 EPS 和 VCU 执行变道。"

**典型输入示例 3（功能状态 → State）**：
> "智驾功能的状态流转：OFF → Standby → Active → Override → Failure。Standby 下可以进入 NOD 和 HWP 子状态。Failure 之后需要停车后重新上电才能恢复。"

### 4.2 领域模板库 (P0)

内置汽车智驾领域常用图表模板，用户可基于模板快速生成。

| 模板分类 | 模板示例 |
|---|---|
| 传感器架构 | 前视/环视/雷达/激光雷达/超声波传感器拓扑 |
| 域控架构 | 智驾域控/座舱域控/车身域控 分层图 |
| 功能状态机 | HWP/NOD/TJP/HWA 等功能的 HMI 状态流转 |
| ODD 决策树 | 功能可用性判断流程（天气、光照、车道线、速度…） |
| 通信拓扑 | CAN/ETH/LIN 总线网络拓扑 |
| 安全机制 | 功能安全监控/降级/冗余切换流程 |
| 数据流 | 采集 → 标注 → 训练 → 仿真 → 部署 Pipeline |

### 4.3 交互式迭代 (P1)

- 用户对生成的图不满意，可以发送自然语言修改指令（如"把 Orin 和 TDA4 换成左右布局""把状态 Override 的触发条件写上去"）
- 系统基于上下文增量修改代码，不重新生成
- 支持版本的撤销/重做

### 4.4 多语言输入支持 (P2)

- 主力支持：中文、中英混合（领域术语保留英文）
- 后续支持：纯英文输入

### 4.5 一键复制与格式校验 (P0)

- 生成代码后提供一键复制按钮
- 复制前自动校验 Mermaid 语法合法性（基于 mermaid-cli 或 @mermaid-js/mermaid 解析器）
- 若语法有误，自动尝试修复后重新输出（最多重试 2 次）

### 4.6 图表预览 (P1)

- 在工具内提供实时渲染预览
- 用户确认后再复制代码

### 4.7 飞书快捷粘贴指引 (P2)

- 内置飞书画板使用指引：如何插入 Mermaid 块
- 支持直接调用飞书开放平台 API 将代码写入飞书文档（远期）

---

## 5. 技术方案概要

### 5.1 核心架构

```
用户输入 (NL)
    │
    ▼
┌─────────────────────────┐
│  领域术语识别 & 消歧      │  基于规则 + 上下文
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  场景理解 & 结构化         │  LLM (DeepSeek / Claude API)
│  - 识别图表类型           │
│  - 提取实体 & 关系        │
│  - 推断布局方向           │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  Mermaid 代码生成         │  LLM + 模板约束 + 类型语法约束
│  - 选择合适的图表类型     │
│  - 生成对应语法           │
└─────────┬───────────────┘
          ▼
┌─────────────────────────┐
│  语法校验 & 自动修复       │  mermaid-cli / @mermaid-js/mermaid
│  - 最多重试 2 次          │
└─────────┬───────────────┘
          ▼
       输出 Mermaid 代码
```

### 5.2 技术选型

| 组件 | 方案 | 原因 |
|---|---|---|
| AI 模型 | Claude API / DeepSeek API | 强大的 NL 理解和代码生成能力 |
| Mermaid 校验 | `@mermaid-js/mermaid` 或 `mermaid-cli` | 官方解析器，保证语法正确 |
| 前端框架 | React + TypeScript (后续) | 交互式体验 |
| 部署 | Vercel / Cloudflare Pages (后续) | 快速部署，免费额度 |

---

## 6. 用户流程

### 6.1 主流程

```
1. 用户打开 Wombat-Blackboard
2. 在输入框中用自然语言描述场景
3. 点击"生成"
4. 系统返回：
   a. Mermaid 代码块（可编辑、可一键复制）
   b. 图表类型标签（如"时序图"）
   c. 预览渲染结果（P1）
5. 用户点击"复制代码"
6. 用户打开飞书文档 → 输入 "/mermaid" → 粘贴 → 自动渲染
7. 如不满意，用户在输入框中发送修改指令，返回步骤 3
```

### 6.2 飞书画板粘贴路径

```
飞书文档
  → 输入 "/mermaid"
  → 粘贴代码块
  → 自动渲染

飞书表格
  → 插入 → 绘图 → Mermaid
  → 粘贴代码

飞书多维表格
  → 支持的 Mermaid 字段
```

---

## 7. 领域特定设计

### 7.1 智驾领域术语词典（内置）

系统需要理解以下高频术语并正确映射：

| 类别 | 术语示例 |
|---|---|
| 传感器 | Camera, Radar, Lidar, USS, GNSS, IMU, 前视/环视/周视 |
| 控制器 | 智驾域控, 座舱域控, 底盘域, 车身域, MCU, SoC, Orin, TDA4, J6 |
| 功能 | HWP, NOD, TJP, HWA, AEB, ACC, LKA, DMS, OMS, APA, AVM |
| 通信 | CAN, ETH, LIN, GMSL, FPD-Link, SOME/IP, DDS, SOC |
| 安全 | ASIL, FTTI, 冗余, 降级, Fail-Safe, Fail-Operational, SOTIF |
| ODD | 高速公路, 城市道路, 晴天/雨天/雪天, 车道线清晰, 速度范围 |

### 7.2 领域特定图表语义

智驾场景中的"关系"应正确映射到 Mermaid 语法：

| 自然语言描述 | Mermaid 语义 |
|---|---|
| "A 通过 XX 接口连到 B" | `A -->|XX| B`（边标注协议/总线类型） |
| "A 包含 B、C、D" | A 为父节点，用 subgraph 包裹 B/C/D |
| "A 检查条件 B 然后做 C" | `A --> B{条件} -->|通过| C` |
| "系统从状态 A 切换到 B 需要条件 C" | `A --> B : C` |
| "A 层在 B 层之上" | 分层 subgraph 上下布局 |

---

## 8. 非功能需求

| 需求 | 指标 |
|---|---|
| 生成速度 | ≤ 5 秒（首版可接受 ≤ 15 秒） |
| 语法正确率 | ≥ 95%（经过自动修复后） |
| 一次生成可用率 | ≥ 80%（用户无需修改或仅需微调） |
| 领域术语识别准确率 | ≥ 90% |
| 中文混合输入支持 | 完整支持 |

---

## 9. 项目里程碑

### Phase 1: MVP（2-3 周）

- [ ] Prompt 工程：NL → Mermaid 核心通路（Flowchart、Sequence、State、Class、ER）
- [ ] 领域术语词典（内置到 prompt）
- [ ] 交互式上下文修改（用户可持续微调，系统基于上下文增量修改）
- [ ] 语法自动校验 + 自动修复（最多重试 2 次）
- [ ] Mermaid 实时渲染预览
- [ ] Web UI（输入框 + 代码输出 + 预览 + 复制按钮）
- [ ] 5 个智驾领域模板（NL 描述 + LLM 重新生成）

### Phase 2: 增强（4-6 周）

- [ ] 模板库扩展至 20+
- [ ] 扩展图表类型：Mindmap、Gantt、Pie、Timeline
- [ ] 格式自定义（配色、字体、排版风格，取决于飞书 `%%{init}%%` 兼容性测试结果）
- [ ] Web UI 体验打磨（响应式、暗色模式、快捷操作）

### Phase 3: 生态（7-12 周）

- [ ] 飞书机器人集成（群聊中 @机器人 即出图）
- [ ] 飞书开放平台 API 对接（直接写入文档）
- [ ] 历史记录管理
- [ ] 团队共享模板
- [ ] 更多输出格式探索（Draw.io XML? Excalidraw?）

---

## 10. 成功指标

| 指标 | 目标值 | 衡量方式 |
|---|---|---|
| 生成至复制耗时 | ≤ 3 分钟/图 | 使用统计 |
| 飞书粘贴成功率 | ≥ 98% | 用户反馈 |
| 周活跃用户 | ≥ 10 (Pilot) | 埋点统计 |
| 单图生成次数 | ≤ 2 次（即大部分一次满意） | 版本对比 |
| 模板使用率 | ≥ 30% 的生成基于模板 | 日志统计 |

---

## 11. 已决策事项

| # | 事项 | 决策 | 理由 |
|---|---|---|---|
| 1 | 交互形式 | **Web UI 一步到位** | 用户直接使用，无需安装，Phase 1 即交付 |
| 2 | 飞书 Mermaid 兼容性 | **先发测试代码验证** | 测试文件已生成，用户实测后反馈支持范围 |
| 3 | 用户反馈闭环 | **支持持续微调，暂不加自动学习** | 交互式上下文修改即可；自动学习逻辑后置 |
| 4 | 隐私与部署 | **纯云端 API** | 无本地部署需求，Claude/DeepSeek API 直调 |
| 5 | 输出格式 | **仅 Mermaid** | 专注一个格式做到极致 |
| 6 | 模板实现 | **NL 描述 + LLM 重新生成** | 非预写代码填空，灵活性更高 |
| 7 | 图表类型 | **Phase 1 全做** | Flowchart + Sequence + State + Class + ER 一起上 |

### 飞书 Mermaid 兼容性验证结果 ✅

23/23 项全部通过，飞书完全支持：
- Flowchart（全部节点形状、连线类型、subgraph 嵌套、中文长文本换行）
- Sequence（participant、loop/alt/par、activate/deactivate、autonumber、Note）
- State（复合状态、子状态、<<choice>>/<<fork>>/<<join>>、历史状态 [H]）
- Class（继承、组合、聚合、依赖、<<interface>>/<<abstract>>）
- ER（实体关系、属性类型、中文实体名）
- Pie、Mindmap、Timeline、Gantt
- `%%{init}%%` 指令（主题切换、自定义颜色、自定义字体大小）

结论：可以放心使用 Mermaid 全部语法特性。
