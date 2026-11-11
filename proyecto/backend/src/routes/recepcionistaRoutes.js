'use strict';

const express = require('express');
const router = express.Router();
const RecepcionistaController = require('../controllers/RecepcionistaController');

// Rutas de administración operativa en recepción
router.post('/pacientes', RecepcionistaController.registrarPaciente);
router.get('/catalogos/doctores', RecepcionistaController.consultarDoctoresPorEspecialidad);
router.get('/horarios-doctor/:idDoctor', RecepcionistaController.consultarHorariosDoctor);

module.exports = router;