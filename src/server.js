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

function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

app.set('view engine', 'ejs');
app.use("/js", express.static(__dirname + '/lib'));
app.use("/public", express.static(__dirname + '/public'));

app.get('/partials/:name', (req, res) => {
  res.render(req.params.name);
});

app.get('/findpaper/:query', (req, res) => {

  var normalized_title = req.params.query.toLowerCase();
  console.log(normalized_title);

  Paper.find(
    { $text: { $search: normalized_title } },
    { _id: 1, t: 1, a: 1, score : { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(100)
  .exec(function(err, papers) {
    if (err) console.log (err);
    console.log(papers);
    res.status(STATUS_OK).json(papers);
  });

});

app.get('/keywords', (req, res) => {
  res.status(STATUS_OK).json(keywordsJSON);
});

app.get('/paper/:id', (req, res) => {
  var id = req.params.id;

  // jank AF
  var r = {};

  Paper.findOne({ _id: id }).lean().exec().then(paper => {
    r.paper = paper;
    return Author.find({ _id: { $in: r.paper.a } }).lean().exec();
  }).then(authors => {
    r.authors = authors;
    return Paper.find({ _id: { $in: r.paper.b } }).lean().exec();
  }).then(neighborsB => {
    r.neighborsB = neighborsB;
    return Paper.find({ _id: { $in: r.paper.f } }).lean().exec();
  }).then(neighborsF => {
    r.neighborsF = neighborsF;
    return Promise.resolve();
  }).catch(e => {
    console.log(e);
    res.status(STATUS_ERR).json({err:e});
  }).then(() => {
    var paperNode = {
      id: r.paper._id,
      title: r.paper.t,
      authors: r.authors.map(a => { return toTitleCase(a.n); }),
      topics: r.paper.k,
      conference: r.paper.c,
      links: r.paper.u,
      neighborsB: r.neighborsB,
      neighborsF: r.neighborsF,
      sketch: r.paper.s
    };

    var neighborNodes = new Set();
    r.neighborsB.forEach(n => { neighborNodes.add(n); });
    r.neighborsF.forEach(n => { neighborNodes.add(n); });
    console.log(neighborNodes);

    res.status(STATUS_OK).json(paperNode);

  });

});

app.get('/', (req, res) => { res.render("layout"); });
app.get('*', (req, res) => { res.render("layout"); });

var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
