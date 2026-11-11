'use strict';

const express = require('express');
const router = express.Router();
const CitaMedicaController = require('../controllers/CitaMedicaController');

const AuthService = require('../services/AuthService');
const { requerirAuth, requerirRol } = AuthService;

router.use(requerirAuth);
router.post('/', requerirRol('PACIENTE', 'RECEPCIONISTA'), CitaMedicaController.agendarCita);
router.put('/:id/cancelar-paciente', requerirRol('PACIENTE'), CitaMedicaController.cancelarPorPaciente);
router.put('/:id/cancelar-recepcion', requerirRol('RECEPCIONISTA'), CitaMedicaController.cancelarPorRecepcion);
router.put('/:id/cancelar-especial', requerirRol('RECEPCIONISTA'), CitaMedicaController.cancelarEspecial);
router.put('/:id/pagar', requerirRol('RECEPCIONISTA'), CitaMedicaController.registrarPago);

module.exports = router;