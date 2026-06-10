# 流程图 Few-Shot 示例 Flowchart Examples

## 示例 1：智能驾驶系统架构图

**用户输入：** 画智能驾驶系统架构图，传感器层包括前视摄像头、毫米波雷达、激光雷达和超声波传感器；感知层包括目标检测、车道线检测和可通行区域检测；融合层做传感器融合；规划层分全局规划和局部规划；控制层分横向控制和纵向控制；执行层包括转向、制动和驱动。最后是人机交互界面。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff', 'actorBorder': '#1B3A5C', 'actorBkg': '#E8EDF3', 'actorTextColor': '#1B3A5C', 'actorLineColor': '#4A6FA5', 'signalColor': '#1B3A5C', 'labelBoxBkgColor': '#E8EDF3', 'noteBkgColor': '#FFF8E1', 'noteBorderColor': '#E6A817'}}}%%
flowchart TD
    subgraph Sensors["传感器层"]
        CAM[前视摄像头]
        RAD[毫米波雷达]
        LID[激光雷达]
        USS[超声波传感器]
    end
    subgraph Perception["感知层"]
        DET[目标检测]
        LANE[车道线检测]
        FREESP[可通行区域检测]
    end
    subgraph Fusion["融合层"]
        SENSOR_FUS[传感器融合]
    end
    subgraph Planning["规划层"]
        GLOB_PLAN[全局路径规划]
        LOC_PLAN[局部轨迹规划]
    end
    subgraph Control["控制层"]
        CTRL_LAT[横向控制]
        CTRL_LON[纵向控制]
    end
    subgraph Actuation["执行层"]
        ACT_STR[转向执行器EPS]
        ACT_BRK[制动执行器ESC]
        ACT_ACC[驱动执行器]
    end
    HMI[人机交互界面]
    CAM --> DET
    RAD --> DET
    LID --> FREESP
    USS --> FREESP
    CAM --> LANE
    DET --> SENSOR_FUS
    LANE --> SENSOR_FUS
    FREESP --> SENSOR_FUS
    SENSOR_FUS --> GLOB_PLAN
    GLOB_PLAN --> LOC_PLAN
    LOC_PLAN --> CTRL_LAT
    LOC_PLAN --> CTRL_LON
    CTRL_LAT --> ACT_STR
    CTRL_LON --> ACT_BRK
    CTRL_LON --> ACT_ACC
    HMI -->|驾驶员指令| GLOB_PLAN
    HMI -->|状态显示| SENSOR_FUS
    class CAM,RAD,LID,USS sensor
    class DET,LANE,FREESP,SENSOR_FUS compute
    class GLOB_PLAN,LOC_PLAN compute
    class CTRL_LAT,CTRL_LON compute
    class ACT_STR,ACT_BRK,ACT_ACC actuator
    class HMI external
    classDef sensor fill:#D6E8FA,stroke:#2E6DB4,color:#1B3A5C
    classDef compute fill:#E3DFF0,stroke:#5E4FA2,color:#2D1B4E
    classDef actuator fill:#FDE4D0,stroke:#E87722,color:#5C2D0E
    classDef external fill:#E2E8F0,stroke:#718096,color:#2D3748
```

---

## 示例 2：高速领航HWP功能ODD条件决策树

**用户输入：** 画一个HWP功能激活的ODD条件检查决策树。先检查车辆状态：车速是否在0-120km/h范围内，系统是否无故障。然后检查道路条件：是否是高速公路、车道线是否清晰。再检查环境条件：天气是否良好（无雨雪雾），光照是否充足（白天或夜间有路灯）。最后检查驾驶员状态：驾驶员是否存在、是否目视前方。所有条件满足则HWP可激活，否则提示相应原因。

**正确输出：**

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#1B3A5C', 'primaryTextColor': '#fff', 'primaryBorderColor': '#0F2440', 'lineColor': '#4A6FA5', 'secondaryColor': '#E8EDF3', 'tertiaryColor': '#F5F7FA', 'fontSize': '14px', 'clusterBkg': '#F5F7FA', 'clusterBorder': '#D0D8E3', 'edgeLabelBackground': '#fff'}}}%%
flowchart TD
    START(["ODD条件检查"]) --> VEH_CHK{车辆状态正常?}
    VEH_CHK -->|故障| FAIL1[功能不可用:<br/>系统故障]
    VEH_CHK -->|正常| SPEED_CHK{车速0-120km/h?}
    SPEED_CHK -->|超出范围| FAIL2[功能不可用:<br/>车速超出ODD]
    SPEED_CHK -->|范围内| ROAD_CHK{道路条件满足?}
    ROAD_CHK -->|非高速| FAIL3[功能不可用:<br/>非高速公路]
    ROAD_CHK -->|高速公路| LANE_CHK{车道线清晰?}
    LANE_CHK -->|模糊或无| FAIL4[功能受限:<br/>仅LKA辅助]
    LANE_CHK -->|清晰| WEATHER_CHK{天气条件良好?}
    WEATHER_CHK -->|雨/雪/雾| FAIL5[功能不可用:<br/>恶劣天气]
    WEATHER_CHK -->|良好| LIGHT_CHK{光照条件满足?}
    LIGHT_CHK -->|夜间无路灯| FAIL6[功能不可用:<br/>光照不足]
    LIGHT_CHK -->|白天或夜间有灯| DRV_CHK{驾驶员状态正常?}
    DRV_CHK -->|驾驶员分心/闭眼| FAIL7[功能不可用:<br/>驾驶员状态异常]
    DRV_CHK -->|正常| HWPA([HWP功能可激活])
    FAIL1 --> END([功能不可用])
    FAIL2 --> END
    FAIL3 --> END
    FAIL4 --> LKA_ONLY([仅LKA辅助激活])
    FAIL5 --> END
    FAIL6 --> END
    FAIL7 --> END
    class HWPA,LKA_ONLY success
    class FAIL1,FAIL2,FAIL3,FAIL5,FAIL6,FAIL7 error
    class FAIL4 warning
    class START,END default
    classDef success fill:#D4EDDA,stroke:#28A745,color:#155724
    classDef error fill:#F8D7DA,stroke:#DC3545,color:#721C24
    classDef warning fill:#FFF3CD,stroke:#E6A817,color:#5C4A0E
    classDef default fill:#E8EDF3,stroke:#4A6FA5,color:#1B3A5C
```

---

## 示例 3：AEB自动紧急制动系统架构

**用户输入：** 画AEB系统的架构图。输入来自前视摄像头和前向毫米波雷达。感知融合模块融合视觉和雷达数据做目标检测和跟踪。决策模块计算碰撞时间TTC，判断是否需要预警或制动。预警触发FCW报警（声音和视觉），制动触发制动请求给ESC执行器。同时有HMI显示报警状态。

**正确输出：**

```mermaid
flowchart TD
    subgraph Input["输入层"]
        CAM[前视摄像头]
        RAD[前向毫米波雷达]
    end
    subgraph Perception["感知层"]
        FUS_AEB[感知融合]
        DET_AEB[目标检测与跟踪]
    end
    subgraph Decision["决策层"]
        TTC_CALC[TTC碰撞时间计算]
        DEC_AEB{碰撞风险判断}
    end
    subgraph Output["输出层"]
        FCW_ALERT[FCW前向碰撞预警]
        BRK_REQ[制动请求]
    end
    subgraph HMI_AEB["人机交互"]
        SOUND_ALERT[声音报警]
        VIS_ALERT[视觉报警]
    end
    ESC_AEB[制动执行器ESC]
    CAM --> FUS_AEB
    RAD --> FUS_AEB
    FUS_AEB --> DET_AEB
    DET_AEB --> TTC_CALC
    TTC_CALC --> DEC_AEB
    DEC_AEB -->|TTC > 2.6s| SAFE[安全-无动作]
    DEC_AEB -->|1.6s < TTC <= 2.6s| FCW_ALERT
    DEC_AEB -->|TTC <= 1.6s| BRK_REQ
    DEC_AEB -->|TTC <= 0.8s| BRK_REQ
    FCW_ALERT --> SOUND_ALERT
    FCW_ALERT --> VIS_ALERT
    BRK_REQ --> ESC_AEB
    ESC_AEB -->|制动完成| DEC_AEB
