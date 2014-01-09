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
		var player = players[0];
		Game.populate(player, {path: 'games'}, function(err, player){
			async.filter(player.games, function(item, callback){
				callback(!item.completed);
			}, function(games){
				console.log('err: ', err);
				console.log('games: ', games);
				if(games.length == 1){
					return res.redirect('/game/'+games[0]._id);
				}
				return res.render('dashboard', {title: 'Your Profile', player: player, games: games});
			});
		});
	});
});