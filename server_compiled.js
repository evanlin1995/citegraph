'use strict';

// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();

app.set('view engine', 'ejs');
app.use("/js", express.static(__dirname + '/lib'));
app.use("/public", express.static(__dirname + '/public'));

app.get('/partials/:name', function (req, res) {
  res.render(req.params.name);
});

app.get('/', function (req, res) {
  res.render("layout");
});
app.get('*', function (req, res) {
  res.render("layout");
});

// var renderLayout = ;

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!');
});