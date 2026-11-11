'use strict';

const express = require('express');
const router = express.Router();
const PacienteController = require('../controllers/PacienteController');

const AuthService = require('../services/AuthService');

router.use(AuthService.requerirAuth);
router.use(AuthService.requerirRol('PACIENTE'));

// Rutas de consulta para el paciente autenticado
router.get('/mis-citas', PacienteController.obtenerMisCitas);
router.get('/perfil', PacienteController.obtenerPerfil);

module.exports = router;