var mongoose = require('mongoose');

var keywordSchema = mongoose.Schema({
  _id: String,
  n: String,
  p: [String]
});

module.exports = mongoose.model('keywords', keywordSchema);
