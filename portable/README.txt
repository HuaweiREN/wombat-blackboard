# Wombat-Blackboard 便携版

## 使用方法

1. 双击 `启动.bat` 或 `wombat-blackboard.exe`
2. 浏览器会自动打开 http://localhost:3001
3. 在输入框中用自然语言描述你想画的场景
4. 右侧实时预览生成的图表
5. 点击底部"复制代码"按钮
6. 粘贴到飞书文档（输入 /mermaid 后粘贴）

## 文件说明

- wombat-blackboard.exe — 主程序（包含后端服务 + 嵌入式 Prompt）
- client/dist/ — 前端界面文件
- 启动.bat — 快捷启动脚本（自动打开浏览器）

## 工具内置

- 智驾领域术语词典（传感器/控制器/功能/通信/安全/ODD）
- 5 个领域模板（传感器架构/域控架构/功能状态机/ODD决策树/通信拓扑）
- 10 个 Few-shot 示例

## 系统要求

- Windows 10/11 64位
- 无需安装 Node.js 或其他依赖

## 停止

关闭命令行窗口即可停止服务。
