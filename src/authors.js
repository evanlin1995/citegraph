var mongoose = require('mongoose');

var authorSchema = mongoose.Schema({
  _id: String,
  n: String
});

module.exports = mongoose.model('authors', authorSchema);
