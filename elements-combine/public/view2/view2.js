'use strict';

angular.module('frontApp.view2', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope','$http', function($scope,$http) {
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

        var config = {headers: {
                'Authorization': 'Bearer ' + $scope.access_token
            }};

        console.log("Attempting to retrieve user info from spotify");
        $http.get('https://api.spotify.com/v1/me',config)
            .then(function success(response){
            $scope.display_name = response.display_name;
            $scope.userid = response.id;

            console.log("Attempting to log into database");

            config = {
                data: {
                    'username': $scope.display_name,
                    'userID': $scope.userid
                }
            };

            $http.get("/dblogin", config).then(function(response){
                $scope.tracks = response.data.trackList;
                console.log($scope.tracks);
            });

        },function error(response){
            console.log("error occured while logging in");
        })

    }]);