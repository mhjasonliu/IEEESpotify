'use strict';

angular.module('frontApp.view2', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope', function($scope) {
        $scope.personName = "tommy";
        var param = getHashParams();
        $scope.access_token = param.access_token;
        $scope.refresh_token = param.refresh_token;

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view2#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while ( e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }


    }]);