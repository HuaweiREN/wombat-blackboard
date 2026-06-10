# Wombat-Blackboard 部署教程

## 环境要求

- Node.js >= 22
- npm >= 9
- 能访问外网（调用 DeepSeek API + 飞书 WebSocket）

## 首次部署

### 1. 获取代码

```bash
git clone <仓库地址>
cd wombat-blackboard
```

### 2. 安装依赖 & 构建

```bash
npm install
cd client && npm install && npm run build && cd ..
cd server && npx tsc && cd ..
```

### 3. 配置环境变量

```bash
cp server/.env.example server/.env
nano server/.env
```

`.env` 必填项：

```ini
DEEPSEEK_API_KEY=sk-xxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
DEEPSEEK_MODEL=deepseek-v4-pro
PORT=3001
PUBLIC_BASE_URL=http://localhost:3001

FEISHU_WS_ENABLED=true
FEISHU_APP_ID=cli_xxxxxxxx
FEISHU_APP_SECRET=xxxxxxxx
FEISHU_DOMAIN=https://open.feishu.cn
FEISHU_MAX_REPLY_RETRIES=2

WOMBAT_MOCK_LLM=false
FEISHU_MOCK_SEND=false
NO_BROWSER=true
```

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key |
| `FEISHU_APP_ID` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | 飞书应用 App Secret |
| `FEISHU_WS_ENABLED` | 启用飞书 WebSocket 长连接 |
| `NO_BROWSER` | 设为 `true` 启动时不弹浏览器 |
| `WOMBAT_MOCK_LLM` | 开发调试用，设为 `true` 则 LLM 返回固定 mock 数据 |

### 4. 启动

```bash
cd server

# 前台运行
node dist/index.js

# 后台运行
nohup node dist/index.js > ../logs/server.log 2>&1 &
```

### 5. 验证

```bash
curl http://localhost:3001/api/health
# 应返回 {"success":true,"status":"ok",...}
```

飞书中 @机器人 发送画图指令测试。

## 从 Windows 搬迁到 Ubuntu

### 1. Windows 上准备

```bash
cd ~/wombat-blackboard

# 确认没有未提交的改动
git status

# 备份 .env（不会被 git 提交）
cp server/.env server/.env.backup
```

### 2. 传输代码

**方式 A：git（推荐）**

```bash
# Windows 上
git remote add origin <仓库地址>
git push -u origin master

# Ubuntu 上
git clone <仓库地址>
cd wombat-blackboard
cp /path/to/.env.backup server/.env
```

**方式 B：scp**

```bash
# Windows 上
scp -r wombat-blackboard/ user@ubuntu-ip:~/wombat-blackboard

# Ubuntu 上
cp ~/wombat-blackboard/server/.env.backup ~/wombat-blackboard/server/.env
```

### 3. Ubuntu 上安装 Node.js

```bash
# 方式 A：nvm（推荐，方便切换版本）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# 方式 B：直接安装
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install nodejs -y

# 验证
node -v   # 应 >= 22
npm -v
```

### 4. 安装依赖 & 构建

```bash
cd ~/wombat-blackboard
npm install
cd client && npm install && npm run build && cd ..
cd server && npx tsc && cd ..
```

### 5. 配置 .env 并启动

将备份的 `.env` 放到 `server/` 目录下，然后：

```bash
cd ~/wombat-blackboard/server
node dist/index.js
```

## 飞书配置

1. 进入飞书开发者后台 → 应用
2. 事件与回调 → 订阅方式 → 使用长连接接收事件
3. 添加事件：`im.message.receive_v1`（接收消息）
4. 机器人能力：开启

## 日常运维

### 更新代码

```bash
cd ~/wombat-blackboard
git pull
npm install
cd server && npx tsc && cd ..

# 重启
pkill -f "node dist/index.js"
cd server && nohup node dist/index.js > ../logs/server.log 2>&1 &
```

### 日志

```bash
# 服务日志
tail -f logs/server.log

# 业务调试日志
tail -f logs/debug.log
```

### 常见问题

| 问题 | 排查 |
|------|------|
| 飞书消息无响应 | `grep SERVER_STARTED logs/debug.log` 检查是否多次重启 |
| 预览图不显示 | `grep preview logs/debug.log` 查看 mermaid.ink 状态 |
| 端口被占用 | `lsof -i :3001` 查找占用进程 |
| Node 版本过低 | `nvm install 22 && nvm use 22` |
