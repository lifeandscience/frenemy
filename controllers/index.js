var util = require('util')
  , less = require('less')
  , auth = require('./auth');

app.get('/', function(req, res){
	console.log('user: ', req.session.user);
	if(req.session.user){
		if(req.session.user.role >= 10){
			return res.redirect('/play');
		}
		if(req.session.user.experimonths){
			for(var i=0; i<req.session.user.experimonths.length; i++){
				if(req.session.user.experimonths[i].kind.toString() == auth.clientID){
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