var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var VoteSchema = new Schema({
	player: {type: Schema.ObjectId, ref: 'Player'}
  , round: {type: Schema.ObjectId, ref: 'Round'}
  , date: {type: Date, default: function(){ return Date.now(); }}
  , value: {type: String, enum: ['friend', 'enemy']}
});

var Vote = mongoose.model('Vote', VoteSchema);
exports = Vote;