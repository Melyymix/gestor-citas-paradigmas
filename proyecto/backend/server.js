'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importación de enrutadores
const doctorRoutes = require('./src/routes/doctorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de verificación del servidor
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'gestor-citas-medicas-backend',
    status: 'running',
  });
});

// Registro de las rutas del Doctor (Módulo Itzel)
app.use('/api/doctor', doctorRoutes);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});