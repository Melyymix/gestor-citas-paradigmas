'use strict';

const HORAS_MIN_ANTICIPACION = 48;
const DURACION_CITA_MIN = 30;
const ESTADO_INICIAL = 'AGENDADA/PENDIENTE DE PAGO';
const MS_POR_MIN = 60 * 1000;
const MS_POR_HORA = 60 * MS_POR_MIN;

// Funciones Auxiliares Puras
const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const minutosDelDia = (fecha) => fecha.getHours() * 60 + fecha.getMinutes();

const finDeCita = (inicio) => new Date(inicio.getTime() + DURACION_CITA_MIN * MS_POR_MIN);

const seTraslapan = (inicioA, inicioB) =>
  inicioA < finDeCita(inicioB) && inicioB < finDeCita(inicioA);

const horasDeAnticipacion = (inicio, ahora) =>
  (inicio.getTime() - ahora.getTime()) / MS_POR_HORA;

// Reglas de Validación
const validarCampos = (s) => [
  ...(s.idPaciente == null ? ['Falta el ID del paciente'] : []),
  ...(s.idDoctor == null ? ['Falta el ID del doctor'] : []),
  ...(!(s.inicio instanceof Date) || Number.isNaN(s.inicio.getTime())
    ? ['Falta la fecha y hora de la cita o no es válida']
    : []),
];

const reglaFechaNoPasada = (s, { ahora }) =>
  horasDeAnticipacion(s.inicio, ahora) < 0
    ? ['La fecha de la cita no puede ser pasada']
    : [];

const reglaAnticipacion = (s, { ahora }) => {
  const horas = horasDeAnticipacion(s.inicio, ahora);
  return horas >= 0 && horas < HORAS_MIN_ANTICIPACION
    ? [`La cita requiere al menos ${HORAS_MIN_ANTICIPACION} horas de anticipación`]
    : [];
};

const reglaHorarioLaboral = (s, { horarioDoctor }) => {
  const inicio = minutosDelDia(s.inicio);
  const dentro = horarioDoctor.some(
    (b) =>
      b.dia === s.inicio.getDay() &&
      inicio >= aMinutos(b.desde) &&
      inicio + DURACION_CITA_MIN <= aMinutos(b.hasta)
  );
  return dentro
    ? []
    : ['El horario solicitado está fuera del horario laboral del doctor'];
};

const reglaSinEmpalme = (s, { citasOcupadas }) =>
  citasOcupadas
    .filter((c) => c.idDoctor === s.idDoctor && c.estado !== 'CANCELADA')
    .some((c) => seTraslapan(s.inicio, c.inicio))
    ? ['El doctor ya tiene una cita en ese horario']
    : [];

const REGLAS = [
  reglaFechaNoPasada,
  reglaAnticipacion,
  reglaHorarioLaboral,
  reglaSinEmpalme,
];

const construirCita = (s) =>
  Object.freeze({
    idPaciente: s.idPaciente,
    idDoctor: s.idDoctor,
    inicio: new Date(s.inicio.getTime()),
    duracionMin: DURACION_CITA_MIN,
    estado: ESTADO_INICIAL,
  });

const aceptar = (cita) => Object.freeze({ ok: true, cita });
const rechazar = (motivos) => Object.freeze({ ok: false, motivos: Object.freeze(motivos) });

// Función Principal
const agendarCita = (solicitud, contexto) => {
  const errores = validarCampos(solicitud);
  if (errores.length > 0) return rechazar(errores);

  const motivos = REGLAS.flatMap((regla) => regla(solicitud, contexto));
  return motivos.length === 0 ? aceptar(construirCita(solicitud)) : rechazar(motivos);
};

module.exports = {
  agendarCita,
  ESTADO_INICIAL,
  HORAS_MIN_ANTICIPACION,
  DURACION_CITA_MIN,
};