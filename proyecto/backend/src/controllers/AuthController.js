'use strict';

const AuthService = require('../services/AuthService');
const UsuarioService = require('../services/UsuarioService');

class AuthController {
  static async login(req, res, next) {
    try {
      const { correo, password } = req.body;
      const sesion = await AuthService.iniciarSesion(correo, password);
      res.json({ ok: true, ...sesion });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      await AuthService.cerrarSesion(req.token);
      res.json({ ok: true, mensaje: 'Sesión cerrada correctamente' });
    } catch (err) {
      next(err);
    }
  }

  static async registroPaciente(req, res, next) {
    try {
      const paciente = await AuthService.registrarPacientePropio(req.body);
      res.status(201).json({ ok: true, usuario: paciente });
    } catch (err) {
      next(err);
    }
  }

  static async perfil(req, res) {
    res.json({ ok: true, usuario: req.usuario });
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

module.exports = AuthController;
