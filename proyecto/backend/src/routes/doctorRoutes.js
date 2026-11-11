'use strict';

const express = require('express');
const DoctorController = require('../controllers/DoctorController');
const AuthService = require('../services/AuthService');

const router = express.Router();

// Middleware: todas las rutas de doctor requieren autenticación y rol DOCTOR
function requerirDoctor(req, res, next) {
  AuthService.requerirAuth(req, res, (err) => {
    if (err) return next(err);
    if (!req.usuario || req.usuario.rol !== 'DOCTOR') {
      return res.status(403).json({ ok: false, mensaje: 'Acceso restringido a doctores' });
    }
    next();
  });
}

// GET  /api/doctor/citas-pendientes
router.get('/citas-pendientes', requerirDoctor, DoctorController.obtenerCitasPendientes);

// GET  /api/doctor/expediente/:idPaciente
router.get('/expediente/:idPaciente', requerirDoctor, DoctorController.obtenerExpediente);

// POST /api/doctor/consulta
router.post('/consulta', requerirDoctor, DoctorController.registrarConsulta);

// PUT  /api/doctor/citas/:idCita/cancelar
router.put('/citas/:idCita/cancelar', requerirDoctor, DoctorController.cancelarCita);

module.exports = router;
