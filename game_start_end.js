var mongoose = require('mongoose')
  , db = require('./db')
  , fs = require('fs')
  , util = require('util');

// Models
var dir = __dirname + '/models';
// grab a list of our route files
fs.readdirSync(dir).forEach(function(file){
	require('./models/'+file);
});

var d = new Date()
  , h = d.getHours()
/*
if(h != 0 && h != 8 && h != 16){
	process.exit(0);
}
*/

var Game = mongoose.model('Game');
Game.endGames(function(){
	setTimeout(function(){
		Game.startGames(null, function(){
			process.exit(0);
		});
	}, 10000);
});