'use strict';

const express = require('express');
const router = express.Router();
const CitaMedicaController = require('../controllers/CitaMedicaController');

router.post('/', CitaMedicaController.agendarCita);
router.put('/:id/cancelar-paciente', CitaMedicaController.cancelarPorPaciente);
router.put('/:id/cancelar-especial', CitaMedicaController.cancelarEspecial);
router.put('/:id/pagar', CitaMedicaController.registrarPago);

module.exports = router;