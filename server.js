'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// Connect to the MongoDB
var uri = process.env.MONGO_URI;
mongoose
  .connect(uri, { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB!"))
  .catch(err => console.log(err));

// Create schema for saving URL
var Schema = mongoose.Schema;
var urlSchema = new Schema({
  orgUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: Number,
    required: true
  }
});

var Url = mongoose.model("Url", urlSchema);
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Accept data from POST
app.post("/api/shorten/new", function (req, res, next) {
  var enteredUrl = req.body.url;
  // Check if entered URL is valid or not
  dns.resolve4(enteredUrl, function(err, address) {
    if(err){return next(res.json({error:"Wrong URL"}));};
    if(address.length < 1) {
      return next(res.json({error:"Wrong URL"}));
    }
    // Prepare URL to save to database
    var shortenedUrl = Math.floor(Math.random()*100 + 1);
    var urlToSave = new Url({
      orgUrl: enteredUrl,
      shortUrl: shortenedUrl
    })
    // Save URL to database
    urlToSave.save((err, data) => {
      if(err) { return next(err);}
      next(res.json({original_url: enteredUrl, short_url: shortenedUrl}));
    })
  })
})

// Response for the short URL
app.get('/api/shorten/:url', function (req, res, next) {
  var shortUrl = req.params.url;
  Url.find({shortUrl: shortUrl}, (err, data) => {
    if(err) {return next(err);};
    if(data.length < 1) {
      next(res.json({error:"Wrong Format"}));
    }
    next(res.redirect("http://" + data[0]["orgUrl"]));
  })
})


app.listen(port, function () {
  console.log('Node.js listening to the Port: ' + port);
});