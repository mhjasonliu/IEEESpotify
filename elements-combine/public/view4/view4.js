'use strict';

angular.module('frontApp.view4', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View4Ctrl', ['$scope','$http','localStorageService',function($scope,$http,localStorageService) {

        var param = getHashParams();
        console.log("view 4 loaded");
        console.log(param);
        console.log(localStorageService.length());
        $scope.current_track_strings = [];
        //bind current values to values in local storage
        localStorageService.bind($scope,'display_name');
        localStorageService.bind($scope,'userid');
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');
        localStorageService.bind($scope,'tracks');
        //use local storage to do computations

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view4#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while (e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }

    }]);