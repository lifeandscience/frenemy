var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , Player = mongoose.model('Player')
  , config = require('./config')
  , util = require('util')
  , moment = require('moment');

app.get('/games', utilities.checkAdmin, function(req, res){
	Game.find({completed: false}).asc('startTime').populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').run(function(err, games){
		res.render('games/index', {title: 'Active Games', games: games, util: util, moment: moment});
	});
});

app.get('/games/all', utilities.checkAdmin, function(req, res){
	Game.find().asc('startTime').populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').run(function(err, games){
		res.render('games/index', {title: 'All Games', games: games, util: util, moment: moment});
	});
});

app.get('/games/fully-played', utilities.checkAdmin, function(req, res){
	Game.find().$where('this.rounds.length == this.numRounds').asc('startTime').populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').run(function(err, games){
		res.render('games/index', {title: 'Fully-Played Games', games: games, util: util, moment: moment});
	});
});

app.get('/games/start', utilities.checkAdmin, function(req, res){
	Game.setupGames(req, function(){
		req.flash('info', 'Day started successfully!');
		res.redirect('/games');
	});
});

app.get('/games/end', utilities.checkAdmin, function(req, res){
	Game.endGames(function(){
		req.flash('info', 'Day ended successfully!');
		res.redirect('/games');
	});
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
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		if(game.currentRound && !game.completed){
			res.redirect('/games/'+game._id+'/'+game.currentRound+'/'+req.params.as);
			return;
		}

		var me = null
		  , opponent = null;
		if(game.opponents[0]._id.toString() == req.params.as){
			me = game.opponents[0];
			opponent = game.opponents[1];
		}else if(game.opponents[1]._id.toString() == req.params.as){
			me = game.opponents[1];
			opponent = game.opponents[0];
		}else{
			req.flash('error', 'This is not your game!');
			res.redirect('/');
			return;
		}

		if(game.rounds.length > 0){
			var count = game.rounds.length
			  , Round = mongoose.model('Round')
			  , roundMap = {}
			  , populateRound = function(index){
					Round.findById(game.rounds[index]).populate('votes').run(function(err, round){
						game.rounds[index] = round;
						if(--count == 0){
							res.render('games/completed-game', {
								title: 'Completed Game'
							  , game: game
							  , util: util
							  , me: me
							  , opponent: opponent
							});
//							res.render('games/completed', {title: 'Completed Game', game: game, util: util, config: config});
							return;
						}
					});
				};
			for(var i=0; i<game.rounds.length; i++){
				populateRound(i);
			}
		}else{
			res.render('games/completed-game', {
				title: 'Completed Game'
			  , game: game
			  , util: util
			  , me: me
			  , opponent: opponent
			});
//			res.render('games/completed', {title: 'Completed Game', game: game, util: util, config: config});
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
	Game.findById(req.params.id).populate('opponents').run(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
				
					var me = null
					  , opponent = null;
					if(game.opponents[0]._id.toString() == req.params.as){
						me = game.opponents[0];
						opponent = game.opponents[1];
					}else if(game.opponents[1]._id.toString() == req.params.as){
						me = game.opponents[1];
						opponent = game.opponents[0];
					}else{
						req.flash('error', 'This is not your game!');
						res.redirect('/');
						return;
					}
					
			/*
					if(game.completed){
						res.redirect('/games/'+req.params.id+'/'+req.params.as);
						return;
					}
			*/
			
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
							if(game.rounds[i]._id.toString() == req.params.round){
								round = game.rounds[i];
								break;
							}
						}
					}
					
					if(!round){
						res.render('games/round-expired', {
							title: 'Game Expired'
						  , game: game
						  , util: util
						  , me: me
						  , opponent: opponent
						});
						return;
					}
					
					var Round = mongoose.model('Round');
					Round.findById(round).populate('votes').run(function(err, round){
						// Identify if any votes in this round are for this player
						var my_vote = null
						  , their_vote = null;
						for(var i=0; i<round.votes.length; i++){
							if(round.votes[i].player.toString() == me._id.toString()){
								my_vote = round.votes[i];
								continue;
							}
							if(round.votes[i].player.toString() == opponent._id.toString()){
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
				}
			}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').run(function(err, round){
					game.rounds[index] = round;
					checkDone();
				});
			};
		if(game.rounds.length > 0){
			for(var i=0; i<game.rounds.length; i++){
				populateRound(i);
			}
		}else{
			count = 1;
			checkDone();
		}
	});
});

app.get('/games/:id/:round/:as/complete', function(req, res){
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
	Game.findById(req.params.id).populate('opponents').run(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
			
					var me = null
					  , opponent = null;
					if(game.opponents[0]._id.toString() == req.params.as){
						me = game.opponents[0];
						opponent = game.opponents[1];
					}else if(game.opponents[1]._id.toString() == req.params.as){
						me = game.opponents[1];
						opponent = game.opponents[0];
					}else{
						req.flash('error', 'This is not your game!');
						res.redirect('/');
						return;
					}
					
			/*
					if(game.completed){
						res.redirect('/games/'+req.params.id+'/'+req.params.as);
						return;
					}
			*/
			
					// Identify this round
			//		if(!game.currentRound){
			//			res.redirect('/games/'+game._id+'/'+req.params.as);
			//			return;
			//		}
			
					var round = null;
					util.log('currentRound: '+game.currentRound);
					util.log('vs current: '+req.params.round);
					if(game.currentRound && game.currentRound.toString() == req.params.round){
						round = game.currentRound;
					}else{
						for(var i=0; i<game.rounds.length; i++){
							if(game.rounds[i]._id.toString() == req.params.round){
								round = game.rounds[i];
								break;
							}
						}
					}
					
					if(!round){
						res.render('games/round-expired', {
							title: 'Game Expired'
						  , game: game
						  , util: util
						  , me: me
						  , opponent: opponent
						});
						return;
					}
					
					var Round = mongoose.model('Round');
					Round.findById(round).populate('votes').run(function(err, round){
					
						if(!round.votes || round.votes.length < 2){
							req.flash('error', 'Round not complete!!');
							res.redirect('/games/'+req.params.id+'/'+req.params.round+'/'+req.params.as);
							return;
						}
			
						// Identify if any votes in this round are for this player
						var my_vote = null
						  , their_vote = null;
						for(var i=0; i<round.votes.length; i++){
							if(round.votes[i].player.toString() == me._id.toString()){
								my_vote = round.votes[i];
								continue;
							}
							if(round.votes[i].player.toString() == opponent._id.toString()){
								their_vote = round.votes[i];
								continue;
							}
						}
				
						res.render('games/completed-round', {
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
				}
			}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').run(function(err, round){
					game.rounds[index] = round;
					checkDone();
				});
			};
		if(game.rounds.length > 0){
			for(var i=0; i<game.rounds.length; i++){
				populateRound(i);
			}
		}else{
			count = 1;
			checkDone();
		}
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
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
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
						if(currentRound.votes && currentRound.votes.length){
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
							}
						}
						// Either there are no votes OR there is one vote but it's the other player's
						// Therefore, this is a valid vote!
						var Vote = mongoose.model('Vote')
						  , vote = new Vote();
						vote.player = req.params.as;
						vote.value = req.params.value;
						vote.game = game;
						vote.save(function(err){
							// Saved the vote!
							if(err){
								util.log('Error saving vote!');
							}
							
							currentRound.votes.push(vote);
							if(currentRound.votes.length == 2){
								currentRound.completed = true;
							}
							currentRound.save(function(err){
								Round.findById(currentRound._id).populate('votes').run(function(err, round){
									if(round.completed){
										// This round is over!
										// Should adjust the player's votes!
										Player.findById(me).run(function(err, player){
											player.score += round.getPointsForPlayer(me);
											// Update my lastPlayed date
											player.lastPlayed = Date.now();
											player.save();
											if(currentRound.number.toString() == game.numRounds.toString()){
												player.notifyOfNewRound(round, 'end-of-game', '/games/'+game._id+'/'+round._id+'/'+player._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of game! '+'/games/'+game._id+'/'+currentRound._id+'/'+player._id+'/complete');
												});
											}else {
												player.notifyOfNewRound(round, 'end-of-round', '/games/'+game._id+'/'+round._id+'/'+player._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of round! '+'/games/'+game._id+'/'+currentRound._id+'/'+player._id+'/complete');
												});
											}
										});
										Player.findById(opponent).run(function(err, player){
											player.score += round.getPointsForPlayer(opponent);
											player.save();
											if(currentRound.number.toString() == game.numRounds.toString()){
												player.notifyOfNewRound(round, 'end-of-game', '/games/'+game._id+'/'+round._id+'/'+player._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of game! '+'/games/'+game._id+'/'+currentRound._id+'/'+player._id+'/complete');
												});
											}else {
												player.notifyOfNewRound(round, 'end-of-round', '/games/'+game._id+'/'+round._id+'/'+player._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of round! '+'/games/'+game._id+'/'+currentRound._id+'/'+player._id+'/complete');
												});
											}
										});
			
										game.rounds.push(round);
										game.currentRound = null;
										game.save(function(err, game){
											res.redirect('/games/'+game._id+'/'+round._id+'/'+req.params.as);
										});
									}else{
										res.redirect('/games/'+game._id+'/'+round._id+'/'+req.params.as);
									}
								});
							});
							return;
						});
						return;
					});
				}
			}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').run(function(err, round){
					game.rounds[index] = round;
					checkDone();
				});
			};
		if(game.rounds.length > 0){
			for(var i=0; i<game.rounds.length; i++){
				populateRound(i);
			}
		}else{
			count = 1;
			checkDone();
		}
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