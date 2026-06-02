const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors()); // Para que Vue pueda hacer peticiones desde otro puerto o archivo
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Nuestro "estado" en memoria del servidor
let appState = {
    data: 'HOLA', // Estado inicial
};

// Ruta para que la PC consulte el estado actual
app.get('/api/get-data', (req, res) => {
    res.json(appState);
});

// Ruta para que el celular simule que escaneó el QR y cambie el estado
app.post('/api/post-data', (req, res) => {
    appState.data = req.body.data || '-';
    res.json(appState);
});

// Ruta para reiniciar el experimento
app.post('/api/reset', (req, res) => {
    appState.data = req.body.data || '';
    res.json(appState);
});

app.listen(PORT, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
});