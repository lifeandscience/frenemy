var mongoose = require('mongoose');

// Database
var db = process.env.MONGOHQ_URL || 'mongodb://localhost/frenemy';
module.exports = mongoose.connect(db);