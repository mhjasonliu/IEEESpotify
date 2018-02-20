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

            var newTracks = req.body.newTracks;
            var userlogin = req.body.username;
            var userID = req.body.userID;

            console.log(req.url);
            console.log("Attempting to add track");
            console.log(newTracks,userlogin,userID);

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': ["You must be logged in to access."]
                    });
                    return;
                }

                if(!Array.isArray(newTracks)) {
                    newTracks = [newTracks];
                }
                newTracks.forEach(function(newItem){
                    var trackObj = {};
                    trackObj.uri = newItem;

                    if (doc.listOfTracks.find(function (x) {
                            return x.track.uri == newItem
                        }) === undefined)
                        doc.listOfTracks.push({track: trackObj, listOfStrings: []});
                });

                doc.save(function(err){
                    if(err) return console.log(err);
                    console.log("update successful");
                });
                res.send({
                    'trackList': doc.listOfTracks
                });
            });

        });

        app.post('/word_cloud', function(req,res){
            var userlogin = req.body.username;
            var userID = req.body.userID;
            console.log(userlogin);
            

            var text = "";

            DBEntry.find({username: userlogin}, function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    return console.log("No contents found");
                }



                var len = doc[0].listOfTracks.length;
                for (var i = 0; i < len; i++){
                    var track = doc[0].listOfTracks[i];
                    for (var j = 0; j < track.listOfStrings.length; j++){
                        var result = track.listOfStrings[j].replace(/[^a-zA-Z0-9]/g, " ");
                        text = text +" " + result.toLowerCase();
                    }
                }

                console.log(text);

                res.send({
                    'text': text
                });
            });

        });

        app.post('/associate_word',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri,
                new_word = req.body.new_word;

            console.log("Attempting to associate word");
            console.log(userlogin,userID,trackuri,new_word);

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
                if(idx != -1) {
                    if (doc.listOfTracks[idx].listOfStrings.find(function (x) {
                            return new_word == x;
                        }) === undefined) {
                        doc.listOfTracks[idx].listOfStrings.push(new_word);
                    }
                }
                else {
                    var trackObj = {};
                    trackObj.uri = trackuri;
                    var listOfStrings = [];
                    listOfStrings.push(new_word);

                    doc.listOfTracks.push({track: trackObj, listOfStrings: listOfStrings});
                }

                doc.save(function(err){
                    if(err)
                        return console.log(err);
                    else
                        console.log("update successful");
                });
                res.send({
                    'trackList': doc.listOfTracks
                });
            });

        });

        app.post('/remove_track',function(req,res){
            var userlogin = req.body.username,
                userID = req.body.userID,
                trackuri = req.body.current_track_uri;

            console.log("Attempting to remove track.");
            console.log(userlogin,userID,trackuri);

            DBEntry.findOne({username:userlogin, userID: userID},function(err, doc){
                if(err) return console.log(err);

                if(doc === null) {
                    res.send({
                        'err': "You must be logged in to access."
                    });
                    return;
                }

                var idx = doc.listOfTracks.findIndex(function(element) {
                    return element.track.uri == trackuri});
                if(idx != -1) {
                    doc.listOfTracks.splice(idx, 1); //remove 1 item from the i'th index
                }

                doc.save(function(err){
                    if(err)
                        return console.log(err);
                    else
                        console.log("removal successful");
                });
                res.send({
                    'trackList': doc.listOfTracks
                });
            });

        });


    }
};