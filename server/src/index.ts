import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import generateRouter from './routes/generate';
import { config } from './config';
import { startFeishuChannel } from './services/feishu-bot';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api', generateRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    mockLlm: config.mockLlm,
    feishu: {
      websocketEnabled: config.feishu.enabled,
      mockSend: config.feishu.mockSend,
      appIdConfigured: Boolean(config.feishu.appId),
      appSecretConfigured: Boolean(config.feishu.appSecret),
    },
  });
});

// Resolve client/dist relative to the executable or source directory
const isSEA = process.execPath.endsWith('.exe') && !process.execPath.includes('node.exe');
const baseDir = isSEA ? path.dirname(process.execPath) : path.join(__dirname, '../../');
const clientDist = path.join(baseDir, 'client/dist');

// Also check if client/dist is next to the exe (for portable deployment)
const altClientDist = path.join(path.dirname(process.execPath), 'client/dist');

if (require('fs').existsSync(altClientDist)) {
  console.log('[server] Serving frontend from:', altClientDist);
  app.use(express.static(altClientDist));
} else if (require('fs').existsSync(clientDist)) {
  console.log('[server] Serving frontend from:', clientDist);
  app.use(express.static(clientDist));
} else {
  console.log('[server] Frontend dist not found at:', clientDist, 'or', altClientDist);
}

// SPA fallback: all non-API routes serve index.html
const staticDirs = [altClientDist, clientDist].filter(d => require('fs').existsSync(d));
app.get('*', (_req, res) => {
  for (const dir of staticDirs) {
    const indexPath = path.join(dir, 'index.html');
    if (require('fs').existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).send('Frontend not built. Run: cd client && npm run build');
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Wombat-Blackboard v1.0`);
  console.log(`  Server: ${url}`);
  console.log(`  API key: ${config.apiKey ? 'configured' : 'missing'}`);
  console.log(`  Model:   ${config.model}\n`);
  console.log(`  Feishu:  ${config.feishu.enabled ? 'websocket enabled' : 'disabled'}\n`);

  startFeishuChannel();

  // Auto-open browser (skip if NO_BROWSER=true)
  if (process.env.NO_BROWSER !== 'true') {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `start ${url}`
      : platform === 'darwin'
        ? `open ${url}`
        : `xdg-open ${url}`;
    exec(cmd, (err) => {
      if (err) console.log('  (无法自动打开浏览器，请手动访问上面的地址)');
    });
  }
});
