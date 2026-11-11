'use strict';

const express = require('express');
const AdministradorAreaController = require('../controllers/AdministradorAreaController');
const AuthService = require('../services/AuthService');

const router = express.Router();

router.use(AuthService.requerirAuth, AuthService.requerirRol('ADMIN_AREA'));

router.get('/personal', AdministradorAreaController.listarPersonal);
router.post('/doctores', AdministradorAreaController.registrarDoctor);
router.post('/recepcionistas', AdministradorAreaController.registrarRecepcionista);
router.post('/pacientes', AdministradorAreaController.registrarPaciente);

module.exports = router;
