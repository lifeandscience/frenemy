var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var VoteSchema = new Schema({
	player: {type: Schema.ObjectId, ref: 'Player'}
  , game: {type: Schema.ObjectId, ref: 'Game'}
  , date: {type: Date, default: function(){ return Date.now(); }}
  , value: {type: String, enum: ['friend', 'enemy']}
});

var Vote = mongoose.model('Vote', VoteSchema);
exports = Vote;