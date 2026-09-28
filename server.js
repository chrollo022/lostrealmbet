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

// In-memory real-time state for live chat & bets
const MAX_HISTORY = 100;
const liveChatHistory = [
  {
    id: 'system_welcome',
    user: 'Server Supreme',
    text: 'Welcome to Supreme Casino! Live server is online on Render.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: true,
  },
];
const liveBetsHistory = [];
const activeBattles = [];

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
