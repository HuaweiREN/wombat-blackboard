# 时序图 Few-Shot 示例 Sequence Diagram Examples

## 示例 1：AEB紧急制动完整交互流程

**用户输入：** 画AEB紧急制动时各模块的交互时序。前视摄像头检测到前方障碍物，将目标数据发送给感知融合模块。感知融合对目标进行跟踪和分类，然后发送给AEB决策模块。AEB决策模块计算TTC，发现小于1.6秒，于是发送制动请求给制动控制器ESC。ESC执行制动并将制动状态反馈给AEB决策模块。同时AEB决策模块发送报警请求给HMI模块，HMI发出声音和视觉报警。整个过程需要在40ms内完成。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
sequenceDiagram
    autonumber
    participant CAM as "前视摄像头"
    participant FUS as "感知融合"
    participant AEB as "AEB决策"
    participant ESC as "制动控制器ESC"
    participant HMI as "人机交互HMI"

    rect rgb(240, 248, 255)
        Note over CAM,HMI: 感知阶段 (0-20ms)
        CAM->>FUS: 目标检测结果<br/>(类型/距离/速度/角度)
        activate FUS
        FUS->>FUS: 目标跟踪与滤波
        FUS->>FUS: 目标分类验证
        FUS->>AEB: 融合目标列表<br/>(含碰撞风险标识)
        deactivate FUS
    end

    rect rgb(255, 248, 220)
        Note over AEB,AEB: 决策阶段 (20-30ms)
        activate AEB
        AEB->>AEB: TTC计算<br/>距离/相对速度
        AEB->>AEB: 碰撞风险等级判定
        Note over AEB: TTC = 1.2s <br/>触发紧急制动
    end

    rect rgb(255, 235, 235)
        Note over AEB,ESC: 执行阶段 (30-40ms)
        AEB->>ESC: 制动请求<br/>(目标减速度-8m/s2)
        activate ESC
        ESC->>ESC: 建压控制
        ESC-->>AEB: 制动状态反馈<br/>(实际减速度/压力)
        deactivate ESC
    end

    rect rgb(240, 240, 255)
        Note over AEB,HMI: 报警阶段 (并行)
        AEB->>HMI: FCW报警请求<br/>(声音+视觉)
        activate HMI
        HMI->>HMI: 蜂鸣器输出
        deactivate AEB
        HMI->>HMI: 仪表报警图标点亮
        deactivate HMI
    end
```

---

## 示例 2：HWP高速领航变道超车场景

**用户输入：** 画HWP功能下车辆自动变道超车的交互时序。首先感知模块检测到前方慢车，请求规划模块变道。规划模块确认目标车道安全条件，向融合模块请求目标车道状态。融合模块查询侧后方毫米波雷达和环视摄像头确认目标车道无来车。融合模块将目标车道状态返回给规划模块。规划模块生成变道轨迹，发给横向控制EPS和纵向控制ESC。EPS执行转向变道，ESC调整车速。完成后反馈给规划模块，规划模块再通知HMI显示变道完成。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
sequenceDiagram
    autonumber
    participant PER as "感知模块"
    participant PLAN as "规划模块"
    participant FUS as "融合模块"
    participant RAD_S as "侧后方雷达"
    participant CAM_S as "环视摄像头"
    participant EPS as "转向EPS"
    participant ESC as "制动ESC"
    participant HMI as "人机交互HMI"

    Note over PER,HMI: 变道请求阶段
    PER->>PLAN: 前车速度较低<br/>(当前速度60km/h, 目标80km/h)
    activate PLAN
    PLAN->>PLAN: 变道意图生成<br/>选择左侧目标车道

    Note over PLAN,FUS: 安全检查阶段
    PLAN->>FUS: 目标车道状态查询
    activate FUS
    FUS->>RAD_S: 左后方目标扫描
    activate RAD_S
    RAD_S-->>FUS: 无接近目标
    deactivate RAD_S
    FUS->>CAM_S: 左侧盲区图像检测
    activate CAM_S
    CAM_S-->>FUS: 盲区无车辆
    deactivate CAM_S
    FUS->>FUS: 目标车道安全确认
    FUS-->>PLAN: 目标车道安全<br/>可执行变道
    deactivate FUS

    Note over PLAN,ESC: 轨迹规划与执行阶段
    PLAN->>PLAN: 变道轨迹生成<br/>(时长4s, 最大横向加速度0.3g)
    PLAN->>PLAN: 速度曲线规划<br/>(60→80km/h加速)
    PLAN->>EPS: 目标转向角序列
    activate EPS
    PLAN->>ESC: 目标加速度请求
    activate ESC
    Note over EPS,ESC: 变道执行中
    EPS-->>PLAN: 转向执行反馈
    deactivate EPS
    ESC-->>PLAN: 速度执行反馈
    deactivate ESC
    PLAN->>PLAN: 轨迹跟踪监控
    PLAN->>HMI: 变道中状态显示
    activate HMI

    Note over PLAN,HMI: 完成阶段
    PLAN->>PLAN: 变道完成确认
    PLAN-->>PER: 更新自车车道信息
    PLAN->>HMI: 变道完成提示
    deactivate PLAN
    deactivate HMI
```

---

## 示例 3：系统上电与自检时序

**用户输入：** 画智能驾驶系统上电启动的时序。用户上电后，VCU唤醒智驾域控。智驾域控自检，分别检查MCU状态、SoC状态、传感器状态。MCU自检通过后回复。SoC自检包括内存和算法模型加载。传感器自检依次检查前视摄像头、毫米波雷达和激光雷达，每个传感器回复自检结果。所有自检通过后，智驾域控向VCU报告系统就绪。VCU通知HMI显示系统正常。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
sequenceDiagram
    autonumber
    participant VCU as "整车控制器VCU"
    participant DC as "智驾域控制器"
    participant MCU as "安全MCU"
    participant SOC as "智驾SoC"
    participant CAM as "前视摄像头"
    participant RAD as "毫米波雷达"
    participant LID as "激光雷达"
    participant HMI as "仪表HMI"

    VCU->>DC: 唤醒信号(IGN_ON)
    activate DC
    Note over DC: 系统启动 (Boot)

    par 并行自检
        DC->>MCU: MCU状态查询
        activate MCU
        MCU->>MCU: 自检(电源/时钟/看门狗)
        MCU-->>DC: MCU自检通过
        deactivate MCU
    and
        DC->>SOC: SoC状态查询
        activate SOC
        SOC->>SOC: 内存自检
        SOC->>SOC: 算法模型加载
        SOC-->>DC: SoC自检通过
        deactivate SOC
    and
        DC->>CAM: 摄像头自检
        activate CAM
        CAM-->>DC: 摄像头OK
        deactivate CAM
        DC->>RAD: 雷达自检
        activate RAD
        RAD-->>DC: 雷达OK
        deactivate RAD
        DC->>LID: 激光雷达自检
        activate LID
        LID-->>DC: 激光雷达OK
        deactivate LID
    end

    DC->>DC: 系统级健康诊断
    Note over DC: 所有子系统状态正常
    DC-->>VCU: 系统就绪信号
    deactivate DC
    VCU->>HMI: 显示系统状态正常
    activate HMI
    HMI-->>VCU: 显示完成
    deactivate HMI
