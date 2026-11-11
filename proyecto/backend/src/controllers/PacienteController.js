'use strict';

const Database = require('../config/database');

class PacienteController {
  // GET /api/pacientes/mis-citas
  static async obtenerMisCitas(req, res) {
    try {
      const idPaciente = req.usuario.idUsuario;
      const citas = await Database.query(
        `SELECT c.id_cita, c.fecha_hora, c.duracion_min, c.estado, c.monto_anticipo, c.monto_total, c.referencia_bancaria, c.reembolso,
          u.nombre AS nombre_doctor, e.nombre AS especialidad
        FROM citas_medicas c
        JOIN doctores d ON c.id_doctor = d.id_usuario
        JOIN usuarios u ON d.id_usuario = u.id_usuario
        JOIN especialidades e ON d.id_especialidad = e.id_especialidad
        WHERE c.id_paciente = ?
        ORDER BY c.fecha_hora DESC`,
        [idPaciente]
      );

      res.json({ ok: true, citas });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }

  // GET /api/pacientes/perfil
  static async obtenerPerfil(req, res) {
    try {
      const idPaciente = req.usuario.idUsuario;
      const rows = await Database.query(
        `SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.rol, p.curp
        FROM usuarios u
        JOIN pacientes p ON u.id_usuario = p.id_usuario
        WHERE u.id_usuario = ?`,
        [idPaciente]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Paciente no encontrado' });
      }

      res.json({ ok: true, paciente: rows[0] });
    } catch (error) {
      res.status(error.statusCode || 500).json({ ok: false, error: error.message });
    }
  }
}

module.exports = PacienteController;