-- Tabla de Consultas Médicas
CREATE TABLE IF NOT EXISTS consultas_medicas (
  id_consulta INT AUTO_INCREMENT PRIMARY KEY,
  id_cita INT NOT NULL UNIQUE,
  motivo VARCHAR(255) NOT NULL,
  diagnostico TEXT NOT NULL,
  observaciones TEXT NULL,
  receta_medicamentos TEXT NULL,
  receta_dosis TEXT NULL,
  receta_indicaciones TEXT NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_cita) REFERENCES citas_medicas(id_cita) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario Doctor de Prueba (Doctor House)
INSERT IGNORE INTO usuarios (id_usuario, nombre, correo, telefono, password_hash, rol, activo)
VALUES (2, 'Dr. Gregory House', 'house@hospital.com', '5599887766', 'd7441d6a48b275fe51bdf28581eb5890:7f50962861dd2f8efed2a9c2c8339d2bce22aa974f8d594ff49dc81af6c808c77f082b72174dedf17365fd6e7ede1ea05cf57223aca883a404646b63b5a71625', 'DOCTOR', 1);

INSERT IGNORE INTO doctores (id_usuario, id_especialidad, cedula_profesional)
VALUES (2, 1, 'CED-99887766');