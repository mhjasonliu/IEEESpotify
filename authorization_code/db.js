var mongoose = require('mongoose');
var hasher = require('./hasher');

var username = "ieeejasonliu";
var pword = "kappa123";
var uri = "mongodb://"+username+":"+pword+"@ds121896.mlab.com:21896/ieeespotify";

var Schema = mongoose.Schema;

var trackSchema = new Schema({
    track: Object,
    listOfStrings: [String]
});

var dbEntrySchema = new Schema({
    username: String,
    userID: String,
    salt: String,
    listOfTracks: [trackSchema]
});
var DBEntry = mongoose.model('DBEntry',dbEntrySchema);

var addNewEntry = function(newusername,newuserID) {
    var newEntry = new DBEntry();
    newEntry.username = newusername;
    newEntry.userID = newuserID;
    newEntry.salt = hasher.genString(16);
    newEntry.listOfTracks = [];
    newEntry.save(function(err){
        if(err) return console.log(err);
    });
    return newEntry;
}

module.exports = {
    uri: uri,
    setup: function(app) {
        app.get('/dblogin', function(req,res){
            var userlogin = req.query.username;
            var userID = req.query.userID;

            console.log("received userlogin info: " + userlogin);
            DBEntry.find({username: userlogin, userID: userID}, function(err, doc) {
                if(err) return console.log(err);
                if(doc.length == 0) {
                    console.log("user does not currently exist. attempting to create");
                    var newEntry = addNewEntry(userlogin,userID);
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

        app.post('/add_new_track', function(req,res){

            var newTrack = req.body.newTrack;
            var userlogin = req.body.username;
            var userID = req.body.userID;
            var access_token = req.body.access_token;

            console.log("Attempting to add track");

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': ["You must be logged in to access."]
                    });
                    return;
                }

                var trackObj = {};
                trackObj.uri = newTrack;

                if(doc.listOfTracks.find(function(x){return x.track.uri == newTrack})=== undefined)
                    doc.listOfTracks.push({track: trackObj, listOfStrings: []});

                doc.save(function(err){
                    if(err) return console.log(err);
                    console.log("update successful");
                });
                res.send({
                    'trackList': doc.listOfTracks
                });
            });

        });

        app.post('/associate_word',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri,
                new_word = req.body.new_word,
                access_token = req.body.access_token;

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': "You must be logged in to access."
                    });
                    return;
                }

                var idx = doc.listOfTracks.findIndex(function(element) {
                    //console.log(element.track.uri + " " + trackuri);
                    return element.track.uri == trackuri});
                if(idx != -1)
                    doc.listOfTracks[idx].listOfStrings.push(new_word);
                else
                    res.send({err: "track not found in database."});

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
    }
};