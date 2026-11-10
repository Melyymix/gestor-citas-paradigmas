'use strict';

angular
  .module('gestorCitasApp', ['ngRoute'])
  .constant('API_URL', 'http://localhost:3000/api')
  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider
        .when('/login', {
          templateUrl: 'public/views/login.html',
          controller: 'AuthController',
          publico: true,
        })
        .when('/registro', {
          templateUrl: 'public/views/registro.html',
          controller: 'AuthController',
          publico: true,
        })
        .when('/director', {
          templateUrl: 'public/views/director.html',
          controller: 'DirectorController',
          roles: ['DIRECTOR_GENERAL'],
        })
        .when('/admin-area', {
          templateUrl: 'public/views/admin-area.html',
          controller: 'AdminAreaController',
          roles: ['ADMIN_AREA'],
        })
        // Integración de tu módulo clínico (Itzel)
        .when('/doctor', {
          templateUrl: 'public/views/doctor.html',
          controller: 'DoctorController',
          roles: ['DOCTOR'],
        })
        .otherwise({ redirectTo: '/login' });
    },
  ])
  .run([
    '$rootScope',
    '$location',
    'AuthService',
    function ($rootScope, $location, AuthService) {
      const rutaPorRol = {
        DIRECTOR_GENERAL: '/director',
        ADMIN_AREA: '/admin-area',
        DOCTOR: '/doctor', // Redirección automática al iniciar sesión
      };

      $rootScope.$on('$routeChangeStart', function (_event, next) {
        const usuario = AuthService.getUsuario();
        if (!next || next.publico) {
          if (usuario && rutaPorRol[usuario.rol]) {
            $location.path(rutaPorRol[usuario.rol]);
          }
          return;
        }

        if (!usuario) {
          $location.path('/login');
          return;
        }

        if (next.roles && next.roles.indexOf(usuario.rol) === -1) {
          $location.path(rutaPorRol[usuario.rol] || '/login');
        }
      });
    },
  ])
  .controller('MainController', [
    '$scope',
    '$rootScope',
    '$location',
    'AuthService',
    function ($scope, $rootScope, $location, AuthService) {
      const etiquetas = {
        DIRECTOR_GENERAL: 'Director General',
        ADMIN_AREA: 'Administrador de Área',
        DOCTOR: 'Doctor',
        RECEPCIONISTA: 'Recepcionista',
        PACIENTE: 'Paciente',
      };

      $scope.usuarioActual = AuthService.getUsuario();

      $scope.etiquetaRol = function (rol) {
        return etiquetas[rol] || rol;
      };

      $rootScope.$on('sesion:actualizada', function () {
        $scope.usuarioActual = AuthService.getUsuario();
      });

      $scope.cerrarSesion = function () {
        AuthService.logout().finally(function () {
          $scope.usuarioActual = null;
          $location.path('/login');
        });
      };
    },
  ]);