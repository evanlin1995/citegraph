'use strict';

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

var Paper = mongoose.model('Paper', paperSchema);