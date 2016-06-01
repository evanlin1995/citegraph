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

mongoose.connect('mongodb://40.76.12.31:27017/cv');

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
                      topics: keywords.map(function (a) {
                        return a.n;
                      }),
                      conference: paper.c,
                      links: paper.u,
                      neighborsB: neighborsB,
                      neighborsF: neighborsF // change this
                    };
                    // var result = {
                    //   title: paper.t,
                    //   authors: paper.a,
                    //   topics: keywords.map(function(a) { return a.n; }),
                    //   conference: paper.c,
                    //   links: paper.u,
                    //   neighborsF: paper.f,
                    //   neighborsB: [] // change this
                    // };
                    console.log(result);

                    res.status(STATUS_OK).json(result);
                  });
                }
              });

              // console.log(keywords);
            }
          });
        }
      });

      // res.send("hello world");
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