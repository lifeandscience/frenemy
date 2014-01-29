var util = require('util')
  , auth = require('./auth')
  , moment = require('moment')
  , form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , Player = mongoose.model('Player')
  , async = require('async');

app.get('/play', auth.authorize(1, 0, null, true), function(req, res){
	Player.find({remote_user: req.session.user._id}).exec(function(err, players){
		if(err || !players || players.length == 0){
			console.log('no players found for current user: ', err);
			return res.redirect('/');
		}

		Game.find({opponents: {$in: players}}).exec(function(err, games){
			async.filter(games, function(item, callback){
				callback(!item.completed);
			}, function(incompleteGames){
				if(incompleteGames.length == 0 && games.length > 0){
					async.sortBy(games, function(game, callback){
						callback(null, game.startTime);
					}, function(err, games){
						return res.redirect('/game/'+games[games.length-1]._id);
					});
					return;
				}
				if(incompleteGames.length > 0){
					return res.redirect('/game/'+incompleteGames[0]._id);
				}
				return res.render('dashboard', {title: 'Your Profile', player: player, games: games});
			});
		});
	});
});