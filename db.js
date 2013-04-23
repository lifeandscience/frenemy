var mongoose = require('mongoose');

// Database
var db = process.env.MONGOHQ_URL;
module.exports = mongoose.connect(db);