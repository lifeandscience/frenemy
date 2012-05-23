var mongoose = require('mongoose')
  , mongooseAuth = require('mongoose-auth');

// Database
var db = process.env.MONGOHQ_URL || 'mongodb://localhost/frenemy';
module.exports = mongoose.connect(db);