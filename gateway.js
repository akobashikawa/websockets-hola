const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const PORT = 3000;
const API_URL = process.env.API_URL || 'http://localhost:3001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'state-updates';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
});

let redisSub;

async function fetchInitialState() {
    const res = await fetch(`${API_URL}/api/get-data`);
    return res.json();
}

async function initRedis() {
    redisSub = createClient({ url: REDIS_URL });
    redisSub.on('error', (err) => console.error('[Gateway] Redis error:', err));
    await redisSub.connect();

    await redisSub.subscribe(CHANNEL, (message) => {
        const state = JSON.parse(message);
        io.emit('state-changed', state);
    });

    console.log('[Gateway] Suscrito a canal Redis:', CHANNEL);
}

io.on('connection', async (socket) => {
    console.log(`[Gateway] Cliente conectado: ${socket.id}`);

    try {
        const state = await fetchInitialState();
        socket.emit('init-state', Object.assign({ id: socket.id }, state));
    } catch (err) {
        console.error('[Gateway] Error al obtener estado inicial:', err.message);
        socket.emit('init-state', { id: socket.id, data: '-' });
    }

    socket.on('disconnect', () => {
        console.log(`[Gateway] Cliente desconectado: ${socket.id}`);
    });
});

async function start() {
    await initRedis();
    server.listen(PORT, () => {
        console.log(`[Gateway] WebSocket + Static corriendo en http://localhost:${PORT}`);
    });
}

start().catch(console.error);
