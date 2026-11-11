'use strict';

angular.module('gestorCitasApp').controller('AuthController', [
  '$scope',
  '$location',
  'AuthService',
  function ($scope, $location, AuthService) {
    $scope.credenciales = { correo: '', password: '' };
    $scope.registro = {
      nombre: '',
      curp: '',
      telefono: '',
      correo: '',
      password: '',
    };
    $scope.login = {};
    $scope.alta = {};
    $scope.cargando = false;

    function actualizarModo() {
      const modo = $location.path();
      if (modo !== '/login' && modo !== '/registro') {
        $location.replace().path('/login');
        return;
      }
      $scope.esRegistro = modo === '/registro';
      $scope.login.mostrarPassword = false;
      $scope.alta.mostrarPassword = false;
    }

    actualizarModo();
    $scope.$on('$routeUpdate', actualizarModo);

    const rutas = {
      DIRECTOR_GENERAL: '/director',
      ADMIN_AREA: '/admin-area',
      DOCTOR: '/doctor',
      RECEPCIONISTA: '/recepcionista',
      PACIENTE: '/paciente',
    };

    $scope.iniciarSesion = function () {
      $scope.login.error = '';
      $scope.login.mensaje = '';
      $scope.cargando = true;

      AuthService.login($scope.credenciales)
        .then(function (data) {
          const destino = rutas[data.usuario.rol];
          if (destino) {
            $location.path(destino);
          } else {
            $scope.login.mensaje =
              'Sesión iniciada como ' + data.usuario.rol + '. Su módulo de vista aún está pendiente de integración.';
          }
        })
        .catch(function (err) {
          $scope.login.error = (err.data && err.data.mensaje) || 'No fue posible iniciar sesión';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };

    $scope.enviarRegistro = function () {
      $scope.alta.error = '';
      $scope.alta.mensaje = '';
      $scope.cargando = true;

      AuthService.registroPaciente($scope.registro)
        .then(function () {
          $scope.alta.mensaje = 'Cuenta registrada correctamente. Ya puedes iniciar sesión.';
          $scope.registro = { nombre: '', curp: '', telefono: '', correo: '', password: '' };
        })
        .catch(function (err) {
          $scope.alta.error = (err.data && err.data.mensaje) || 'Error al registrar la cuenta';
        })
        .finally(function () {
          $scope.cargando = false;
        });
    };
  },
]);

angular.module('gestorCitasApp').directive('normalizarEntrada', function () {
  return {
    require: 'ngModel',
    link: function (_scope, _element, attrs, ngModel) {
      ngModel.$parsers.unshift(function (value) {
        const normalizado = attrs.normalizarEntrada === 'curp'
          ? value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
          : value.replace(/[^0-9]/g, '');
        if (normalizado !== value) {
          ngModel.$setViewValue(normalizado);
          ngModel.$render();
        }
        return normalizado;
      });
    },
  };
});
