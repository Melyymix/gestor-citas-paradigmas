'use strict';

angular.module('gestorCitasApp').controller('AdminAreaController', [
  '$scope',
  'AuthService',
  'UsuarioService',
  function ($scope, AuthService, UsuarioService) {
    $scope.usuario = AuthService.getUsuario();
    $scope.tab = 'DOCTORES';
    $scope.doctores = [];
    $scope.recepcionistas = [];
    $scope.pacientes = [];
    $scope.error = '';
    $scope.mensaje = '';
    $scope.cargando = false;

    $scope.diasSemana = [
      { id: 1, nombre: 'Lunes' },
      { id: 2, nombre: 'Martes' },
      { id: 3, nombre: 'Miércoles' },
      { id: 4, nombre: 'Jueves' },
      { id: 5, nombre: 'Viernes' },
      { id: 6, nombre: 'Sábado' },
      { id: 0, nombre: 'Domingo' },
    ];

    function crearDoctorVacio() {
      return {
        nombre: '',
        correo: '',
        telefono: '',
        password: '',
        cedulaProfesional: '',
        horarios: [{ diaSemana: 1, horaInicio: '09:00', horaFin: '15:00' }],
      };
    }

    $scope.nuevoDoctor = crearDoctorVacio();
    $scope.nuevoRecepcionista = {
      nombre: '',
      correo: '',
      telefono: '',
      password: '',
      permisoCancelacionEspecial: false,
    };
    $scope.nuevoPaciente = {
      nombre: '',
      curp: '',
      correo: '',
      telefono: '',
      password: '',
    };

    $scope.cambiarTab = function (tab) {
      $scope.tab = tab;
      $scope.error = '';
      $scope.mensaje = '';
    };

    $scope.agregarHorario = function () {
      $scope.nuevoDoctor.horarios.push({ diaSemana: 1, horaInicio: '09:00', horaFin: '15:00' });
    };

    $scope.quitarHorario = function (idx) {
      $scope.nuevoDoctor.horarios.splice(idx, 1);
    };

    function cargarPersonal() {
      UsuarioService.listarPersonalArea()
        .then(function (data) {
          $scope.doctores = data.doctores || [];
          $scope.recepcionistas = data.recepcionistas || [];
          $scope.pacientes = data.pacientes || [];
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al cargar personal';
        });
    }

    $scope.registrarDoctor = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;
      UsuarioService.registrarDoctor($scope.nuevoDoctor)
        .then(function (res) {
          $scope.mensaje = 'Doctor registrado: ' + res.doctor.nombre;
          $scope.nuevoDoctor = crearDoctorVacio();
          cargarPersonal();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al registrar doctor';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.registrarRecepcionista = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;
      UsuarioService.registrarRecepcionista($scope.nuevoRecepcionista)
        .then(function (res) {
          $scope.mensaje = 'Recepcionista registrado: ' + res.recepcionista.nombre;
          $scope.nuevoRecepcionista = {
            nombre: '',
            correo: '',
            telefono: '',
            password: '',
            permisoCancelacionEspecial: false,
          };
          cargarPersonal();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al registrar recepcionista';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.registrarPaciente = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;
      UsuarioService.registrarPaciente($scope.nuevoPaciente)
        .then(function (res) {
          $scope.mensaje = 'Paciente registrado: ' + res.paciente.nombre;
          $scope.nuevoPaciente = { nombre: '', curp: '', correo: '', telefono: '', password: '' };
          cargarPersonal();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al registrar paciente';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    cargarPersonal();
  },
]);
