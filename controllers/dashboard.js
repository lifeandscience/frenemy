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
		async.sortBy(players, function(player, callback){
			callback(null, player.lastPlayed);
		}, function(err, players){
			var player = players[players.length-1];
			Game.find({_id: {$in: player.games}}).exec(function(err, games){
				async.filter(games, function(item, callback){
					callback(!item.completed);
				}, function(completedGames){
					if(completedGames.length == 0 && games.length > 0){
						async.sortBy(games, function(game, callback){
							callback(null, game.startTime);
						}, function(err, games){
							return res.redirect('/game/'+games[games.length-1]._id);
						});
						return;
					}
					if(completedGames.length == 1){
						return res.redirect('/game/'+completedGames[0]._id);
					}
					return res.render('dashboard', {title: 'Your Profile', player: player, games: completedGames});
				});
			});
		});
	});
});