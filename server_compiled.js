'use strict';

// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var Paper = require('./src/paper');
var Keyword = require('./src/keywords');
var Author = require('./src/authors');
var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var keywordsJSON = require("./public/keywords.json");

mongoose.connect('mongodb://40.121.138.250:27017/cv');

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

app.get('/test/:query', function (req, res) {

  var normalized_title = req.params.query.toLowerCase();
  console.log(normalized_title);

  // find the list of papers, return as response
  // Paper.find({ n:  })
  // res.status(STATUS_OK).s

  Paper.find({ $text: { $search: normalized_title } }, { _id: 1, t: 1, a: 1, score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } }).limit(10).exec(function (err, papers) {
    if (err) console.log('we done goofed');
    // also query authors
    console.log(papers);
    // res.status(STATUS_OK).json(papers);
    res.status(STATUS_OK).json(papers);
  });

  // Paper.find(
  //   { $text: { $search: normalized_title } }, function(err, papers) {

  //     console.log(papers);
  //     res.status(STATUS_OK).json(papers);
  //   }
  // );
});

app.get('/keywords', function (req, res) {
  // Keyword.find({}, '_id n', function(err, keywords) {

  //   console.log(keywords);
  //   var result = {};
  //   var size = keywords.length;
  //   for (var i = 0; i < size; i++) {
  //     var id = keywords[i]._id;
  //     var name = keywords[i].n;
  //     result[id] = name;
  //   }
  //   res.status(STATUS_OK).json(result);

  // var count = 0;
  // for (var key in keywordsJSON) {
  //   if (keywordsJSON.hasOwnProperty(key)) {
  //     count++;
  //   }
  // }
  // console.log(count);

  // });

  res.status(STATUS_OK).json(keywordsJSON);
});

app.get('/paper/:title', function (req, res) {
  // var normalized_title = req.param('title').toLowerCase();
  var normalized_title = req.params.title.toLowerCase();

  console.log(normalized_title);
  Paper.findOne({ n: normalized_title }, function (err, paper) {

    if (err || !paper) console.log(err);else {

      console.log(paper);

      Keyword.find({ _id: { $in: paper.k } }, function (err, keywords) {

        if (err) console.log(err);else {

          Author.find({ _id: { $in: paper.a } }, function (err, authors) {

            if (err) console.log(err);else {

              Paper.find({ _id: { $in: paper.b } }, function (err, neighborsB) {

                if (err) console.log(err);else {

                  Paper.find({ _id: { $in: paper.f } }, function (err, neighborsF) {
                    // console.log(neighbors);
                    var result = {
                      id: paper._id,
                      title: paper.t,
                      authors: authors.map(function (a) {
                        return toTitleCase(a.n);
                      }),
                      topics: keywords,
                      conference: paper.c,
                      links: paper.u,
                      neighborsB: neighborsB,
                      neighborsF: neighborsF // change this
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
    }
  });
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