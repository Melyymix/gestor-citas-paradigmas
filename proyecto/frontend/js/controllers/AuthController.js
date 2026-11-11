'use strict';

angular.module('gestorCitasApp').controller('AuthController', [
  '$scope',
  '$location',
  'AuthService',
  function ($scope, $location, AuthService) {
    $scope.credenciales = { correo: '', password: '' };
    $scope.tipoRegistro = 'PACIENTE';
    $scope.registro = {
      nombre: '',
      curp: '',
      telefono: '',
      correo: '',
      password: '',
    };
    $scope.error = '';
    $scope.mensaje = '';
    $scope.cargando = false;

    const rutas = {
      DIRECTOR_GENERAL: '/director',
      ADMIN_AREA: '/admin-area',
    };

    $scope.cambiarTipoRegistro = function (tipo) {
      $scope.tipoRegistro = tipo;
      $scope.error = '';
      $scope.mensaje = '';
    };

    $scope.iniciarSesion = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;

      AuthService.login($scope.credenciales)
        .then(function (data) {
          const destino = rutas[data.usuario.rol];
          if (destino) {
            $location.path(destino);
          } else {
            $scope.mensaje =
              'Sesión iniciada como ' + data.usuario.rol + '. Su módulo de vista aún está pendiente de integración.';
          }
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'No fue posible iniciar sesión';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.enviarRegistro = function () {
      $scope.error = '';
      $scope.mensaje = '';
      $scope.cargando = true;

      const peticion =
        $scope.tipoRegistro === 'DIRECTOR_GENERAL'
          ? AuthService.registroDirector($scope.registro)
          : AuthService.registroPaciente($scope.registro);

      peticion
        .then(function () {
          $scope.mensaje = 'Cuenta registrada correctamente. Ya puedes iniciar sesión.';
          $scope.registro = { nombre: '', curp: '', telefono: '', correo: '', password: '' };
        })
        .catch(function (err) {
          $scope.error = (err.data && err.data.mensaje) || 'Error al registrar la cuenta';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };
  },
]);
