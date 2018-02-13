'use strict';

angular.module('frontApp.view3', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View3Ctrl', ['$scope','$http','localStorageService',function($scope,$http,localStorageService) {

        var param = getHashParams();
        findTrackData();
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');

        $scope.current_track = "";

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view3#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while (e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }

        function findTrackData(){
            var trackUri = param.trackuri;
            console.log(trackUri);
            var url = "https://api.spotify.com/v1/tracks/" + trackUri.substring("spotify:track:".length);

            var track_config= {
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            $http.get(url,track_config).then(function(response){
                var InfoObject = {};
                console.log(response.data);
                InfoObject.uri=response.data.uri;
                InfoObject.name = response.data.name;
                InfoObject.first_artist = response.data.artists[0].name;
                InfoObject.imageurl = response.data.album.images[0].url;
                $scope.current_track = InfoObject;
            },function(error){
                console.log("error occured:" +error);
            });
        };

    }]);