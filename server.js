/**
 * Qalana Interview Signaling Server
 * 
 * Lightweight WebSocket server that relays messages between
 * two browsers on different machines for real-time interviews.
 * 
 * Usage: node server.js
 * Runs on: ws://localhost:4000 (and your network IP)
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { networkInterfaces } from 'os';

const PORT = 4000;

// Store rooms: roomCode -> Set of WebSocket connections
const rooms = new Map();

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.roomCode = null;
  ws.role = null;
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // Handle JOIN — client tells us their room and role
    if (msg.type === 'JOIN') {
      ws.roomCode = msg.roomCode;
      ws.role = msg.role;

      if (!rooms.has(msg.roomCode)) {
        rooms.set(msg.roomCode, new Set());
      }
      rooms.get(msg.roomCode).add(ws);

      console.log(`[+] ${msg.role} joined room ${msg.roomCode} (${rooms.get(msg.roomCode).size} in room)`);

      // Notify others in the room
      broadcast(msg.roomCode, { type: 'PEER_JOINED', roomCode: msg.roomCode, role: msg.role }, ws);
      return;
    }

    // For all other messages, relay to everyone else in the same room
    if (ws.roomCode && rooms.has(ws.roomCode)) {
      broadcast(ws.roomCode, msg, ws);
    }
  });

  ws.on('close', () => {
    if (ws.roomCode && rooms.has(ws.roomCode)) {
      const room = rooms.get(ws.roomCode);
      room.delete(ws);
      console.log(`[-] ${ws.role} left room ${ws.roomCode} (${room.size} remaining)`);

      // Notify others
      broadcast(ws.roomCode, { type: 'PEER_LEFT', roomCode: ws.roomCode, role: ws.role });

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(ws.roomCode);
        console.log(`[x] Room ${ws.roomCode} destroyed`);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('[!] WebSocket error:', err.message);
  });
});

/**
 * Broadcast a message to all clients in a room except the sender
 */
function broadcast(roomCode, msg, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const data = JSON.stringify(msg);
  for (const client of room) {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(data);
    }
  }
}

// Heartbeat to detect dead connections
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

// Get local network IP
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   🟢 Qalana Interview Signaling Server      ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Local:   ws://localhost:${PORT}              ║`);
  console.log(`  ║   Network: ws://${localIP}:${PORT}       ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Share the Network URL with the other computer.');
  console.log('  Both computers must be on the same WiFi/LAN.');
  console.log('');
});
