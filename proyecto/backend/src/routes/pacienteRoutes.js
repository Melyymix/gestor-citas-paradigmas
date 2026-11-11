'use strict';

const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/PacienteController');

// Rutas de consulta para el paciente autenticado
router.get('/mis-citas', PacienteController.obtenerMisCitas);
router.get('/perfil', PacienteController.obtenerPerfil);

module.exports = router;