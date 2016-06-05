'use strict';

var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var Paper = require('./src/paper');
var Keyword = require('./src/keywords');
var Author = require('./src/authors');
var mongoose = require('mongoose');
var keywordsJSON = require("./public/keywords.json");

mongoose.connect('mongodb://40.121.82.254:27017/cv');

var STATUS_OK = 200;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

app.set('view engine', 'ejs');
app.use("/js", express.static(__dirname + '/lib'));
app.use("/public", express.static(__dirname + '/public'));

app.get('/partials/:name', function (req, res) {
  res.render(req.params.name);
});

app.get('/findpaper/:query', function (req, res) {

  var normalized_title = req.params.query.toLowerCase();
  console.log(normalized_title);

  Paper.find({ $text: { $search: normalized_title } }, { _id: 1, t: 1, a: 1, score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(100).exec(function (err, papers) {
    if (err) console.log(err);
    console.log(papers);
    res.status(STATUS_OK).json(papers);
  });
});

app.get('/keywords', function (req, res) {
  res.status(STATUS_OK).json(keywordsJSON);
});

app.get('/paper/:id', function (req, res) {
  var id = req.params.id;

  Paper.findOne({ _id: id }).lean().exec(function (err, paper) {

    if (err || !paper) console.log(err);else {

      Author.find({ _id: { $in: paper.a } }).lean().exec(function (err, authors) {

        if (err) console.log(err);else {

          Paper.find({ _id: { $in: paper.b } }).lean().exec(function (err, neighborsB) {

            if (err) console.log(err);else {

              Paper.find({ _id: { $in: paper.f } }).lean().exec(function (err, neighborsF) {
                var result = {
                  id: paper._id,
                  title: paper.t,
                  authors: authors.map(function (a) {
                    return toTitleCase(a.n);
                  }),
                  topics: paper.k,
                  conference: paper.c,
                  links: paper.u,
                  neighborsB: neighborsB,
                  neighborsF: neighborsF,
                  sketch: paper.s
                };

                console.log(result);

                res.status(STATUS_OK).json(result);
              });
            }
          });
        }
      });
    }
  });
});

app.get('/', function (req, res) {
  res.render("layout");
});
app.get('*', function (req, res) {
  res.render("layout");
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!');
});