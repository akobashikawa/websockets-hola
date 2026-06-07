const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io'); // Importamos Socket.io

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
// Inicializamos Socket.io sobre el servidor HTTP
const io = new Server(server, {
    cors: { origin: "*" } // Permitir conexiones desde cualquier origen para pruebas
});

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

// Enviar un mensaje solo a un cliente por id
function sendTo(id, payload) {
    const client = clients.get(id);
    if (client && client.readyState === 1) {
        client.send(JSON.stringify(payload));
    }
}

// Escuchamos las conexiones de Socket.io
io.on('connection', (socket) => {
    // Socket.io genera automáticamente un ID alfanumérico único para cada pestaña: socket.id
    console.log(`Cliente conectado vía Socket.io: ${socket.id}`);
    
    // Apenas se conecta, le enviamos su ID y el estado actual
    // Nota que podemos pasar un Objeto JS directamente, ¡Socket.io lo serializa solo!
    socket.emit('init-state', Object.assign({ id: socket.id }, appState));

    // En lugar de un "if (action === '...')" gigante, creamos escuchadores por evento
    socket.on('post-data', (payload) => {
        console.log(`${socket.id}:`, payload);
        
        appState.data = payload.data || '-';
        
        // Responderle uno-a-uno al cliente que envió el mensaje
        socket.emit('feedback', { message: `data recibida desde tu propia pestaña` });
        
        // Broadcast: Avisamos a TODOS los clientes conectados que el estado cambió
        io.emit('state-changed', appState);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} desconectado`);
    });
});

// Mantenemos tus rutas HTTP por si acaso las quieres seguir probando
app.get('/api/get-data', (req, res) => {
    res.json(appState);
});

app.post('/api/post-data', (req, res) => {
    appState.data = req.body.data || '-';
    // broadcastState(); // También notificamos por socket si usan la ruta HTTP
    res.json(appState);
});

// Importante: Ahora escuchamos desde 'server', no desde 'app'
server.listen(PORT, () => {
    console.log(`Servidor HTTP y WS corriendo en http://localhost:${PORT}`);
});