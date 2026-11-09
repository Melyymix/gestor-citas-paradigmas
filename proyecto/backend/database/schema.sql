SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS gestor_citas_medicas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestor_citas_medicas;

CREATE TABLE IF NOT EXISTS especialidades (
  id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('DIRECTOR_GENERAL', 'ADMIN_AREA', 'DOCTOR', 'RECEPCIONISTA', 'PACIENTE') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS administradores_area (
  id_usuario INT PRIMARY KEY,
  id_especialidad INT NOT NULL,
  CONSTRAINT fk_admin_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_admin_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE IF NOT EXISTS doctores (
  id_usuario INT PRIMARY KEY,
  id_especialidad INT NOT NULL,
  cedula_profesional VARCHAR(30) NULL UNIQUE,
  CONSTRAINT fk_doctor_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE IF NOT EXISTS horarios_doctor (
  id_horario INT AUTO_INCREMENT PRIMARY KEY,
  id_doctor INT NOT NULL,
  dia_semana TINYINT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  CONSTRAINT fk_horario_doctor FOREIGN KEY (id_doctor) REFERENCES doctores(id_usuario) ON DELETE CASCADE,
  CONSTRAINT chk_horario_rango CHECK (hora_inicio < hora_fin),
  INDEX idx_horario_doctor_dia (id_doctor, dia_semana)
);

CREATE TABLE IF NOT EXISTS recepcionistas (
  id_usuario INT PRIMARY KEY,
  id_especialidad INT NULL,
  permiso_cancelacion_especial TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_recepcionista_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_recepcionista_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades(id_especialidad)
);

CREATE TABLE IF NOT EXISTS pacientes (
  id_usuario INT PRIMARY KEY,
  curp VARCHAR(18) NOT NULL UNIQUE,
  CONSTRAINT fk_paciente_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sesiones (
  token VARCHAR(128) PRIMARY KEY,
  id_usuario INT NOT NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  expira_en DATETIME NOT NULL,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  INDEX idx_sesion_usuario (id_usuario, activa)
);

CREATE TABLE IF NOT EXISTS citas_medicas (
  id_cita INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente INT NOT NULL,
  id_doctor INT NOT NULL,
  id_recepcionista INT NULL,
  fecha_hora DATETIME NOT NULL,
  duracion_min INT NOT NULL DEFAULT 30,
  estado ENUM('AGENDADA/PENDIENTE DE PAGO', 'PAGADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'AGENDADA/PENDIENTE DE PAGO',
  cancelada_por VARCHAR(30) NULL,
  motivo_cancelacion VARCHAR(255) NULL,
  monto_anticipo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monto_total DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  referencia_bancaria VARCHAR(64) NULL,
  reembolso DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  slot_activo DATETIME GENERATED ALWAYS AS (IF(estado <> 'CANCELADA', fecha_hora, NULL)) STORED,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cita_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes(id_usuario),
  CONSTRAINT fk_cita_doctor FOREIGN KEY (id_doctor) REFERENCES doctores(id_usuario),
  CONSTRAINT fk_cita_recepcionista FOREIGN KEY (id_recepcionista) REFERENCES recepcionistas(id_usuario),
  UNIQUE KEY uq_doctor_slot_activo (id_doctor, slot_activo),
  INDEX idx_cita_paciente (id_paciente, fecha_hora),
  INDEX idx_cita_doctor_estado (id_doctor, estado, fecha_hora)
);

CREATE TABLE IF NOT EXISTS consultas_medicas (
  id_consulta INT AUTO_INCREMENT PRIMARY KEY,
  id_cita INT NOT NULL UNIQUE,
  motivo TEXT NOT NULL,
  diagnostico TEXT NOT NULL,
  observaciones TEXT NULL,
  receta_medicamentos TEXT NULL,
  receta_dosis TEXT NULL,
  receta_indicaciones TEXT NULL,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_cita FOREIGN KEY (id_cita) REFERENCES citas_medicas(id_cita) ON DELETE CASCADE
);

INSERT IGNORE INTO especialidades (nombre, descripcion) VALUES
  ('Medicina General', 'Atención médica primaria y preventiva'),
  ('Cardiología', 'Diagnóstico y tratamiento cardiovascular'),
  ('Pediatría', 'Atención médica infantil y juvenil'),
  ('Dermatología', 'Cuidado clínico de la piel'),
  ('Ginecología', 'Salud integral femenina');

INSERT IGNORE INTO usuarios (id_usuario, nombre, correo, telefono, password_hash, rol) VALUES
  (1, 'Director General ESCOM', 'director@escom.mx', '5512345678', 'd7441d6a48b275fe51bdf28581eb5890:7f50962861dd2f8efed2a9c2c8339d2bce22aa974f8d594ff49dc81af6c808c77f082b72174dedf17365fd6e7ede1ea05cf57223aca883a404646b63b5a71625', 'DIRECTOR_GENERAL');
