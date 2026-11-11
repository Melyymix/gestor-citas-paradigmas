'use strict';

const crypto = require('crypto');
const Database = require('../config/database');
const Usuario = require('../models/Usuario');
const DirectorGeneral = require('../models/DirectorGeneral');
const AdministradorArea = require('../models/AdministradorArea');

class AuthService {
  static async #cargarUsuarioPorCorreo(correo) {
    const rows = await Database.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.password_hash, u.rol, u.activo,
              aa.id_especialidad AS admin_id_especialidad, ea.nombre AS admin_especialidad,
              d.id_especialidad AS doctor_id_especialidad, ed.nombre AS doctor_especialidad, d.cedula_profesional,
              r.id_especialidad AS recep_id_especialidad, r.permiso_cancelacion_especial,
              p.curp
       FROM usuarios u
       LEFT JOIN administradores_area aa ON aa.id_usuario = u.id_usuario
       LEFT JOIN especialidades ea ON ea.id_especialidad = aa.id_especialidad
       LEFT JOIN doctores d ON d.id_usuario = u.id_usuario
       LEFT JOIN especialidades ed ON ed.id_especialidad = d.id_especialidad
       LEFT JOIN recepcionistas r ON r.id_usuario = u.id_usuario
       LEFT JOIN pacientes p ON p.id_usuario = u.id_usuario
       WHERE u.correo = ?
       LIMIT 1`,
      [String(correo).trim().toLowerCase()]
    );
    return rows[0] || null;
  }

  static #instanciarRol(row) {
    const base = {
      idUsuario: row.id_usuario,
      nombre: row.nombre,
      correo: row.correo,
      telefono: row.telefono,
      password: row.password_hash,
      rol: row.rol,
      activo: row.activo,
    };

    if (row.rol === 'DIRECTOR_GENERAL') {
      return new DirectorGeneral(base);
    }
    if (row.rol === 'ADMIN_AREA') {
      return new AdministradorArea({
        ...base,
        idEspecialidad: row.admin_id_especialidad,
        areaEspecialidad: row.admin_especialidad || '',
      });
    }
    return new Usuario(base);
  }

  static #perfilDesdeRow(row) {
    const perfil = AuthService.#instanciarRol(row).toJSON();
    if (row.rol === 'DOCTOR') {
      perfil.idEspecialidad = row.doctor_id_especialidad;
      perfil.especialidad = row.doctor_especialidad;
      perfil.cedulaProfesional = row.cedula_profesional;
    } else if (row.rol === 'RECEPCIONISTA') {
      perfil.idEspecialidad = row.recep_id_especialidad;
      perfil.permisoCancelacionEspecial = Boolean(row.permiso_cancelacion_especial);
    } else if (row.rol === 'PACIENTE') {
      perfil.curp = row.curp;
    }
    return perfil;
  }

  static async iniciarSesion(correo, password) {
    if (!correo || !password) {
      throw Object.assign(new Error('Ingresa correo electrónico y contraseña'), { statusCode: 400 });
    }

    const row = await AuthService.#cargarUsuarioPorCorreo(correo);
    if (!row) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }

    const instancia = AuthService.#instanciarRol(row);
    if (!instancia.iniciarSesion(correo, password)) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
    }

    const token = crypto.randomBytes(48).toString('hex');
    await Database.query(
      `INSERT INTO sesiones (token, id_usuario, activa, expira_en)
       VALUES (?, ?, 1, DATE_ADD(NOW(), INTERVAL 12 HOUR))`,
      [token, row.id_usuario]
    );

    return {
      token,
      usuario: AuthService.#perfilDesdeRow(row),
    };
  }

  static async cerrarSesion(token) {
    if (!token) return;
    await Database.query('UPDATE sesiones SET activa = 0 WHERE token = ?', [token]);
  }

  static async validarToken(token) {
    if (!token) return null;
    const rows = await Database.query(
      `SELECT u.id_usuario, u.nombre, u.correo, u.telefono, u.password_hash, u.rol, u.activo,
              aa.id_especialidad AS admin_id_especialidad, ea.nombre AS admin_especialidad,
              d.id_especialidad AS doctor_id_especialidad, ed.nombre AS doctor_especialidad, d.cedula_profesional,
              r.id_especialidad AS recep_id_especialidad, r.permiso_cancelacion_especial,
              p.curp
       FROM sesiones s
       INNER JOIN usuarios u ON u.id_usuario = s.id_usuario
       LEFT JOIN administradores_area aa ON aa.id_usuario = u.id_usuario
       LEFT JOIN especialidades ea ON ea.id_especialidad = aa.id_especialidad
       LEFT JOIN doctores d ON d.id_usuario = u.id_usuario
       LEFT JOIN especialidades ed ON ed.id_especialidad = d.id_especialidad
       LEFT JOIN recepcionistas r ON r.id_usuario = u.id_usuario
       LEFT JOIN pacientes p ON p.id_usuario = u.id_usuario
       WHERE s.token = ? AND s.activa = 1 AND s.expira_en > NOW() AND u.activo = 1
       LIMIT 1`,
      [token]
    );
    if (!rows[0]) return null;
    return AuthService.#perfilDesdeRow(rows[0]);
  }

  static async registrarPacientePropio(datos) {
    const paciente = new Usuario({ ...datos, rol: 'PACIENTE' });
    paciente.validarDatosBasicos();

    const curp = datos.curp ? String(datos.curp).trim().toUpperCase() : '';
    if (!curp || curp.length !== 18) {
      throw Object.assign(new Error('La CURP es obligatoria y debe tener 18 caracteres'), { statusCode: 400 });
    }

    const passwordHash = Usuario.hashPassword(datos.password);
    const conn = await Database.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute(
        `SELECT u.id_usuario FROM usuarios u
         LEFT JOIN pacientes p ON p.id_usuario = u.id_usuario
         WHERE u.correo = ? OR p.curp = ?
         LIMIT 1`,
        [paciente.correo, curp]
      );
      if (existing.length > 0) {
        throw Object.assign(new Error('El correo o la CURP ya se encuentran registrados'), { statusCode: 409 });
      }

      const [resUser] = await conn.execute(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, 'PACIENTE')`,
        [paciente.nombre, paciente.correo, paciente.telefono, passwordHash]
      );
      const idUsuario = resUser.insertId;

      await conn.execute(
        'INSERT INTO pacientes (id_usuario, curp) VALUES (?, ?)',
        [idUsuario, curp]
      );

      await conn.commit();
      paciente.idUsuario = idUsuario;
      return { ...paciente.toJSON(), curp };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static extraerToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  }

  static requerirAuth(req, res, next) {
    const token = AuthService.extraerToken(req);
    if (!token) {
      return res.status(401).json({ ok: false, mensaje: 'Sesión requerida' });
    }
    AuthService.validarToken(token)
      .then((usuario) => {
        if (!usuario) {
          return res.status(401).json({ ok: false, mensaje: 'Sesión inválida o expirada' });
        }
        req.token = token;
        req.usuario = usuario;
        next();
      })
      .catch(next);
  }

  static requerirRol(...rolesPermitidos) {
    return (req, res, next) => {
      if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para esta operación' });
      }
      next();
    };
  }
}

module.exports = AuthService;
