var util = require('util')
  , less = require('less')
  , auth = require('./auth');

app.get('/', auth.authorize(), function(req, res){
	if(req.user){
		if(req.user.role >= 10){
			return res.redirect('/games');
		}
		if(req.user.experimonths){
			for(var i=0; i<req.user.experimonths.length; i++){
				if(req.user.experimonths[i].kind.toString() == auth.clientID){
					// Found that the user is in an Experimonth with this Kind
					return res.redirect('/play');
				}
			}
		}
	}
	res.render('index', {title: 'Welcome to Frenemy!', util: util});
});
app.get('/login', function(req, res){
	res.redirect('/auth/facebook');
	return;
});