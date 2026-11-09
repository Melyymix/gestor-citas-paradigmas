'use strict';

angular.module('gestorCitasApp').controller('DirectorController', [
  '$scope',
  'UsuarioService',
  function ($scope, UsuarioService) {
    $scope.especialidades = [];
    $scope.admins = [];
    $scope.nuevoAdmin = {
      nombre: '',
      correo: '',
      telefono: '',
      password: '',
      idEspecialidad: '',
    };
    $scope.error = '';
    $scope.mensaje = '';
    $scope.cargando = false;

    function cargarDatos() {
      UsuarioService.listarEspecialidades().then(function (data) {
        $scope.especialidades = data;
      });
      UsuarioService.listarAdminsArea()
        .then(function (data) {
          $scope.admins = data;
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al cargar administradores';
        });
    }

    $scope.registrarAdminArea = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;

      UsuarioService.registrarAdminArea($scope.nuevoAdmin)
        .then(function (res) {
          $scope.mensaje = 'Administrador de área registrado: ' + res.admin.nombre;
          $scope.nuevoAdmin = {
            nombre: '',
            correo: '',
            telefono: '',
            password: '',
            idEspecialidad: '',
          };
          cargarDatos();
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'No se pudo registrar el administrador';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    cargarDatos();
  },
]);
