var form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , Player = mongoose.model('Player')
  , config = require('./config')
  , util = require('util')
  , moment = require('moment')
  , auth = require('./auth');

app.get('/games', auth.authorize(2, 10), function(req, res){
	Game.find({completed: false}).sort('startTime').populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').exec(function(err, games){
		res.render('games/index', {title: 'Active Games', games: games, util: util, moment: moment, page: 0, pages: 1, baseurl: '/games'});
	});
});

var index = function(req, res){
	var page = Number(req.params.page)
	  , perPage = 100;
	if(!page || isNaN(page)){
		page = 0;
	}
	Game.count(function(err, count){
		Game.find().sort('startTime').limit(perPage).skip(page*perPage).populate('opponents').exec(function(err, games){
			res.render('games/index', {title: 'All Games', games: games, util: util, moment: moment, page: page, pages: Math.ceil(count / perPage), baseurl: '/games/all'});
		});
	});
};
app.get('/games/all', auth.authorize(2, 10), index);
app.get('/games/all/:page', auth.authorize(2, 10), index);

var fullyPlayed = function(req, res){
	var page = Number(req.params.page)
	  , perPage = 100;
	if(!page || isNaN(page)){
		page = 0;
	}
	Game.count({$where: 'this.rounds.length == this.numRounds'}, function(err, count){
		Game.find().$where('this.rounds.length == this.numRounds').sort('startTime').limit(perPage).skip(page*perPage).populate('opponents').populate('currentRound').populate('currentRound.votes').populate('rounds').exec(function(err, games){
			res.render('games/index', {title: 'Fully-Played Games', games: games, util: util, moment: moment, page: page, pages: Math.ceil(count / perPage), baseurl: '/games/fully-played'});
		});
	});
};
app.get('/games/fully-played', auth.authorize(2, 10), fullyPlayed);
app.get('/games/fully-played/:page', auth.authorize(2, 10), fullyPlayed);

app.get('/games/start', auth.authorize(2, 10), function(req, res){
	Game.startGames(req, function(){
		req.flash('info', 'Day started successfully!');
		res.redirect('/games');
	});
});
app.get('/games/end', auth.authorize(2, 10), function(req, res){
	Game.endGames(function(){
		req.flash('info', 'Day ended successfully!');
		res.redirect('/games');
	});
});

var getConditionAnswers = function(game, myID, cb){
	var theirID = game.opponents[0].remote_user;
	if(theirID.toString() == myID.toString()){
		theirID = game.opponents[1].remote_user;
	}
	// Ask the auth server for the user's answers
	auth.doAuthServerClientRequest('GET', '/api/1/profile/answerForUserAndQuestion/'+myID+'/'+game.condition._id, null, function(err, myAnswer){

		auth.doAuthServerClientRequest('GET', '/api/1/profile/answerForUserAndQuestion/'+theirID+'/'+game.condition._id, null, function(err, theirAnswer){
			cb(myAnswer, theirAnswer);
		});
	});
}

app.get('/game/:id/walkaway', auth.authorize(2), function(req, res){
	if(!req.param('id')){
		req.flash('error', 'Invalid Game ID');
		res.redirect('back');
		return;
	}
	Game.findById(req.params.id).populate('opponents').exec(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		var me = null
		  , opponent = null;
		if(game.opponents[0]._id.toString() == req.player._id.toString()){
			me = game.opponents[0];
			opponent = game.opponents[1];
		}else if(game.opponents[1]._id.toString() == req.player._id.toString()){
			me = game.opponents[1];
			opponent = game.opponents[0];
		}else{
			req.flash('error', 'This is not your game!');
			res.redirect('/');
			return;
		}
		
		game.walkaway = me;
		game.save(function(err){
			if(err){
				req.flash('error', 'Error saving game.');
				res.redirect('back');
				return;
			}

			me.numWalkaways++;
			me.save(function(err){
				if(err){
					console.log('error saving ', me);
				}
			});
			
			opponent.numWalkedAwayFrom++;
			opponent.save(function(err){
				if(err){
					console.log('error saving ', opponent);
				}
			});
			
			// Notify the auth server!
			auth.doAuthServerClientRequest('POST', '/api/1/events', {
				user: me.remote_user
			  , experimonth: game.experimonth
			  , client_id: process.env.CLIENT_ID
			  , name: 'frenemy:walkaway'
			  , value: opponent.remote_user
			}, function(err, body){
				// TODO: Do something with the result? Or maybe not?
			});
			auth.doAuthServerClientRequest('POST', '/api/1/events', {
				user: opponent.remote_user
			  , experimonth: game.experimonth
			  , client_id: process.env.CLIENT_ID
			  , name: 'frenemy:walkedAwayFrom'
			  , value: me.remote_user
			}, function(err, body){
				// TODO: Do something with the result? Or maybe not?
			});
			
			res.redirect('back');
			return;
		});
	});
});

app.get('/game/:id/:round/complete', auth.authorize(2), function(req, res){
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
/*
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
*/
	Game.findById(req.params.id).populate('opponents').exec(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		if(game.walkaway){
			res.redirect('/game/'+req.params.id);
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
					getConditionAnswers(game, req.session.user._id.toString(), function(my_condition, their_condition){
						var me = null
						  , opponent = null;
						if(game.opponents[0]._id.toString() == req.player._id.toString()){
							me = game.opponents[0];
							opponent = game.opponents[1];
						}else if(game.opponents[1]._id.toString() == req.player._id.toString()){
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
						Round.findById(round).populate('votes').exec(function(err, round){
						
							if(!round.votes || round.votes.length < 2){
								req.flash('error', 'Round not complete!!');
								res.redirect('/game/'+req.params.id+'/'+req.params.round/* +'/'+req.params.as */);
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
							  , my_condition: my_condition
							  , their_condition: their_condition
							});
							return;
						});
					});
				}
			}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').exec(function(err, round){
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

app.get('/game/:id/:round/:value', auth.authorize(2), function(req, res){
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
/*
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
*/
	if(!req.params.value){
		req.flash('error', 'Missing Value');
		res.redirect('/game/'+req.params.id +'/'+req.params.round/* +'/'+req.params.as */);
		return;
	}
	if(req.params.value != 'friend' && req.params.value != 'enemy'){
		req.flash('error', req.params.value+' is not a valid value!');
		res.redirect('/game/'+req.params.id +'/'+req.params.round/* +'/'+req.params.as */);
		return;
	}

	Game.findById(req.params.id).populate('currentRound').exec(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		if(game.walkaway){
			res.redirect('/game/'+req.params.id);
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
					var me = null
					  , opponent = null;
					if(game.opponents[0].toString() == req.player._id.toString()){
						me = game.opponents[0];
						opponent = game.opponents[1];
					}else if(game.opponents[1].toString() == req.player._id.toString()){
						me = game.opponents[1];
						opponent = game.opponents[0];
					}else{
						req.flash('error', 'This is not your game!');
						res.redirect('/');
						return;
					}
			
					if(!game.currentRound){
						req.flash('error', 'You may not vote on this game as there is no current round!');
						res.redirect('/game/'+req.params.id/* +'/'+req.params.as */);
						return;
					}
					
					var Round = mongoose.model('Round');
					Round.findById(game.currentRound).populate('votes').exec(function(err, currentRound){
						if(currentRound.votes && currentRound.votes.length){
							if(currentRound.votes.length == 2){
								// Already have two votes!
								req.flash('error', 'You may not vote on this round!');
								res.redirect('/game/'+game._id+'/'+currentRound._id/* +'/'+req.params.as */);
								return;
							}else if(currentRound.votes[0].player.toString() == req.player._id.toString()){
								// currentRound.votes.length == 1
								// And that one vote is this player's
								req.flash('error', 'You\'ve already voted in this round!');
								res.redirect('/game/'+game._id+'/'+currentRound._id/* +'/'+req.params.as */);
								return;
							}
						}
						// Either there are no votes OR there is one vote but it's the other player's
						// Therefore, this is a valid vote!
						var Vote = mongoose.model('Vote')
						  , vote = new Vote();
						vote.player = req.player._id.toString();
						vote.value = req.params.value;
						vote.game = game;
						vote.save(function(err){
							// Saved the vote!
							if(err){
								util.log('Error saving vote!');
							}
							
							// Notify the auth server!
							auth.doAuthServerClientRequest('POST', '/api/1/events', {
								user: req.player.remote_user
							  , experimonth: game.experimonth
							  , client_id: process.env.CLIENT_ID
							  , name: 'frenemy:vote'
							  , value: req.params.value
							}, function(err, body){
								// TODO: Do something with the result? Or maybe not?
							});
							
							currentRound.votes.push(vote);
							if(currentRound.votes.length == 2){
								currentRound.completed = true;
							}
							currentRound.save(function(err){
								Round.findById(currentRound._id).populate('votes').exec(function(err, round){
									if(round.completed){
										// This round is over!
										// Should adjust the player's votes!
										Player.findById(me).exec(function(err, player){
											var points = round.getPointsForPlayer(me);
											player.score += points;
											// Update my lastPlayed date
											player.numVotes++;
											if(round.getValueForPlayer(me) == 'friend'){
												player.friendCount++;
											}
											player.lastPlayed = new Date();
											player.save();

											// Notify the auth server!
											auth.doAuthServerClientRequest('POST', '/api/1/events', {
												user: player.remote_user
											  , experimonth: game.experimonth
											  , client_id: process.env.CLIENT_ID
											  , name: 'frenemy:endOfRound'
											  , value: points
											}, function(err, body){
												// TODO: Do something with the result? Or maybe not?
											});

											if(currentRound.number.toString() == game.numRounds.toString()){
												player.notifyOfNewRound(round, 'end-of-game', '/game/'+game._id+'/'+round._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of game! '+'/game/'+game._id+'/'+currentRound._id+'/complete');
												});
												game.getPointsForPlayer(me, function(err, points){
													// Notify the auth server!
													auth.doAuthServerClientRequest('POST', '/api/1/events', {
														user: player.remote_user
													  , experimonth: game.experimonth
													  , client_id: process.env.CLIENT_ID
													  , name: 'frenemy:endOfGame'
													  , value: points
													}, function(err, body){
														// TODO: Do something with the result? Or maybe not?
													});
												});
											}else {
												player.notifyOfNewRound(round, 'end-of-round', '/game/'+game._id+'/'+round._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of round! '+'/game/'+game._id+'/'+currentRound._id+'/complete');
												});
											}
										});
										Player.findById(opponent).exec(function(err, player){
											var points = round.getPointsForPlayer(opponent);
											player.score += points;
											player.numVotes++;
											if(round.getValueForPlayer(opponent) == 'friend'){
												player.friendCount++;
											}
											player.save();
											
											// Notify the auth server!
											auth.doAuthServerClientRequest('POST', '/api/1/events', {
												user: player.remote_user
											  , experimonth: game.experimonth
											  , client_id: process.env.CLIENT_ID
											  , name: 'frenemy:endOfRound'
											  , value: points
											}, function(err, body){
												// TODO: Do something with the result? Or maybe not?
											});

											if(currentRound.number.toString() == game.numRounds.toString()){
												player.notifyOfNewRound(round, 'end-of-game', '/game/'+game._id+'/'+round._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of game! '+'/game/'+game._id+'/'+currentRound._id+'/complete');
												});
												game.getPointsForPlayer(opponent, function(err, points){
													// Notify the auth server!
													auth.doAuthServerClientRequest('POST', '/api/1/events', {
														user: player.remote_user
													  , experimonth: game.experimonth
													  , client_id: process.env.CLIENT_ID
													  , name: 'frenemy:endOfGame'
													  , value: points
													}, function(err, body){
														// TODO: Do something with the result? Or maybe not?
													});
												});
											}else {
												player.notifyOfNewRound(round, 'end-of-round', '/game/'+game._id+'/'+round._id+'/complete', function(){
													util.log('did notify '+player.name+' of end of round! '+'/game/'+game._id+'/'+currentRound._id+'/complete');
												});
											}
										});
			
										game.rounds.push(round);
										game.currentRound = null;
										game.save(function(err, game){
											res.redirect('/game/'+game._id+'/'+round._id/* +'/'+req.params.as */);
										});
										
									}else{
										res.redirect('/game/'+game._id+'/'+round._id/* +'/'+req.params.as */);
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
				Round.findById(game.rounds[index]).populate('votes').exec(function(err, round){
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

app.get('/game/:id/:round', auth.authorize(2), function(req, res){
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
/*
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
*/
	Game.findById(req.params.id).populate('opponents').exec(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		if(game.walkaway){
			res.redirect('/game/'+req.params.id);
			return;
		}
		var count = game.rounds.length
		  , Round = mongoose.model('Round')
		  , roundMap = {}
		  , checkDone = function(){
				if(--count == 0){
					getConditionAnswers(game, req.session.user._id.toString(), function(my_condition, their_condition){
						var me = null
						  , opponent = null;
						if(game.opponents[0]._id.toString() == req.player._id.toString()){
							me = game.opponents[0];
							opponent = game.opponents[1];
						}else if(game.opponents[1]._id.toString() == req.player._id.toString()){
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
						Round.findById(round).populate('votes').exec(function(err, round){
							if(round.completed || round.votes.length == 2){
								res.redirect('/game/'+game._id+'/'+round._id+'/complete');
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
							  , my_condition: my_condition
							  , their_condition: their_condition
							});
							return;
						});
					});
				}
			}
		  , populateRound = function(index){
				Round.findById(game.rounds[index]).populate('votes').exec(function(err, round){
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

app.get('/game/:id', auth.authorize(2), function(req, res){
	// View a game in it's current state as the player identified as :as
	if(!req.params.id){
		req.flash('error', 'Invalid Game ID');
		res.redirect('/');
		return;
	}
/*
	if(!req.params.as){
		req.flash('error', 'Missing Player ID');
		res.redirect('/');
		return;
	}
*/
	Game.findById(req.params.id)/*.populate('walkaway')*/.populate('opponents').exec(function(err, game){
		if(err || !game){
			req.flash('error', 'Game not found!');
			res.redirect('/');
			return;
		}
		if(!game.walkaway && game.currentRound && !game.completed){
			res.redirect('/game/'+game._id+'/'+game.currentRound/* +'/'+req.params.as */);
			return;
		}
		
		getConditionAnswers(game, req.session.user._id.toString(), function(my_condition, their_condition){
			var me = null
			  , opponent = null;
			if(game.opponents[0]._id.toString() == req.player._id.toString()){
				me = game.opponents[0];
				opponent = game.opponents[1];
			}else if(game.opponents[1]._id.toString() == req.player._id.toString()){
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
						Round.findById(game.rounds[index]).populate('votes').exec(function(err, round){
							game.rounds[index] = round;
							if(--count == 0){
								res.render('games/completed-game', {
									title: 'Completed Game'
								  , game: game
								  , util: util
								  , me: me
								  , opponent: opponent
								  , my_condition: my_condition
								  , their_condition: their_condition
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
				  , my_condition: my_condition
				  , their_condition: their_condition
				});
	//			res.render('games/completed', {title: 'Completed Game', game: game, util: util, config: config});
			}
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