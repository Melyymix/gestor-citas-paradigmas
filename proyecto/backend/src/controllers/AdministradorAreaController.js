'use strict';

const UsuarioService = require('../services/UsuarioService');

class AdministradorAreaController {
  static async registrarDoctor(req, res, next) {
    try {
      const doctor = await UsuarioService.registrarDoctor(req.usuario, req.body);
      res.status(201).json({ ok: true, doctor });
    } catch (err) {
      next(err);
    }
  }

  static async registrarRecepcionista(req, res, next) {
    try {
      const recepcionista = await UsuarioService.registrarRecepcionista(req.usuario, req.body);
      res.status(201).json({ ok: true, recepcionista });
    } catch (err) {
      next(err);
    }
  }

  static async registrarPaciente(req, res, next) {
    try {
      const paciente = await UsuarioService.registrarPacientePorAdmin(req.usuario, req.body);
      res.status(201).json({ ok: true, paciente });
    } catch (err) {
      next(err);
    }
  }

  static async listarPersonal(req, res, next) {
    try {
      const personal = await UsuarioService.listarPersonalPorArea(req.usuario.idEspecialidad);
      res.json({ ok: true, ...personal });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdministradorAreaController;
