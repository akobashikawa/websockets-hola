const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
const PORT = 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'state-updates';

app.use(cors());
app.use(express.json());

let appState = {
    data: 'HOLA',
};

let redisPub;

async function initRedis() {
    redisPub = createClient({ url: REDIS_URL });
    redisPub.on('error', (err) => console.error('[API] Redis error:', err));
    await redisPub.connect();
    console.log('[API] Redis conectado');
}

async function publishState() {
    if (!redisPub?.isOpen) return;
    await redisPub.publish(CHANNEL, JSON.stringify(appState));
}

app.get('/api/get-data', (req, res) => {
    res.json(appState);
});

app.post('/api/post-data', async (req, res) => {
    appState.data = req.body.data || '-';
    await publishState();
    res.json(appState);
});

async function start() {
    await initRedis();
    app.listen(PORT, () => {
        console.log(`[API] REST API corriendo en http://localhost:${PORT}`);
    });
}

start().catch(console.error);
