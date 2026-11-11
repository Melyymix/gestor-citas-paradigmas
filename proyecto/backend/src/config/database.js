'use strict';

const mysql = require('mysql2/promise');

class Database {
  static #pool = null;

  static getPool() {
    if (!Database.#pool) {
      Database.#pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'citas_user',
        password: process.env.DB_PASSWORD || 'citas_pass',
        database: process.env.DB_NAME || 'gestor_citas_medicas',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
      });
    }
    return Database.#pool;
  }

  static async query(sql, params = []) {
    const [rows] = await Database.getPool().execute(sql, params);
    return rows;
  }

  static async getConnection() {
    return Database.getPool().getConnection();
  }

  static async testConnection() {
    const [row] = await Database.query('SELECT 1 AS ok');
    return row && row.ok === 1;
  }
}

module.exports = Database;
