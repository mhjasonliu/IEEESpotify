/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');


var client_id = '626fb1f9e4c14a5897b43fd1e674b186'; // Your client id
var client_secret = '6a2692aed01c4330955285e003dd2e1c'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); //support encoded bodies

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  console.log("Getting refresh token");
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});



var hasher = require("./hasher");
var ie3database = require("./db");

mongoose.connect(ie3database.uri);

var db = mongoose.connection;

db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function() {
    console.log('database connection successful ');
});

var DBEntry = ie3database.DBEntry;

app.get('/dblogin', function(req,res){
    var userlogin = req.query.username;
    var userID = req.query.userID;

    console.log("received userlogin info: " + userlogin);
    DBEntry.find({username: userlogin, userID: userID}, function(err, doc) {
        if(err) return console.log(err);
        if(doc.length == 0) {
            console.log("user does not currently exist. attempting to create");
            var newEntry = ie3database.addNewEntry(userlogin,userID);
            res.send({
                'trackList' : newEntry.listOfTracks
            });
        }
        else {
            console.log("user found");
            res.send({
                'trackList' : doc[0].listOfTracks
            });
        }
    });


});

app.get('/add_new_track', function(req,res){

    var newTrack = req.query.newTrack;
    var userlogin = req.query.username;
    var userID = req.query.userID;
    var access_token = req.query.access_token;

    var options = {
        url: 'https://api.spotify.com/v1/tracks/'+newTrack,
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
    };
    console.log("Attempting to add track");

    request.get(options, function(error, response, body) {
        if(error) {
            res.send({
                'err': ['error occured in getting track']
            });
            return;

        }
        if(body.hasOwnProperty("error")) {

            res.send({
                'err': [body.error.message]
            });
            return;

        }
        console.log("Track was obtained");
        console.log(body);
        newTrack = body;

        DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
            if(err) return console.log(err);

            if(doc === null) {
                res.send({
                    'err': ["You must be logged in to access."]
                });
                return;
            }

            if(doc.listOfTracks.find(function(x){return x.track.uri == newTrack.uri})=== undefined)
                doc.listOfTracks.push({track: newTrack, listOfStrings: []});

            doc.save(function(err){
                if(err) return console.log(err);
                console.log("update successful");
            });
            res.send({
                'trackList': doc.listOfTracks
            });
        });
    });

});

app.get('/associate_word',function(req,res){
    var userlogin = req.query.username,
        userID = req.query.userID,
        trackuri = req.query.current_track_uri,
        new_word = req.query.new_word,
        access_token = req.query.access_token;

    DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
        if(err) return console.log(err);

        if(doc === null) {
            res.send({
                'listOfStrings': ["You must be logged in to access."]
            });
            return;
        }

        var idx = doc.listOfTracks.findIndex(function(element) {
            console.log(element.track.uri + " " + trackuri);
            return element.track.uri == trackuri});
        if(idx != -1)
            doc.listOfTracks[idx].listOfStrings.push(new_word);
        console.log(idx);

        doc.save(function(err){
            if(err)
                return console.log(err);
            else
                console.log("update successful");
        });
        res.send({
            'listOfStrings': doc.listOfTracks[idx].listOfStrings
        });
    });

});

console.log('Listening on 8888');
app.listen(8888);
