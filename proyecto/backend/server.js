'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const directorGeneralRoutes = require('./src/routes/directorGeneralRoutes');
const administradorAreaRoutes = require('./src/routes/administradorAreaRoutes');
const citaMedicaRoutes = require('./src/routes/citaMedicaRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const recepcionistaRoutes = require('./src/routes/recepcionistaRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');

class AppServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.configurarMiddlewares();
    this.configurarRutas();
    this.configurarErrores();
  }

  configurarMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  configurarRutas() {
    this.app.get('/api/health', async (_req, res) => {
      try {
        const dbOk = await Database.testConnection();
        res.json({ ok: true, service: 'gestor-citas-medicas-backend', db: dbOk });
      } catch (err) {
        res.status(503).json({ ok: false, service: 'gestor-citas-medicas-backend', db: false, mensaje: err.message });
      }
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/director', directorGeneralRoutes);
    this.app.use('/api/admin-area', administradorAreaRoutes);
    this.app.use('/api/citas', citaMedicaRoutes);
    this.app.use('/api/pacientes', pacienteRoutes);
    this.app.use('/api/recepcion', recepcionistaRoutes);
    this.app.use('/api/doctor', doctorRoutes);
  }

  configurarErrores() {
    this.app.use((_req, res) => {
      res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
    });

    this.app.use((err, _req, res, _next) => {
      const status = err.statusCode || 500;
      if (status >= 500) {
        console.error(err);
      }
      res.status(status).json({
        ok: false,
        mensaje: err.message || 'Error interno del servidor',
      });
    });
  }

  iniciar() {
    this.app.listen(this.port, () => {
      console.log(`Servidor escuchando en http://localhost:${this.port}`);
    });
  }
}

const server = new AppServer();
server.iniciar();
