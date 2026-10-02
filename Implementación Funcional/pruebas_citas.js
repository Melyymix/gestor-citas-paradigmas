'use strict';

const { agendarCita, ESTADO_INICIAL } = require('./citas');
const AHORA_BASE = new Date(2026, 9, 5, 10, 0, 0);
const HORARIO_DOCTOR_2 = [1, 2, 3, 4, 5].map((dia) =>
  Object.freeze({ dia, desde: '09:00', hasta: '15:00' })
);

// Citas existentes en base de datos
const CITAS_OCUPADAS = [
  Object.freeze({
    idDoctor: 2,
    inicio: new Date(2026, 9, 8, 11, 0, 0),
    estado: 'AGENDADA/PENDIENTE DE PAGO',
  }),
  Object.freeze({
    idDoctor: 2,
    inicio: new Date(2026, 9, 8, 12, 0, 0),
    estado: 'CANCELADA',
  }),
  Object.freeze({
    idDoctor: 3,
    inicio: new Date(2026, 9, 8, 13, 0, 0), 
    estado: 'PAGADA',
  }),
];

const contextoBase = Object.freeze({
  ahora: AHORA_BASE,
  horarioDoctor: HORARIO_DOCTOR_2,
  citasOcupadas: CITAS_OCUPADAS,
});

const pruebas = [
  {
    id: 'PF-01',
    descripcion: 'Cita válida (Jue 08-oct 10:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 8, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === true && res.cita.estado === ESTADO_INICIAL;
    },
    esperado: `Aceptada (estado ${ESTADO_INICIAL})`,
  },
  {
    id: 'PF-02',
    descripcion: 'Fecha pasada (Vie 02-oct 10:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 2, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('La fecha de la cita no puede ser pasada');
    },
    esperado: 'Rechazada: La fecha de la cita no puede ser pasada',
  },
  {
    id: 'PF-03',
    descripcion: 'Menos de 48 h - 24 h (Mar 06-oct 10:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 6, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('La cita requiere al menos 48 horas de anticipación');
    },
    esperado: 'Rechazada: La cita requiere al menos 48 horas de anticipación',
  },
  {
    id: 'PF-04',
    descripcion: 'Límite exacto de 48 h (Mié 07-oct 10:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 7, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === true && res.cita.estado === ESTADO_INICIAL;
    },
    esperado: `Aceptada (estado ${ESTADO_INICIAL})`,
  },
  {
    id: 'PF-05',
    descripcion: 'Límite: 47 h 30 min (Mié 07-oct 09:30)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 7, 9, 30, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('La cita requiere al menos 48 horas de anticipación');
    },
    esperado: 'Rechazada: La cita requiere al menos 48 horas de anticipación',
  },
  {
    id: 'PF-06',
    descripcion: 'Horario ya ocupado (Jue 08-oct 11:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 8, 11, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('El doctor ya tiene una cita en ese horario');
    },
    esperado: 'Rechazada: El doctor ya tiene una cita en ese horario',
  },
  {
    id: 'PF-07',
    descripcion: 'Horario con cita CANCELADA (Jue 08-oct 12:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 8, 12, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === true && res.cita.estado === ESTADO_INICIAL;
    },
    esperado: `Aceptada (estado ${ESTADO_INICIAL})`,
  },
  {
    id: 'PF-08',
    descripcion: 'Mismo horario, otro doctor ocupado (Jue 08-oct 13:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 8, 13, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === true && res.cita.estado === ESTADO_INICIAL;
    },
    esperado: `Aceptada (estado ${ESTADO_INICIAL})`,
  },
  {
    id: 'PF-09',
    descripcion: 'Fuera de horario laboral (Jue 08-oct 16:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 8, 16, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('El horario solicitado está fuera del horario laboral del doctor');
    },
    esperado: 'Rechazada: El horario solicitado está fuera del horario laboral del doctor',
  },
  {
    id: 'PF-10',
    descripcion: 'Día no laborable (Sáb 10-oct 10:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 10, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('El horario solicitado está fuera del horario laboral del doctor');
    },
    esperado: 'Rechazada: El horario solicitado está fuera del horario laboral del doctor',
  },
  {
    id: 'PF-11',
    descripcion: 'Datos incompletos (Sin ID de doctor)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: null,
        inicio: new Date(2026, 9, 8, 10, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      return res.ok === false && res.motivos.includes('Falta el ID del doctor');
    },
    esperado: 'Rechazada: Falta el ID del doctor',
  },
  {
    id: 'PF-12',
    descripcion: 'Varios motivos a la vez (Mar 06-oct 18:00)',
    ejecutar: () => {
      const solicitud = {
        idPaciente: 101,
        idDoctor: 2,
        inicio: new Date(2026, 9, 6, 18, 0, 0),
      };
      const res = agendarCita(solicitud, contextoBase);
      const tieneAnticipacion = res.motivos.includes('La cita requiere al menos 48 horas de anticipación');
      const tieneFueraHorario = res.motivos.includes('El horario solicitado está fuera del horario laboral del doctor');
      return res.ok === false && tieneAnticipacion && tieneFueraHorario;
    },
    esperado: 'Rechazada: Anticipación (<48h) + Fuera de horario',
  },
  {
    id: 'PF-13',
    descripcion: 'Pureza: entradas congeladas y resultado repetible',
    ejecutar: () => {
      const solicitudInmutable = Object.freeze({
        idPaciente: 101,
        idDoctor: 2,
        inicio: Object.freeze(new Date(2026, 9, 8, 10, 0, 0)),
      });

      const res1 = agendarCita(solicitudInmutable, contextoBase);
      const res2 = agendarCita(solicitudInmutable, contextoBase);

      const repetible =
        res1.ok === res2.ok &&
        res1.cita.inicio.getTime() === res2.cita.inicio.getTime() &&
        res1.cita.estado === res2.cita.estado;

      return res1.ok === true && repetible;
    },
    esperado: `Aceptada (estado ${ESTADO_INICIAL}) y ejecución idempotente`,
  },
];

console.log('='.repeat(70));
console.log('EJECUCIÓN DEL BANCO DE PRUEBAS - AGENDAR CITA MÉDICA');
console.log('='.repeat(70));

let aprobadas = 0;

pruebas.forEach((p) => {
  const paso = p.ejecutar();
  if (paso) aprobadas++;
  const estado = paso ? '✓ Aprobado' : '✗ Fallido';
  console.log(`[${p.id}] ${p.descripcion.padEnd(45)} -> ${estado}`);
});

console.log('='.repeat(70));
console.log(`Resultado final: ${aprobadas} de ${pruebas.length} pruebas aprobadas.`);
console.log('='.repeat(70));

if (aprobadas !== pruebas.length) {
  process.exit(1);
}