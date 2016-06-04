var mongoose = require('mongoose');

var paperSchema = mongoose.Schema({
  _id: String,
  a: [String],
  b: [String],
  c: String,
  d: String,
  f: [String],
  i: String,
  k: [String],
  n: String,
  r: String,
  s: {String : Number},
  t: String,
  u: [String]
});

// var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() { /* what goes here */ });

module.exports = mongoose.model('papers', paperSchema);
