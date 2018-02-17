'use strict';

angular.module('frontApp.view2', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
    }])

    .controller('View2Ctrl', ['$scope','$http','localStorageService', function($scope,$http,localStorageService) {
        var param = getHashParams();
        //give scope its initial values
        $scope.access_token = param.access_token;
        $scope.refresh_token = param.refresh_token;
        $scope.track_data = [];
        if($scope.access_token) {
            localStorageService.set('access_token', $scope.access_token);
            localStorageService.set('refresh_token', $scope.refresh_token);
        }
        localStorageService.bind($scope,'access_token');
        localStorageService.bind($scope,'refresh_token');
        localStorageService.bind($scope,'display_name');
        localStorageService.bind($scope,'userid');
        localStorageService.bind($scope,'tracks');

        function getHashParams() {
            var hashParams = {};
            const urllen = "#!/view2#".length;
            var e, r = /([^&;=]+)=?([^&;]*)/g,
                q = window.location.hash.substring(urllen);

            while (e = r.exec(q)) {
                hashParams[e[1]] = decodeURIComponent(e[2]);
            }
            return hashParams;
        }

        //for each track in given array, apply get request to get track data from uri
        function extractTrackUriData(tracks){

            tracks.forEach(function(element) {

                var url = "https://api.spotify.com/v1/tracks/" + element.track.uri.substring("spotify:track:".length);

                var track_config={
                    headers:{
                        'Authorization': 'Bearer ' + $scope.access_token
                    }
                };
                $http.get(url,track_config).then(function(response){
                    var InfoObject = {};
                    var trackObj = response.data;
                    InfoObject.redirect="#!/view3#trackuri="+encodeURI(trackObj.uri);
                    InfoObject.uri=trackObj.uri;
                    InfoObject.name = trackObj.name;
                    if (InfoObject.name.length > 17){
                        InfoObject.name = InfoObject.name.substr(0, 17) + "...";
                    }
                    InfoObject.first_artist = trackObj.artists[0].name;
                    InfoObject.imageurl = trackObj.album.images[0].url;
                    $scope.track_data.push(InfoObject);
                },function(error){
                    console.log("error occured:" +error.toString());

                });
            });
        }

        //slightly faster variant for getting track data as opposed to getting single track
        function extractMultipleTrackUriData(tracks){


            var url = "https://api.spotify.com/v1/tracks/?ids=";
            tracks.forEach(function(element){
                url = url + element.track.uri.substring("spotify:track:".length) + ',';
            });
            url = url.substring(0,url.length-1);

            var track_config={
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };
            console.log("Requesting track data from Spotify");
            console.log(url);
            $http.get(url,track_config).then(function(response){
                var trackObjs = response.data.tracks;
                console.log(trackObjs);
                trackObjs.forEach(function(trackObj){
                    var InfoObject = {};
                    InfoObject.redirect="#!/view3#trackuri="+encodeURI(trackObj.uri);
                    InfoObject.uri=trackObj.uri;
                    InfoObject.name = trackObj.name;
                    if (InfoObject.name.length > 17){
                        InfoObject.name = InfoObject.name.substr(0, 17) + "...";
                    }
                    InfoObject.first_artist = trackObj.artists[0].name;
                    InfoObject.imageurl = trackObj.album.images[0].url;
                    $scope.track_data.push(InfoObject);
                });
            },function(error){
                console.log("error occured:" +error.toString());

            });
        }


        $scope.databaseLogin = function(){
            var config = {
                headers: {
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            console.log("Attempting to retrieve user info from spotify");
            $http.get('https://api.spotify.com/v1/me', config)
                .then(function success(response) {
                    $scope.display_name = response.data.display_name;
                    $scope.userid = response.data.id;

                    console.log("Attempting to log into database");

                    var dbconfig = {
                        params: {
                            'username': $scope.display_name,
                            'userID': $scope.userid
                        }
                    };

                    $http.get("/dblogin", dbconfig).then(function (response) {
                        $scope.tracks = response.data.trackList;
                        extractTrackUriData($scope.tracks);
                        $scope.getUserPlaylists();
                        localStorageService.set('tracks',$scope.tracks);
                    });

                }, function error(response) {
                    console.log("error occured while logging in to spotify");
                });

        };

        //add track from front end to back end.
        $scope.addTrack=function(){
            console.log("requesting add_new_track from front end");

            var url = "https://api.spotify.com/v1/tracks/" + $scope.newTrack.substring("spotify:track:".length);

            var track_config={
                headers:{
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };
            $http.get(url,track_config).then(function(response){

                var data = {
                    username: $scope.display_name,
                    userID: $scope.userid,
                    newTracks: $scope.newTrack
                };

                var config = {};

                $http.post('/add_new_track',data,config)
                    .then(function success(response){
                        $scope.form_feedback = "Track addition successful.";
                        $scope.tracks=response.data.trackList;
                        var newObject = {track:{
                                uri: $scope.newTrack
                            }};
                        extractTrackUriData([newObject]);
                    },function error(response){
                        console.log("error occurred in adding track");
                    });

            },function(error){
                $scope.form_feedback = "Error in obtaining track from Spotify. Input must be valid URI";
                console.log("error occured:" +error.toString());

            });




        };

        //add word from front end to back end
        $scope.addWord=function(){
            console.log("requesting to add new word from front end");
            var data = {
                username: $scope.display_name,
                userID: $scope.userid,
                current_track_uri: $scope.newTrack,
                new_word: $scope.newWord
            };

            var config = {};
            $http.post('/associate_word',data,config)
                .then(function success(response){
                    $scope.tracks=response.data.trackList;
                },function error(response){
                    console.log("error occurred in associating word");
                });
        };

        $scope.getUserPlaylists=function(){
          var url = "https://api.spotify.com/v1/me/playlists";
            var config = {

                headers: {
                    'Authorization': 'Bearer ' + $scope.access_token
                }
            };

            $http.get(url,config).then(function(response){
                var playlists = response.data;
                var next_url = playlists.items[0].href;
                $scope.all_playlist_data = playlists.items;
                $scope.all_playlist_data.forEach(function(element)
                {
                    if (element.name.length > 17){
                        element.name = element.name.substr(0, 17) + "...";
                    }                       
                });
                console.log($scope.all_playlist_data);
                for(var i = 0; i < $scope.all_playlist_data.length;i++)
                    $scope.all_playlist_data[i].redirect_uri = "#!/view4#playlistid="+encodeURI($scope.all_playlist_data[i].id);
            },function error(response){
                console.log("error occurred in retrieving playlists");
            });

        };

}]);