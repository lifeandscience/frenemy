var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , config = require('./config')
  , util = require('util');

app.get('/games', function(req, res){
	Game.find({}).asc('startTime').populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').run(function(err, games){
		res.render('games/index', {title: 'All Games', games: games, util: util});
	});
});

app.get('/games/start', function(req, res){
	Game.setupGames();
	req.flash('info', 'Game initiation begun!');
	res.redirect('/');
});

app.get('/games/:id/:as', function(req, res){
	// View a game in it's current state as the player identified as :as
	if(!req.params.id){
		req.flash('error', 'Invalid Game ID');
		res.redirect('/');
		return;
	}
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
	Game.findById(req.params.id).populate('opponents').run(function(err, game){
		if(err){
			req.flash('error', 'Game Lookup Failed');
			res.redirect('/');
			return;
		}
		if(game.currentRound){
			res.redirect('/games/'+game._id+'/'+game.currentRound+'/'+req.params.as);
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').run(function(err, round){
					game.rounds[index] = round;
					util.log('count: '+count);
					if(--count == 0){
						res.render('games/completed', {title: 'Completed Game', game: game, util: util, config: config});
						return;
					}
				});
			};
		for(var i=0; i<game.rounds.length; i++){
			populateRound(i);
		}
		return;
	});
});

app.get('/games/:id/:round/:as', function(req, res){
	// View a game in it's current state as the player identified as :as
	if(!req.params.id){
		req.flash('error', 'Invalid Game ID');
		res.redirect('/');
		return;
	}
	if(!req.params.round){
		req.flash('error', 'Missing Round ID');
		res.redirect('/');
		return;
	}
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
	Game.findById(req.params.id).run(function(err, game){
		var me = null
		  , opponent = null;
		if(game.opponents[0].toString() == req.params.as){
			me = game.opponents[0];
			opponent = game.opponents[1];
		}else if(game.opponents[1].toString() == req.params.as){
			me = game.opponents[1];
			opponent = game.opponents[0];
		}else{
			req.flash('error', 'This is not your game!');
			res.redirect('/');
			return;
		}

		// Identify this round
//		if(!game.currentRound){
//			res.redirect('/games/'+game._id+'/'+req.params.as);
//			return;
//		}

		var round = null;
		if(game.currentRound && game.currentRound.toString() == req.params.round){
			round = game.currentRound;
		}else{
			for(var i=0; i<game.rounds.length; i++){
				if(game.rounds[i].toString() == req.params.round){
					round = game.rounds[i];
					break;
				}
			}
		}
		
		if(!round){
			req.flash('error', 'Round not found in this game! '+req.url);
			res.redirect('/');
			return;
		}
		
		var Round = mongoose.model('Round');
		util.log('looking up: '+round);
		Round.findById(round).populate('votes').run(function(err, round){
			util.log('err: '+util.inspect(err));
			util.log('round: '+util.inspect(round));
			// Identify if any votes in this round are for this player
			var my_vote = null
			  , their_vote = null;
			for(var i=0; i<round.votes.length; i++){
				util.log('looking at '+round.votes[i].player+' vs. '+me+' or '+opponent);
				if(round.votes[i].player.toString() == me){
					my_vote = round.votes[i];
					continue;
				}
				if(round.votes[i].player.toString() == opponent){
					their_vote = round.votes[i];
					continue;
				}
			}
	
			res.render('games/view', {
				title: 'In-Progress Game'
			  , game: game
			  , util: util
			  , me: me
			  , opponent: opponent
			  , currentRound: game.currentRound
			  , round: round
			  , my_vote: my_vote
			  , their_vote: their_vote
			});
			return;
		});
	});
});

app.get('/games/:id/:round/:as/:value', function(req, res){
	// View a game in it's current state as the player identified as :as
	if(!req.params.id){
		req.flash('error', 'Invalid Game ID');
		res.redirect('/');
		return;
	}
	if(!req.params.round){
		req.flash('error', 'Missing Round ID');
		res.redirect('/');
		return;
	}
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
	if(!req.params.value){
		req.flash('error', 'Missing Value');
		res.redirect('/games/'+req.params.id+'/'+req.params.round+'/'+req.params.as);
		return;
	}
	if(req.params.value != 'friend' && req.params.value != 'enemy'){
		req.flash('error', req.params.value+' is not a valid value!');
		res.redirect('/games/'+req.params.id+'/'+req.params.round+'/'+req.params.as);
		return;
	}

	Game.findById(req.params.id).run(function(err, game){
		var me = null
		  , opponent = null;
		if(game.opponents[0].toString() == req.params.as){
			me = game.opponents[0];
			opponent = game.opponents[1];
		}else if(game.opponents[1].toString() == req.params.as){
			me = game.opponents[1];
			opponent = game.opponents[0];
		}else{
			req.flash('error', 'This is not your game!');
			res.redirect('/');
			return;
		}

		if(!game.currentRound || game.currentRound.toString() != req.params.round){
			req.flash('error', 'You may not vote on this round as it is not the current round!');
			res.redirect('/games/'+req.params.id+'/'+req.params.round+'/'+req.params.as);
			return;
		}
		
		var Round = mongoose.model('Round');
		Round.findById(game.currentRound).populate('votes').run(function(err, currentRound){
			var is_final = false;
			if(currentRound.votes && currentRound.votes.length){
				util.log('current round: '+util.inspect(currentRound));
				if(currentRound.votes.length == 2){
					// Already have two votes!
					req.flash('error', 'You may not vote on this round!');
					res.redirect('/games/'+game._id+'/'+currentRound._id+'/'+req.params.as);
					return;
				}else if(currentRound.votes[0].player.toString() == req.params.as){
					// currentRound.votes.length == 1
					// And that one vote is this player's
					req.flash('error', 'You\'ve already voted in this round!');
					res.redirect('/games/'+game._id+'/'+currentRound._id+'/'+req.params.as);
					return;
				}else{
					is_final = true;
				}
			}
			// Either there are no votes OR there is one vote but it's the other player's
			// Therefore, this is a valid vote!
			var Vote = mongoose.model('Vote')
			  , vote = new Vote();
			vote.player = req.params.as;
			vote.value = req.params.value;
			currentRound.votes.push(vote);
			if(currentRound.votes.length == 2){
				currentRound.completed = true;
			}
			currentRound.save(function(){
				util.log('saved the current round!');
			});
			vote.save(function(err){
				// Saved the vote!
				if(err){
					util.log('Error saving vote!');
				}
				if(is_final){
					util.log('is_final!');
					game.rounds.push(game.currentRound);
					game.currentRound = null;
					util.log('done!');
					game.save(function(err, game){
						util.log('saved!');
						util.log('game! '+util.inspect(arguments));
						res.redirect('/games/'+game._id+'/'+currentRound._id+'/'+req.params.as);
					});
				}else{
					res.redirect('/games/'+game._id+'/'+currentRound._id+'/'+req.params.as);
				}
				return;
			});
			return;
		});
		return;
	});
});

//// (as, populate, title, object, template, varNames, redirect, beforeRender, beforeSave)
//var as = 'game'
//  , populate = ['opponents', 'currentRound', 'rounds']
//  , template = 'games/form'
//  , varNames = []
//  , redirect = '/games'
//  , formValidate = form(
//	);
//
//app.get('/games/add', utilities.doForm(as, populate, 'Add New Game', Game, template, varNames, redirect));
//app.post('/games/add', formValidate, utilities.doForm(as, populate, 'Add New Game', Game, template, varNames, redirect));
//app.get('/games/edit/:id', utilities.doForm(as, populate, 'Edit Game', Game, template, varNames, redirect));
//app.post('/games/edit/:id', formValidate, utilities.doForm(as, populate, 'Edit Game', Game, template, varNames, redirect));