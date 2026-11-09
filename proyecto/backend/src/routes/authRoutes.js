'use strict';

const express = require('express');
const AuthController = require('../controllers/AuthController');
const AuthService = require('../services/AuthService');

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', AuthService.requerirAuth, AuthController.logout);
router.post('/registro-paciente', AuthController.registroPaciente);
router.get('/perfil', AuthService.requerirAuth, AuthController.perfil);
router.get('/especialidades', AuthController.listarEspecialidades);

module.exports = router;
