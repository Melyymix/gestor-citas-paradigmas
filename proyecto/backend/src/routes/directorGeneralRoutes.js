'use strict';

const express = require('express');
const DirectorGeneralController = require('../controllers/DirectorGeneralController');
const AuthService = require('../services/AuthService');

const router = express.Router();

router.get(
  '/especialidades',
  AuthService.requerirAuth,
  AuthService.requerirRol('DIRECTOR_GENERAL'),
  DirectorGeneralController.listarEspecialidades
);
router.get(
  '/admins-area',
  AuthService.requerirAuth,
  AuthService.requerirRol('DIRECTOR_GENERAL'),
  DirectorGeneralController.listarAdminsArea
);
router.post(
  '/admins-area',
  AuthService.requerirAuth,
  AuthService.requerirRol('DIRECTOR_GENERAL'),
  DirectorGeneralController.registrarAdminArea
);

module.exports = router;
