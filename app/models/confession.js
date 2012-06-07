var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var ConfessionSchema = new Schema({
	date: {type: Date, default: function(){ return Date.now(); }}
  , text: String
});

var Confession = mongoose.model('Confession', ConfessionSchema);
exports = Confession;