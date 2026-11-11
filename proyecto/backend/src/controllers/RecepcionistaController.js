'use strict';

const Database = require('../config/database');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

class RecepcionistaController {
  // POST /api/recepcion/pacientes (Registro manual de paciente en recepción)
  static async registrarPaciente(req, res) {
    try {
      const { nombre, correo, telefono, password, curp } = req.body;
      const paciente = new Paciente({ nombre, correo, telefono, password, curp });
      paciente.validarDatos();

      const passHash = Usuario.hashPassword(password);

      // Inserción en la tabla usuarios y pacientes
      const resultUser = await Database.query(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol) VALUES (?, ?, ?, ?, 'PACIENTE')`,
        [paciente.nombre, paciente.correo, paciente.telefono, passHash]
      );

      const idUsuario = resultUser.insertId;
      await Database.query(`INSERT INTO pacientes (id_usuario, curp) VALUES (?, ?)`, [idUsuario, paciente.curp]);

      paciente.idUsuario = idUsuario;
      res.status(201).json({ ok: true, mensaje: 'Paciente registrado exitosamente por Recepción', paciente });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ ok: false, error: 'El correo o CURP ya se encuentra registrado' });
      }
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/recepcion/catalogos/doctores?especialidadId=X
  static async consultarDoctoresPorEspecialidad(req, res) {
    try {
      const { especialidadId } = req.query;
      let query = `
        SELECT d.id_usuario AS id_doctor, u.nombre, e.id_especialidad, e.nombre AS especialidad
        FROM doctores d
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        JOIN especialidades e ON d.id_especialidad = e.id_especialidad
        WHERE u.activo = 1
      `;
      const params = [];

      if (especialidadId) {
        query += ` AND d.id_especialidad = ?`;
        params.push(especialidadId);
      }

      const doctores = await Database.query(query, params);
      res.json({ ok: true, doctores });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/recepcion/horarios-doctor/:idDoctor
  static async consultarHorariosDoctor(req, res) {
    try {
      const { idDoctor } = req.params;
      const horarios = await Database.query(
        `SELECT id_horario, dia_semana, hora_inicio, hora_fin 
        FROM horarios_doctor 
        WHERE id_doctor = ? 
        ORDER BY dia_semana, hora_inicio`,
        [idDoctor]
      );
      res.json({ ok: true, horarios });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }
}

module.exports = RecepcionistaController;