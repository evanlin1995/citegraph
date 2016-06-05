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
var Promise = require('bluebird');

mongoose.connect('mongodb://40.121.82.254:27017/cv');
mongoose.Promise = Promise;

var STATUS_OK = 200;
var STATUS_ERR = 500;

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

function getPaper(id) {
  if (id === undefined || id.length == 0) return Promise.resolve([]);
  return Paper.find({ _id: { $in: id } }).lean().exec();
}

app.get('/paper/:id', function (req, res) {
  var id = req.params.id;

  // jank AF
  var r = {};

  Paper.findOne({ _id: id }).lean().exec().then(function (paper) {
    r.paper = paper;
    return Author.find({ _id: { $in: r.paper.a } }).lean().exec();
  }).then(function (authors) {
    r.authors = authors;
    return getPaper(r.paper.b);
    // repeated here - optimized later
  }).then(function (neighborsB) {
    r.neighborsB = neighborsB;
    return getPaper(r.paper.f);
  }).then(function (neighborsF) {
    r.neighborsF = neighborsF;
  }).then(function () {
    var paperNode = {
      id: r.paper._id,
      title: r.paper.t,
      authors: r.authors.map(function (a) {
        return toTitleCase(a.n);
      }),
      topics: r.paper.k,
      conference: r.paper.c,
      links: r.paper.u,
      neighborsB: r.neighborsB,
      neighborsF: r.neighborsF,
      sketch: r.paper.s
    };

    var neighborNodes = {};
    var neighborQs = [];

    var addNeighbors = function addNeighbors(n) {
      neighborQs.push(getPaper(n.b).then(function (neighbors) {
        neighbors.forEach(function (s) {
          neighborNodes[s._id] = s;
        });
        return getPaper(n.f);
      }).then(function (neighbors) {
        neighbors.forEach(function (s) {
          neighborNodes[s._id] = s;
        });
      }));
    };

    r.neighborsB.forEach(addNeighbors);
    r.neighborsF.forEach(addNeighbors);

    Promise.all(neighborQs).then(function () {
      var response = {
        paper: paperNode,
        neighbors: neighborNodes
      };
      res.status(STATUS_OK).json(response);
    });
  }, function (e) {
    console.log(e);
    res.status(STATUS_ERR).json({ err: e });
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