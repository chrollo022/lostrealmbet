import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Health check endpoint for Render.com
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Supreme Casino',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve Vite production build from dist/
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// In-memory real-time state for live chat & bets & GTPS
const MAX_HISTORY = 100;
const liveChatHistory = [];
const liveBetsHistory = [];
const activeBattles = [];

let gtpsConfig = {
  port: 21184,
  secretKey: 'supreme_gtps_secret_auth_token_21184',
  status: 'online',
  activeSyncCount: 0,
};

// GTPS API Endpoints (Synced with GTPS Server on Port 21184)
app.get('/api/gtps/status', (req, res) => {
  res.json({
    status: gtpsConfig.status,
    port: gtpsConfig.port,
    syncCount: gtpsConfig.activeSyncCount,
  });
});

app.post('/api/gtps/config', (req, res) => {
  const { port } = req.body;
  if (port && Number(port) > 0) {
    gtpsConfig.port = Number(port);
  }
  res.json({ success: true, port: gtpsConfig.port });
});

app.post('/api/gtps/deposit-webhook', (req, res) => {
  const { growId, currency, amount, secretKey } = req.body;
  console.log(`[GTPS Deposit] Received ${amount} ${currency} from ${growId}`);
  gtpsConfig.activeSyncCount++;

  // Broadcast deposit notification to all connected clients
  broadcast({
    type: 'GTPS_DEPOSIT',
    payload: {
      growId: growId || 'Unknown',
      currency: currency || 'BGL',
      amount: Number(amount) || 0,
      timestamp: Date.now(),
    },
  });

  res.json({ success: true, growId, currency, amount });
});

app.post('/api/gtps/withdraw-webhook', (req, res) => {
  const { growId, currency, amount, secretKey } = req.body;
  console.log(`[GTPS Withdraw] Requested ${amount} ${currency} for ${growId}`);
  gtpsConfig.activeSyncCount++;

  res.json({ success: true, growId, currency, amount, status: 'dispatched' });
});

app.post('/api/gtps/link-growid', (req, res) => {
  const { growid, code } = req.body;
  console.log(`[GTPS Link] GrowID ${growid} linked with code ${code}`);

  broadcast({
    type: 'GTPS_LINK',
    payload: { growId: growid, code, timestamp: Date.now() },
  });

  res.json({ success: true, growId: growid, code });
});

app.get('/api/gtps/balance/:growid', (req, res) => {
  res.json({ success: true, growId: req.params.growid, status: 'active' });
});

// Real-Time WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data, excludeWs = null) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  // Send initial real state upon connecting
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: {
        chatHistory: liveChatHistory.slice(-50),
        liveBets: liveBetsHistory.slice(0, 30),
        activeBattles: activeBattles.filter((b) => b.status === 'open'),
      },
    })
  );

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === 'CHAT_MESSAGE') {
        const chatItem = message.payload;
        liveChatHistory.push(chatItem);
        if (liveChatHistory.length > MAX_HISTORY) liveChatHistory.shift();
        broadcast({ type: 'CHAT_MESSAGE', payload: chatItem });
      } else if (message.type === 'LIVE_BET') {
        const betItem = message.payload;
        liveBetsHistory.unshift(betItem);
        if (liveBetsHistory.length > MAX_HISTORY) liveBetsHistory.pop();
        broadcast({ type: 'LIVE_BET', payload: betItem });
      } else if (message.type === 'BATTLE_CREATE') {
        const battle = message.payload;
        activeBattles.unshift(battle);
        broadcast({ type: 'BATTLE_CREATED', payload: battle });
      } else if (message.type === 'BATTLE_UPDATE') {
        const updated = message.payload;
        const idx = activeBattles.findIndex((b) => b.id === updated.id);
        if (idx !== -1) {
          activeBattles[idx] = updated;
        } else {
          activeBattles.unshift(updated);
        }
        broadcast({ type: 'BATTLE_UPDATED', payload: updated });
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });
});

// SPA fallback: send index.html for any client-side routes
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`[Supreme Casino] Server running on port ${PORT}`);
  console.log(`[Supreme Casino] Healthcheck: http://localhost:${PORT}/healthz`);
});
