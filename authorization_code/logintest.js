var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var app = express();

app.use(express.static(__dirname + '/loginfo'))
    .use(cookieParser());

//set up mongoose
var mongoose = require('mongoose');

var username = "ieeejasonliu";
var pword = "kappa123";
var uri = "mongodb://"+username+":"+pword+"@ds121896.mlab.com:21896/ieeespotify";

mongoose.connect(uri);

var db = mongoose.connection;
db.on('error', console.error.bind(console,'connection error:'));
db.once('open', function() {
    console.log('connected to ' + username);
});

var dbEntrySchema = mongoose.Schema({
    username: String,
    listOfStrings: [String]
});
var DBEntry = mongoose.model('DBEntry',dbEntrySchema);

function addNewEntry(newusername) {
    var newEntry = new DBEntry();
    newEntry.username = newusername;
    newEntry.listOfStrings = [];
    newEntry.save(function(err){
        if(err) return console.log(err);
    });
    return newEntry;
}

app.get('/login', function(req,res){
    var userlogin = req.query.username;

    console.log("received userlogin info: " + userlogin);
    DBEntry.find({username: userlogin}, function(err, doc) {
        if(err) return console.log(err);
        if(doc.length == 0) {
            console.log("user does not currently exist. attempting to create");
            var newEntry = addNewEntry(userlogin);
            res.send({
                'todo_list' : newEntry.listOfStrings
            });
        }
        else {
            console.log("user found");
            res.send({
                'todo_list' : doc[0].listOfStrings
            });
        }
    });


});

app.get('/add_to_list', function(req,res){
    var newItem = req.query.newItem;
    var userlogin = req.query.username;

    DBEntry.findOne({username:userlogin},function(err, doc){
        if(err) return console.log(err);

        if(doc === null) {
            res.send({
               'todo_list': ["You must be logged in to access."]
            });
            return;
        }
        doc.listOfStrings.push(newItem);
        doc.save(function(err){
            if(err) return console.log(err);
            console.log("update successful");
        });
        res.send({
            'todo_list': doc.listOfStrings
        });
    });
});

console.log('Listening on 8888');
app.listen(8888);
