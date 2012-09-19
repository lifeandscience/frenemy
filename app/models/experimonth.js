var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var ExperimonthSchema = new Schema({
	startDate: {type: Date, default: function(){ return Date.now(); }}
  , endDate: {type: Date, default: function(){ return Date.now(); }}
  , playerLimit: {type: Number, default: 100}
  , players: [{type: Schema.ObjectId, ref: 'Player'}]
  , open: {type: Boolean, default: false}
});

var Experimonth = mongoose.model('Experimonth', ExperimonthSchema);
exports = Experimonth;