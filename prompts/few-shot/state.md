# 状态图 Few-Shot 示例 State Diagram Examples

## 示例 1：ADAS功能主状态机

**用户输入：** 画ADAS功能的主状态机。系统有关闭、待机、激活、驾驶员覆写和故障降级五个状态。系统上电后从关闭进入待机。待机状态下，如果所有激活条件满足（车速在范围、无故障、ODD条件满足），则进入激活状态。激活状态下，如果驾驶员踩刹车或转动方向盘，进入驾驶员覆写状态。覆写状态下，驾驶员操作结束后自动回到待机。激活状态下如果系统检测到故障，进入故障降级状态。故障降级状态下，如果故障消失可以回到待机，如果故障持续则最终进入关闭。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
stateDiagram-v2
    [*] --> OFF: 系统下电
    OFF --> SBY: 系统上电自检通过
    SBY --> ACT: 激活条件满足<br/>车速在ODD范围<br/>无系统故障<br/>驾驶员确认
    ACT --> OVR: 驾驶员干预<br/>踩刹车/方向盘干预
    OVR --> SBY: 干预结束<br/>驾驶员释放
    ACT --> DEG: 系统故障<br/>传感器/控制器/执行器
    DEG --> SBY: 故障恢复<br/>临时故障消失
    DEG --> OFF: 永久故障<br/>需维修确认
    ACT --> ACT: 性能降级<br/>部分ODD条件不满足
    ACT --> OFF: 系统关闭请求<br/>用户手动关闭

    state ACT {
        [*] --> HW_PILOT: 首选功能
        HW_PILOT --> TRAFFIC_JAM: 车速<60km/h<br/>拥堵条件
        TRAFFIC_JAM --> HW_PILOT: 车速>60km/h
        HW_PILOT --> LANE_KEEP: 车道线变模糊<br/>高清地图失效
        LANE_KEEP --> HW_PILOT: 车道线恢复
    end

    state OVR {
        [*] --> WAIT_OVR: 等待干预结束
        WAIT_OVR --> [*]: 干预释放确认
    end

    state DEG {
        [*] --> SENSOR_FAIL: 传感器故障
        [*] --> ACTUATOR_FAIL: 执行器故障
        [*] --> CONTROLLER_FAIL: 控制器故障
        SENSOR_FAIL --> LIMP_HOME: 跛行回家模式
        ACTUATOR_FAIL --> SAFE_STOP: 安全靠边停车
        CONTROLLER_FAIL --> SAFE_STOP
        LIMP_HOME --> [*]: 限制车速行驶
        SAFE_STOP --> [*]: 驻车后进入
    end
```

---

## 示例 2：APA自动泊车功能状态转换

**用户输入：** 画APA自动泊车功能的状态机。系统有闲置、搜索车位、路径规划、执行泊车和完成五个主要状态。用户在HMI上开启APA后从闲置进入搜索车位状态。搜索到车位后自动切换到路径规划状态。路径规划完成进入执行泊车状态。执行过程中如果路径偏差过大或遇到障碍物，回到路径规划重新规划。执行泊车完成后进入完成状态。任何时候用户点击取消或在执行过程中检测到紧急碰撞风险，回到闲置状态。搜索车位状态中如果用户关闭APA功能也回到闲置。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
stateDiagram-v2
    [*] --> IDLE: 系统初始化
    IDLE --> SEARCH: 用户激活APA

    state SEARCH {
        [*] --> SCAN: 超声波扫描
        SCAN --> FOUND: 检测到有效车位
        SCAN --> SCAN: 继续扫描
        FOUND --> CONFIRM: 车位确认<br/>(平行/垂直/斜向)
        CONFIRM --> [*]: 车位锁定
    end

    SEARCH --> IDLE: 用户取消搜索
    SEARCH --> PLAN: 车位选定
    SEARCH --> IDLE: 车速>30km/h<br/>自动退出

    state PLAN {
        [*] --> GEN_PATH: 路径生成
        GEN_PATH --> VALID: 路径有效
        GEN_PATH --> GEN_PATH: 重新规划
        VALID --> [*]: 路径确认
    end

    PLAN --> EXEC: 路径规划完成

    state EXEC {
        [*] --> FIRST_GEAR: 前进挡
        FIRST_GEAR --> REV_GEAR: 需要调整方向
        REV_GEAR --> FIRST_GEAR: 方向调整完成
        REV_GEAR --> FINAL: 泊入完成
        FIRST_GEAR --> FINAL: 一次泊入完成
        FIRST_GEAR --> FIRST_GEAR: 微调
        REV_GEAR --> REV_GEAR: 微调
    end

    EXEC --> PLAN: 路径偏差过大<br/>重新规划
    EXEC --> IDLE: 紧急碰撞风险<br/>用户急刹车
    EXEC --> COMPLETE: 泊车完成

    COMPLETE --> IDLE: 用户确认<br/>系统复位
    EXEC --> IDLE: 用户取消
    PLAN --> IDLE: 用户取消
    EXEC --> PLAN: 新障碍物<br/>路径需调整
