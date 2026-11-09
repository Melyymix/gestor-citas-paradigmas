'use strict';

const crypto = require('crypto');

class Usuario {
  constructor({ idUsuario = null, nombre, correo, telefono, password = null, rol, activo = true }) {
    this._idUsuario = idUsuario;
    this._nombre = nombre ? String(nombre).trim() : '';
    this._correo = correo ? String(correo).trim().toLowerCase() : '';
    this._telefono = telefono ? String(telefono).trim() : '';
    this._password = password;
    this._rol = rol;
    this._activo = Boolean(activo);
  }

  get idUsuario() {
    return this._idUsuario;
  }

  set idUsuario(id) {
    this._idUsuario = id;
  }

  get nombre() {
    return this._nombre;
  }

  get correo() {
    return this._correo;
  }

  get telefono() {
    return this._telefono;
  }

  get rol() {
    return this._rol;
  }

  get activo() {
    return this._activo;
  }

  static errorValidacion(mensaje) {
    return Object.assign(new Error(mensaje), { statusCode: 400 });
  }

  static hashPassword(plainPassword) {
    if (!plainPassword || String(plainPassword).length < 6) {
      throw Usuario.errorValidacion('La contraseña debe tener al menos 6 caracteres');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  static verifyPassword(plainPassword, storedHash) {
    if (!plainPassword || !storedHash || !storedHash.includes(':')) {
      return false;
    }
    const [salt, key] = storedHash.split(':');
    const derived = crypto.scryptSync(String(plainPassword), salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (derived.length !== keyBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(derived, keyBuf);
  }

  validarDatosBasicos({ exigirPassword = true } = {}) {
    if (!this._nombre) throw Usuario.errorValidacion('El nombre es obligatorio');
    if (!this._correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this._correo)) {
      throw Usuario.errorValidacion('El correo electrónico no es válido');
    }
    if (!this._telefono || this._telefono.length < 8) {
      throw Usuario.errorValidacion('El teléfono debe tener al menos 8 dígitos');
    }
    if (exigirPassword && (!this._password || String(this._password).length < 6)) {
      throw Usuario.errorValidacion('La contraseña debe tener al menos 6 caracteres');
    }
  }

  iniciarSesion(correo, password) {
    if (!this._activo) return false;
    if (!correo || this._correo !== String(correo).trim().toLowerCase()) {
      return false;
    }
    return Usuario.verifyPassword(password, this._password);
  }

  cerrarSesion() {
    return true;
  }

  toJSON() {
    return {
      idUsuario: this._idUsuario,
      nombre: this._nombre,
      correo: this._correo,
      telefono: this._telefono,
      rol: this._rol,
      activo: this._activo,
    };
  }
}

module.exports = Usuario;
