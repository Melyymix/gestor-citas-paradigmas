'use strict';

const express = require('express');
const router = express.Router();
const RecepcionistaController = require('../controllers/RecepcionistaController');

const AuthService = require('../services/AuthService');

router.use(AuthService.requerirAuth);
// Rutas de administración operativa en recepción
router.post('/pacientes', AuthService.requerirRol('RECEPCIONISTA'), RecepcionistaController.registrarPaciente);
router.get('/catalogos/doctores', AuthService.requerirRol('PACIENTE', 'RECEPCIONISTA'), RecepcionistaController.consultarDoctoresPorEspecialidad);
router.get('/horarios-doctor/:idDoctor', AuthService.requerirRol('PACIENTE', 'RECEPCIONISTA'), RecepcionistaController.consultarHorariosDoctor);

module.exports = router;