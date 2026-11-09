'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint mínimo de verificación del servidor (estructura base)
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'gestor-citas-medicas-backend',
    status: 'running',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
