var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , util = require('util')
  , config = require('../../config');

var RoundSchema = new Schema({
	completed: {type: Boolean, default: false}
  , number: {type: Number, default: 1, min: 1, max: 7}
  , votes: [{type: Schema.ObjectId, ref: 'Vote'}]
});

RoundSchema.methods.getVoteForPlayer = function(id){
	for(var i=0; i<this.votes.length; i++){
		if(this.votes[i].player.toString() == id.toString()){
			return this.votes[i];
		}
	}
	return null;
};

RoundSchema.methods.getPointsForPlayer = function(id){
	var player_vote = null
	  , opponent_vote = null;
	if(this.votes[0].player.toString() == id.toString()){
		player_vote = this.votes[0];
		opponent_vote = this.votes[1];
	}else{
		player_vote = this.votes[1];
		opponent_vote = this.votes[0];
	}
	if(player_vote.value == opponent_vote.value){
		if(player_vote.value == 'friend'){
			return config.points.winningTie;
		}else{
			return config.points.losingTie;
		}
	}else if(player_vote.value == 'friend'){
		return config.points.loss;
	}else{
		return config.points.win;
	}
};
RoundSchema.methods.getStringPointsForPlayer = function(id, points){
	if(!points){
		points = this.getPointsForPlayer(id);
	}
	if(points > 0){
		return '+'+points;
	}
	return ''+points;
};

var Round = mongoose.model('Round', RoundSchema);
exports = Round;