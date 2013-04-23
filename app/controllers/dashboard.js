var util = require('util')
  , auth = require('./auth')
  , moment = require('moment')
  , form = require('express-form')
  , field = form.field
  , utilities = require('./utilities')
  , mongoose = require('mongoose')
  , Game = mongoose.model('Game')
  , Player = mongoose.model('Player');

app.get('/dashboard', auth.authorize(1, 0, null, true), function(req, res){
	Game.populate(req.player, {path: 'games'}, function(err, player){
		return res.render('dashboard', {title: 'Your Profile', player: player});
	});
});