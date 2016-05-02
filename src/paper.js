var mongoose = require('mongoose');
mongoose.connect('mongodb://13.92.95.245:27017');

var paperSchema = mongoose.Schema({
  a: [String],
  b: String,
  c: String,
  d: String,
  f: [String],
  i: String,
  k: [String],
  n: String,
  r: String,
  s: String,
  t: String,
  u: [String]
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  
});

module.exports = mongoose.model('paper', paperSchema);
