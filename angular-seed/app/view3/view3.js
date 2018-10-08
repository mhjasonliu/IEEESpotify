'use strict';

angular.module('myApp.view3', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view3', {
        templateUrl: 'view3/view3.html',
        controller: 'View3Ctrl'
    });
}])

.controller('View3Ctrl',['$scope', function($scope) {
    var todo = this;
    todo.songTitle = "Hello Kenobi";
    $scope.songTitle="REALCHAMPION";

    console.log(todo);
    console.log($scope);



    // pretend you're loading an array of tracks
    $scope.songs = ['asdas','asdfasfd'];


}]);