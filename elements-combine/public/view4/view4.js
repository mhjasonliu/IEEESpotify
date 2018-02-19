'use strict';

angular.module('frontApp.view4', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View4Ctrl', ['$scope','$http','localStorageService',function($scope,$http,localStorageService) {

        var param = getHashParams();
        //bind current values to values in local storage
        localStorageService.bind($scope,'display_name');
        localStorageService.bind($scope,'userid');
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');
        localStorageService.bind($scope,'tracks');
        //use local storage to do computations
        findPlaylistData();

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

        function findPlaylistData(){
            var playlistID = param.playlistid;
            var url = "https://api.spotify.com/v1/users/"+$scope.userid+"/playlists/"+playlistID;

            var track_config= {
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            $http.get(url,track_config).then(function(response){
                console.log(response.data);
                $scope.current_playlist = response.data;

                $scope.current_playlist_tracks = $scope.current_playlist.tracks.items;
                for(var i = 0;i < $scope.current_playlist_tracks.length;i++) {
                    if($scope.tracks.find(function(element){return element.track.uri == $scope.current_playlist_tracks[i].track.uri;}))
                        $scope.current_playlist_tracks[i].color = '#139E8C';
                    else
                        $scope.current_playlist_tracks[i].color = '#35bfae';
                }
            },function(error){
                console.log("error occured:" +error);
            });
            //get the current track's strings. These should be from the binding in the local storage
        }

        function getTrackStrings(){
            var currentUri = param.trackuri;

            return $scope.tracks.find(function(x){
                return x.track.uri == currentUri;
            }).listOfStrings;
        }

        $scope.setNewWord = function(newString,currentTrack){
            if(!newString)
                return;
            console.log("Submitting new word: " + newString);
            console.log("requesting to add new word from front end to back end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                current_track_uri: $scope.current_track.uri,
                new_word: newString
            };

            var config = {};
            $http.post('/associate_word',data,config)
                .then(function success(response){
                    $scope.tracks=response.data.trackList;
                },function error(response){
                    console.log("error occurred in associating word");
                });
        };

        $scope.addTrack=function(newTrack){
            console.log("requesting add_new_track from front end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                newTracks: newTrack
            };

            var config = {};

            $http.post('/add_new_track',data,config)
                .then(function success(response){
                    $scope.tracks=response.data.trackList;
                    $scope.current_playlist_tracks.find(function(element){return element.track.uri == newTrack;}).color = 'green';
                },function error(response){
                    console.log("error occurred in adding track");
                });
        };

    }]);