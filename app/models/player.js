var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , config = require('../../config')
  , util = require('util');

var PlayerSchema = new Schema({
	name: String
  , email: String
  , timezone: {type: String, enum: ['Eastern', 'Central', 'Mountain', 'Pacific']}

  , score: {type: Number, default: -1}
});

PlayerSchema.pre('save', function(next){
	if(this.score == -1){
		this.score = config.determineInitialPoints();
	}
	next();
});

PlayerSchema.methods.notifyOfNewRound = function(url){
	util.log('notifying '+this.name+' of new round! ' + url);
};

var Player = mongoose.model('Player', PlayerSchema);
exports = Player;