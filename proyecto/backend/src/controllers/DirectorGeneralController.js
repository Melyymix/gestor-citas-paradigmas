'use strict';

const UsuarioService = require('../services/UsuarioService');

class DirectorGeneralController {
  static async crearCuenta(req, res, next) {
    try {
      const director = await UsuarioService.crearCuentaDirector(req.body);
      res.status(201).json({ ok: true, usuario: director });
    } catch (err) {
      next(err);
    }
  }

  static async registrarAdminArea(req, res, next) {
    try {
      const admin = await UsuarioService.registrarAdministradorArea(req.usuario, req.body);
      res.status(201).json({ ok: true, admin });
    } catch (err) {
      next(err);
    }
  }

  static async listarAdminsArea(_req, res, next) {
    try {
      const admins = await UsuarioService.listarAdministradoresArea();
      res.json({ ok: true, admins });
    } catch (err) {
      next(err);
    }
  }

  static async listarEspecialidades(_req, res, next) {
    try {
      const especialidades = await UsuarioService.listarEspecialidades();
      res.json({ ok: true, especialidades });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DirectorGeneralController;
