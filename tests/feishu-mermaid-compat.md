# 飞书 Mermaid 兼容性测试用例

> 使用方法：逐个代码块复制到飞书文档，输入 `/mermaid` 后粘贴，观察渲染结果。
> 每个测试用例标注了 \*\*必须通过\*\* / \*\*重要\*\* / \*\*锦上添花\*\* 三个优先级。

\---

## 1\. Flowchart 基础节点形状【必须通过】

```mermaid
flowchart LR
    A\[矩形节点]
    B(圆角节点)
    C{菱形判断}
    D(\[体育场形])
    E\[\[子程序形]]
    F\[(圆柱形)]
    G((圆形))
    H>不对称形]
    I{{六边形}}
```

## 2\. Flowchart 连接线与标签【必须通过】

```mermaid
flowchart TD
    A\[感知模块] --> B\[规划模块]
    B --> C\[控制模块]
    A -.->|备选路径| D\[直接控制]
    B ==>|高优先级| E\[安全模块]
    C ---|无箭头| F\[日志]
```

## 3\. Flowchart 子图 (subgraph)【必须通过】

```mermaid
flowchart TB
    subgraph 智驾域控 \["智驾域控"]
        A\[Orin-X] 
        B\[TDA4]
    end
    subgraph 底盘域 \["底盘域"]
        C\[MCU]
        D\[EPS]
    end
    A -->|ETH| C
    B -->|CAN| D
```

## 4\. Flowchart 子图嵌套 + 方向【重要】

```mermaid
flowchart LR
    subgraph outer \["整车架构"]
        direction TB
        subgraph 感知层 \["感知层"]
            A\[摄像头] --> B\[雷达]
        end
        subgraph 计算层 \["计算层"]
            C\[域控]
        end
    end
    感知层 --> 计算层
```

## 5\. Flowchart 中文节点 + 长文本 + 换行【必须通过】

```mermaid
flowchart TD
    A\[驾驶员触发变道请求] --> B{ODD 条件检查<br/>1. 车道线清晰<br/>2. 车速 60-130km/h<br/>3. 非隧道}
    B -->|满足| C\[规划变道路径]
    B -->|不满足| D\[提示驾驶员<br/>功能不可用]
    C --> E\[EPS 执行转向]
```

## 6\. Sequence 基础语法 + 中文【必须通过】

```mermaid
sequenceDiagram
    participant 驾驶员
    participant 智驾域控
    participant EPS
    驾驶员->>智驾域控: 拨动转向灯杆
    智驾域控->>EPS: 请求转向扭矩
    EPS-->>智驾域控: 反馈实际转角
    智驾域控-->>驾驶员: HMI 显示变道进度
```

## 7\. Sequence 高级语法 (loop/alt/par)【必须通过】

```mermaid
sequenceDiagram
    participant A as 感知模块
    participant B as 规控模块
    
    loop 每 10ms
        A->>B: 目标列表
    end
    
    alt 目标在车道内
        B->>B: 规划跟车
    else 目标切入
        B->>B: 紧急减速
    else 无目标
        B->>B: 定速巡航
    end
    
    par 横向控制
        B->>B: 计算转向角
    and 纵向控制
        B->>B: 计算加速度
    end
```

## 8\. Sequence 激活框 + 注释【重要】

```mermaid
sequenceDiagram
    autonumber
    participant S as 传感器
    participant P as 感知
    participant F as 融合
    
    S->>+P: 原始数据
    Note right of P: 目标检测<br/>+ 跟踪
    P-->>-S: ACK
    P->>+F: 目标列表
    Note over F: 传感器融合
    F-->>-P: 融合结果
```

## 9\. State 基础状态图【必须通过】

```mermaid
stateDiagram-v2
    \[\*] --> OFF
    OFF --> Standby : 上电自检通过
    Standby --> Active : 驾驶员激活
    Active --> Override : 驾驶员超控
    Override --> Active : 超控结束
    Active --> Failure : 系统故障
    Failure --> OFF : 重新上电
```

## 10\. State 复合状态 + 子状态【必须通过】

```mermaid
stateDiagram-v2
    \[\*] --> OFF
    OFF --> Active
    
    state Active {
        \[\*] --> 定速巡航
        定速巡航 --> 跟车 : 前方有车
        跟车 --> 定速巡航 : 前方无车
        --
        变道中 --> 变道完成
    }
    
    Active --> Failure : 故障
    Failure --> \[\*]
```

## 11\. State 条件选择 + 分叉汇合【重要】

```mermaid
stateDiagram-v2
    state 状态检查 <<choice>>
    state 并行处理 <<fork>>
    state 汇合 <<join>>
    
    \[\*] --> 状态检查
    状态检查 --> 并行处理 : OK
    状态检查 --> \[\*] : FAIL
    
    并行处理 --> 横向控制
    并行处理 --> 纵向控制
    横向控制 --> 汇合
    纵向控制 --> 汇合
    汇合 --> \[\*]
```

## 12\. State 历史状态【锦上添花】

```mermaid
stateDiagram-v2
    \[\*] --> 运行中
    
    state 运行中 {
        \[\*] --> 主功能
        主功能 --> 子功能
        --
        \[H] --> 主功能
    }
    
    运行中 --> 暂停
    暂停 --> 运行中\[H] : 恢复
```

## 13\. Class 类图基础【必须通过】

```mermaid
classDiagram
    class 传感器 {
        +String 类型
        +String 安装位置
        +void 标定()
        +DataFrame 采集()
    }
    class 摄像头 {
        +Int 分辨率
        +Float 焦距
        +void 曝光控制()
    }
    传感器 <|-- 摄像头
```

## 14\. Class 关系类型【重要】

```mermaid
classDiagram
    class 域控 {
        +String 型号
    }
    class 芯片 {
        +String 型号
        +Int 算力
    }
    class 传感器 {
        +String 类型
    }
    class 执行器 {
        +String 类型
    }
    
    域控 \*-- 芯片 : 组成
    域控 o-- 传感器 : 聚合
    域控 --> 执行器 : 控制
    芯片 ..> 传感器 : 依赖
```

## 15\. Class 抽象类 + 接口【锦上添花】

```mermaid
classDiagram
    class I感知接口 {
        <<interface>>
        +Detect()
        +Track()
    }
    class 基础感知 {
        <<abstract>>
        +Float 置信度阈值
        +Filter()
    }
    I感知接口 <|.. 基础感知
```

## 16\. ER 实体关系图【重要】

```mermaid
erDiagram
    车辆 ||--o{ 传感器 : 搭载
    传感器 ||--|| 安装位置 : 有
    传感器 ||--o{ 感知目标 : 输出
    
    车辆 {
        string VIN
        string 车型
        int 年款
    }
    传感器 {
        string 序列号
        string 类型
        string 供应商
    }
    感知目标 {
        int ID
        float 距离
        float 速度
    }
```

## 17\. Pie 饼图【锦上添花】

```mermaid
pie title 智驾系统问题分类
    "感知漏检" : 35
    "定位跳变" : 20
    "规划不合理" : 25
    "控制超调" : 15
    "其他" : 5
```

## 18\. Mindmap 思维导图【锦上添花】

```mermaid
mindmap
  root((HWP 功能拆解))
    感知
      车道线检测
      目标识别
      自由空间
    规划
      横向规划
      纵向规划
      变道决策
    控制
      转向控制
      速度控制
    安全
      功能降级
      紧急制动
```

## 19\. Timeline 时间线【锦上添花】

```mermaid
timeline
    title 智驾功能迭代路线
    2024 Q1 : L2 基础功能
             : ACC + LKA
    2024 Q3 : 高速 NOA
            : 自动变道
    2025 Q1 : 城区 NOA
            : 无图方案
    2025 Q3 : 端到端
            : 大模型上车
```

## 20\. Gantt 甘特图【锦上添花】

```mermaid
---
displayMode: compact
---
gantt
    title 智驾项目开发计划
    dateFormat  YYYY-MM-DD

    section 感知
    摄像头标定     :a1, 2025-01-01, 30d
    融合算法开发   :a2, 2025-01-15, 45d

    section 规控
    路径规划       :b1, 2025-02-01, 60d
    控制调优       :b2, 2025-03-15, 30d

    section 测试
    实车路测       :c1, 2025-04-01, 45d
```

## 21\. `%%{init}%%` 主题设置【重要】

```mermaid
%%{init: {'theme': 'forest'}}%%
flowchart TD
    A\[感知] --> B\[规划]
    B --> C\[控制]
    C --> D\[执行]
```

## 22\. `%%{init}%%` 自定义颜色【重要】

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ff6b35', 'primaryTextColor': '#fff', 'lineColor': '#004e98' }}}%%
flowchart LR
    A\[传感器数据] --> B\[感知处理]
    B --> C\[融合输出]
```

## 23\. `%%{init}%%` 自定义字体大小【锦上添花】

```mermaid
%%{init: {'theme': 'default', 'fontSize': '20px'}}%%
flowchart LR
    A\[大字标题] --> B\[正文内容]
```

\---

## 测试结果记录

|#|测试项|结果 (通过/部分/失败)|备注|
|-|-|-|-|
|1|Flowchart 基础节点形状|通过||
|2|Flowchart 连接线与标签|通过||
|3|Flowchart subgraph|通过||
|4|Flowchart subgraph 嵌套+方向|通过||
|5|Flowchart 中文+长文本+换行|通过||
|6|Sequence 基础+中文|通过||
|7|Sequence loop/alt/par|通过||
|8|Sequence 激活框+autonumber|通过||
|9|State 基础状态图|通过||
|10|State 复合状态+子状态|通过||
|11|State 条件选择+分叉汇合|通过||
|12|State 历史状态|通过||
|13|Class 类图基础|通过||
|14|Class 关系类型|通过||
|15|Class 抽象类+接口|通过||
|16|ER 实体关系图|通过||
|17|Pie 饼图|通过||
|18|Mindmap 思维导图|通过||
|19|Timeline 时间线|通过||
|20|Gantt 甘特图|通过||
|21|%%{init}%% 主题|通过||
|22|%%{init}%% 自定义颜色|通过||
|23|%%{init}%% 自定义字体|通过||



