var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util');

var VoteSchema = new Schema({
	player: {type: Schema.ObjectId, ref: 'Player'}
  , date: {type: Date, default: -1}
  , value: {type: String, enum: ['friend', 'enemy']}
});

VoteSchema.pre('save', function(next){
	if(this.date == -1){
		this.date = new Date();
	}
	next();
});

var Vote = mongoose.model('Vote', VoteSchema);
exports = Vote;