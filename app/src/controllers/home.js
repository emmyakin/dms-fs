(function() {
  'use strict';
  angular.module('prodocs.controllers')
    .controller('StartPageCtrl', ['$mdMedia', '$rootScope', '$scope',
      '$state',
      function($mdMedia, $rootScope, $scope, $state) {
        $scope.showButton = true;

        $scope.$watch(function() {
          return $state.current.name;
        }, function(name) {
          if (name === 'home.features') {
            $scope.showButton = true;
          } else {
            $scope.showButton = false;
          }
        });

        $scope.facebook = function() {
          $window.location.href = '/auth/facebook';
        };

        $scope.google = function() {
          $window.location.href = '/auth/google';
        };

      }
    ]);
})();
