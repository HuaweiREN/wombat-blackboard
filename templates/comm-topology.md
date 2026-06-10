# 通信拓扑

## 场景描述

本模板用于描述整车级通信网络拓扑，涵盖 ADAS 域、座舱域（Cockpit）、底盘域（Chassis）、车身域（Body）和动力域（Powertrain）五大功能域的互联架构。网络骨干采用车载以太网技术，ADAS 域与座舱域之间使用 1000BASE-T1（1 Gbps）实现大带宽数据交互（感知结果、地图信息、显示渲染），其他域之间使用 100BASE-T1（100 Mbps）连接。中央网关（CGW）作为全网通信枢纽，提供不同协议域之间的路由和协议转换功能，同时承担防火墙和网络隔离的安全职责。

ADAS 域内部分为传感器网络和控制器网络两层。传感器层使用 GMSL2/FPD-Link III 同轴电缆传输摄像头视频流（每路 4-6 Gbps），雷达数据通过专用 CAN-FD（4 Mbps）汇总至雷达融合模块。域控制器内部 SoC 与 MCU 之间通过 PCIe 或 SPI 通信。控制层使用冗余 CAN-FD 总线连接线控制动（IPB）、线控转向（SBW）和动力域控制器，确保安全关键指令的实时可靠传输。底盘域内部采用 FlexRay 或 CAN-FD 连接 ESP、EPS、EPB 等底盘执行器，周期 1-5ms 的确定性调度满足功能安全 ASIL-D 要求。

车身域和动力域以 CAN-FD 总线为主，连接 BCM（车身控制模块）、BCM（电池管理）、VCU（整车控制器）、TMS（热管理系统）等节点，总线速率为 500 Kbps-2 Mbps。LIN 子总线连接低带宽车身节点（车窗、车门、车灯、座椅），以降低成本和布线复杂度。诊断接口提供 DoIP（Diagnostic over IP）通过以太网进行高效软件刷写和远程诊断，同时保留经典的 CAN OBD-II 接口用于法规一致性检测和售后诊断。对于安全关键路径（线控制动、线控转向），采用双路 CAN-FD 冗余设计，单一总线故障不影响安全功能可用性。

在生成图表时，请展示域间和域内的完整拓扑网络。域控制器作为主要节点，按功能域分组排列（建议从左到右或环形布局）。骨干以太网连接各域控制器作为主干线路，域内总线作为分支线路。协议类型标注于线路旁（ETH/1000BASE-T1、CAN-FD、LIN 等）。冗余 CAN 用双实线或虚结合线型区分标注。中央网关置于拓扑中心位置，标注其与各域的连接关系以及外部诊断接口。

## 关键要素

- 五大功能域: ADAS / Cockpit / Chassis / Body / Powertrain 的定义和职责划分
- 骨干网络: 车载以太网 100BASE-T1 / 1000BASE-T1 连接中央网关和各域控制器
- ADAS 域内通信: GMSL 传感器数据流、CAN-FD 雷达数据、PCIe 芯片间互联
- 中央网关: 跨协议路由、防火墙、网络隔离、DoIP 诊断接口
- 冗余设计: 双路 CAN-FD 用于线控制动和线控转向的安全关键路径
- 诊断接口: DoIP（以太网 OTA 刷写）、CAN OBD-II（法规诊断）、UDS 诊断协议
- 车身低速网络: LIN 总线连接车窗/车灯/座椅/门锁等低带宽节点

## 参数占位

- {domain_count}: 3~5，整车功能域数量
- {has_central_gateway}: true/false，是否包含中央网关
- {eth_speed}: 100M / 1G，骨干以太网速率
- {has_redundant_can}: true/false，是否为安全关键路径配置冗余 CAN
- {has_flexray}: true/false，底盘域是否使用 FlexRay 总线
- {lin_nodes}: 4~12，LIN 子总线连接的节点数量
- {diagnostic_protocol}: DoIP / CAN OBD-II / 两者兼备

## 典型输出类型

flowchart
