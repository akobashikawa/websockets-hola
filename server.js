const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3000;

app.use(cors()); // Para que Vue pueda hacer peticiones desde otro puerto o archivo
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Nuestro "estado" en memoria del servidor
let appState = {
    data: 'HOLA', // Estado inicial
};

// Creamos un servidor HTTP combinando Express
const server = http.createServer(app);
// Levantamos el servidor WebSocket Nativo encima del HTTP
const wss = new WebSocketServer({ server });

// Función para enviar el estado actual a TODOS los clientes conectados
function broadcastState() {
    const message = JSON.stringify(appState);
    wss.clients.forEach((client) => {
        // Verificamos que la conexión esté abierta
        if (client.readyState === 1) { 
            client.send(message);
        }
    });
}

// Escuchamos las conexiones de WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente conectado vía WebSocket Nativo');
    
    // Apenas se conecta un cliente, le mandamos el estado actual
    ws.send(JSON.stringify(appState));

    // Escuchamos si este cliente nos manda un mensaje directo por el socket
    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.action === 'post-data') {
                appState.data = parsed.data || '-';
                // Avisamos a todo el mundo que el estado cambió
                broadcastState();
            }
        } catch (err) {
            console.error("Error procesando mensaje del socket:", err);
        }
    });

    ws.on('close', () => console.log('Cliente desconectado'));
});

// Mantenemos tus rutas HTTP por si acaso las quieres seguir probando
app.get('/api/get-data', (req, res) => {
    res.json(appState);
});

app.post('/api/post-data', (req, res) => {
    appState.data = req.body.data || '-';
    broadcastState(); // También notificamos por socket si usan la ruta HTTP
    res.json(appState);
});

// Importante: Ahora escuchamos desde 'server', no desde 'app'
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
});