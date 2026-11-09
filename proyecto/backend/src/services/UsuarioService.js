'use strict';

const Database = require('../config/database');
const Usuario = require('../models/Usuario');
const DirectorGeneral = require('../models/DirectorGeneral');
const AdministradorArea = require('../models/AdministradorArea');

class UsuarioService {
  static async listarEspecialidades() {
    return Database.query(
      'SELECT id_especialidad AS idEspecialidad, nombre, descripcion FROM especialidades WHERE activa = 1 ORDER BY nombre'
    );
  }

  static async crearCuentaDirector(datos) {
    const director = new DirectorGeneral(datos);
    director.crearCuentaPropia();

    const passwordHash = Usuario.hashPassword(datos.password);
    const existentes = await Database.query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [
      director.correo,
    ]);
    if (existentes.length > 0) {
      throw Object.assign(new Error('El correo ya está registrado'), { statusCode: 409 });
    }

    const result = await Database.query(
      `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
       VALUES (?, ?, ?, ?, 'DIRECTOR_GENERAL')`,
      [director.nombre, director.correo, director.telefono, passwordHash]
    );
    director.idUsuario = result.insertId;
    return director.toJSON();
  }

  static async registrarAdministradorArea(directorAuth, datos) {
    const idEspecialidad = Number(datos.idEspecialidad);
    const especialidades = await Database.query(
      'SELECT id_especialidad AS idEspecialidad, nombre FROM especialidades WHERE id_especialidad = ? AND activa = 1 LIMIT 1',
      [idEspecialidad]
    );
    if (!especialidades[0]) {
      throw Object.assign(new Error('El área de especialidad seleccionada no existe'), { statusCode: 400 });
    }

    const director = new DirectorGeneral(directorAuth);
    const admin = director.registrarAdminArea(datos, especialidades[0]);
    const passwordHash = Usuario.hashPassword(datos.password);

    const conn = await Database.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [
        admin.correo,
      ]);
      if (existing.length > 0) {
        throw Object.assign(new Error('El correo ya se encuentra registrado'), { statusCode: 409 });
      }

      const [resUser] = await conn.execute(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, 'ADMIN_AREA')`,
        [admin.nombre, admin.correo, admin.telefono, passwordHash]
      );
      const idUsuario = resUser.insertId;

      await conn.execute(
        'INSERT INTO administradores_area (id_usuario, id_especialidad) VALUES (?, ?)',
        [idUsuario, admin.idEspecialidad]
      );

      await conn.commit();
      admin.idUsuario = idUsuario;
      return admin.toJSON();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async listarAdministradoresArea() {
    return Database.query(
      `SELECT u.id_usuario AS idUsuario, u.nombre, u.correo, u.telefono, u.rol, u.activo,
              e.id_especialidad AS idEspecialidad, e.nombre AS areaEspecialidad
       FROM usuarios u
       INNER JOIN administradores_area aa ON aa.id_usuario = u.id_usuario
       INNER JOIN especialidades e ON e.id_especialidad = aa.id_especialidad
       ORDER BY u.id_usuario DESC`
    );
  }

  static async registrarDoctor(adminAuth, datos) {
    const admin = new AdministradorArea(adminAuth);
    const payload = admin.registrarDoctor(datos);
    const passwordHash = Usuario.hashPassword(datos.password);

    const conn = await Database.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [
        payload.usuario.correo,
      ]);
      if (existing.length > 0) {
        throw Object.assign(new Error('El correo ya se encuentra registrado'), { statusCode: 409 });
      }

      if (payload.cedulaProfesional) {
        const [dupCedula] = await conn.execute(
          'SELECT id_usuario FROM doctores WHERE cedula_profesional = ? LIMIT 1',
          [payload.cedulaProfesional]
        );
        if (dupCedula.length > 0) {
          throw Object.assign(new Error('La cédula profesional ya está registrada'), { statusCode: 409 });
        }
      }

      const [resUser] = await conn.execute(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, 'DOCTOR')`,
        [payload.usuario.nombre, payload.usuario.correo, payload.usuario.telefono, passwordHash]
      );
      const idUsuario = resUser.insertId;

      await conn.execute(
        'INSERT INTO doctores (id_usuario, id_especialidad, cedula_profesional) VALUES (?, ?, ?)',
        [idUsuario, payload.idEspecialidad, payload.cedulaProfesional]
      );

      for (const h of payload.horarios) {
        const dia = Number(h.diaSemana);
        if (Number.isInteger(dia) && dia >= 0 && dia <= 6 && h.horaInicio && h.horaFin) {
          await conn.execute(
            'INSERT INTO horarios_doctor (id_doctor, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
            [idUsuario, dia, h.horaInicio, h.horaFin]
          );
        }
      }

      await conn.commit();
      payload.usuario.idUsuario = idUsuario;
      return {
        ...payload.usuario.toJSON(),
        idEspecialidad: payload.idEspecialidad,
        areaEspecialidad: admin.areaEspecialidad,
        cedulaProfesional: payload.cedulaProfesional,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async registrarRecepcionista(adminAuth, datos) {
    const admin = new AdministradorArea(adminAuth);
    const payload = admin.registrarRecepcionista(datos);
    const passwordHash = Usuario.hashPassword(datos.password);

    const conn = await Database.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [
        payload.usuario.correo,
      ]);
      if (existing.length > 0) {
        throw Object.assign(new Error('El correo ya se encuentra registrado'), { statusCode: 409 });
      }

      const [resUser] = await conn.execute(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, 'RECEPCIONISTA')`,
        [payload.usuario.nombre, payload.usuario.correo, payload.usuario.telefono, passwordHash]
      );
      const idUsuario = resUser.insertId;

      await conn.execute(
        'INSERT INTO recepcionistas (id_usuario, id_especialidad, permiso_cancelacion_especial) VALUES (?, ?, ?)',
        [idUsuario, payload.idEspecialidad, payload.permisoCancelacionEspecial ? 1 : 0]
      );

      await conn.commit();
      payload.usuario.idUsuario = idUsuario;
      return {
        ...payload.usuario.toJSON(),
        idEspecialidad: payload.idEspecialidad,
        permisoCancelacionEspecial: payload.permisoCancelacionEspecial,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async registrarPacientePorAdmin(adminAuth, datos) {
    const admin = new AdministradorArea(adminAuth);
    const payload = admin.registrarPaciente(datos);
    const passwordHash = Usuario.hashPassword(datos.password);

    const conn = await Database.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute(
        `SELECT u.id_usuario FROM usuarios u
         LEFT JOIN pacientes p ON p.id_usuario = u.id_usuario
         WHERE u.correo = ? OR p.curp = ?
         LIMIT 1`,
        [payload.usuario.correo, payload.curp]
      );
      if (existing.length > 0) {
        throw Object.assign(new Error('El correo o la CURP ya se encuentran registrados'), { statusCode: 409 });
      }

      const [resUser] = await conn.execute(
        `INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol)
         VALUES (?, ?, ?, ?, 'PACIENTE')`,
        [payload.usuario.nombre, payload.usuario.correo, payload.usuario.telefono, passwordHash]
      );
      const idUsuario = resUser.insertId;

      await conn.execute(
        'INSERT INTO pacientes (id_usuario, curp) VALUES (?, ?)',
        [idUsuario, payload.curp]
      );

      await conn.commit();
      payload.usuario.idUsuario = idUsuario;
      return {
        ...payload.usuario.toJSON(),
        curp: payload.curp,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async listarPersonalPorArea(idEspecialidad) {
    const doctores = await Database.query(
      `SELECT u.id_usuario AS idUsuario, u.nombre, u.correo, u.telefono,
              d.cedula_profesional AS cedulaProfesional, e.nombre AS especialidad
       FROM usuarios u
       INNER JOIN doctores d ON d.id_usuario = u.id_usuario
       INNER JOIN especialidades e ON e.id_especialidad = d.id_especialidad
       WHERE d.id_especialidad = ?
       ORDER BY u.id_usuario DESC`,
      [idEspecialidad]
    );

    const recepcionistas = await Database.query(
      `SELECT u.id_usuario AS idUsuario, u.nombre, u.correo, u.telefono,
              r.permiso_cancelacion_especial AS permisoCancelacionEspecial
       FROM usuarios u
       INNER JOIN recepcionistas r ON r.id_usuario = u.id_usuario
       WHERE r.id_especialidad = ?
       ORDER BY u.id_usuario DESC`,
      [idEspecialidad]
    );

    const pacientes = await Database.query(
      `SELECT u.id_usuario AS idUsuario, u.nombre, u.correo, u.telefono, p.curp
       FROM usuarios u
       INNER JOIN pacientes p ON p.id_usuario = u.id_usuario
       ORDER BY u.id_usuario DESC`
    );

    return { doctores, recepcionistas, pacientes };
  }
}

module.exports = UsuarioService;
