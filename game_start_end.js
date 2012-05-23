var mongoose = require('mongoose')
  , db = require('./db')
  , fs = require('fs')
  , util = require('util');

// Models
var dir = __dirname + '/app/models';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	require('./app/models/'+file);
});

var Game = mongoose.model('Game');
Game.endGames(function(){
	setTimeout(function(){
		Game.setupGames(null, function(){
			process.exit(0);
		});
	}, 10000);
});