'use strict';

angular.module('frontApp.view2', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope', function($scope) {
        $scope.personName = "tommy";
    }]);