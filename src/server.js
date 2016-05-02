// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var Paper = require('./src/paper');
var mongoose = require('mongoose');

var STATUS_OK = 200;

app.set('view engine', 'ejs');
app.use("/js", express.static(__dirname + '/lib'));
app.use("/public", express.static(__dirname + '/public'));

app.get('/partials/:name', (req, res) => {
  res.render(req.params.name);
});

app.get('/paper/:title', (req, res) => {
  console.log(req.params.title);
  var normalized_title = req.params.title.toLowerCase();
  // Paper.findOne({ n: normalized_title }, function(err, paper) {
  Paper.findOne({ c:  "42D7146F" }, function(err, paper) {
    if (err) console.log(err);
    console.log(paper);
    res.json(STATUS_OK, paper);
  });
});

app.get('/', (req, res) => { res.render("layout"); });
app.get('*', (req, res) => { res.render("layout"); });

// var renderLayout = ;

var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
