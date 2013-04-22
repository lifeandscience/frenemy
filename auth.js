var mongoose = require('mongoose')
  , fs = require('fs')
  , jade = require('jade')
  , moment = require('moment')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , credentials = {
		clientID: process.env.CLIENT_ID || '514343e91b3e5f2287000001'
	  , clientSecret: process.env.CLIENT_SECRET || '232212a0e6781b1852c3d43e42246a95'
	  , site: process.env.AUTH_SERVER || 'http://app.local:8000'
	  , authorizationPath: '/oauth/authorize'
	  , tokenPath: '/oauth/access_token'
	}
  , OAuth2 = require('simple-oauth2')(credentials)
  , redirect_uri = (process.env.BASEURL || 'http://localhost:5000') + '/oauth/callback'
  , request = require('request');

var client_access_token = null;

module.exports = {
	clientID: credentials.clientID
	// This is for doing a request to the auth server by the client (not on behalf of a user)
	// callback should be: function(err, res, body)
  , doAuthServerClientRequest: function(method, path, params, callback){
		var gotAccessToken = function(){
			params = params || {};
			params.access_token = client_access_token;
			OAuth2.ClientCredentials.request(method, path, params, function(err, res, body){
				if(body && body.error && body.error == 'Access token expired!'){
					// generate a new access_token
					client_access_token = null;
					return doAuthServerClientRequest(method, path, params, callback);
				}
				return callback(err, res, body);
			});
		};
		if(!client_access_token){
			return OAuth2.ClientCredentials.getToken({}, function(err, result){
				client_access_token = result.access_token;
				gotAccessToken();
			});
		}
		gotAccessToken();
	}
  , setup: function(app){
	
		app.use(function(req, res, next){
			if(req.session.token){
				if(!req.session.user){
					// We don't have info about a user 
					console.log('token but no user!');
					// Use the token to request the user from the auth server
					return request({
						uri: (process.env.AUTH_SERVER || 'http://app.local:8000') + '/profile/get?access_token='+req.session.token.access_token
					  , json: true
					}, function (error, response, body) {
						if(error || response.statusCode != 200){
							return next(new Error('Error connecting to auth server'));
						}
						if(body.error || !body.expires || !body.user){
							return next(new Error('Error retrieving user information: '+body.error));
						}
						req.session.user = body.user;
						req.session.user_expires = new Date(body.expires);
						
						var Player = mongoose.model('Player');
						Player.find({remote_user: req.session.user._id}).exec(function(err, player){
							if(err){
								console.log('error finding player: ', err);
								return next(err);
							}
							if(!player){
								// Player doesn't exist, so create one!
								var player = new Player();
								player.remote_user = req.session.user._id;
								return player.save(function(err, player){
									if(err){
										console.log('error saving player: ', err);
										return next(err);
									}
									req.session.player = player;
									return next();
								});
							}
							req.session.player = player;
							return next();
						});
						
					});
				}else if(!req.session.user_expires){
					delete req.session.token;
					delete req.session.user;
					delete req.session.user_expires;
					delete req.session.player;
					return res.redirect('/login?redirect_uri='+req.url);
				}else if(Date.compare(req.session.user_expires, new Date) == -1){
					// We have a user but it's expired
					// Delete the token, delete the user, and have the user login again to get a new token
					delete req.session.token;
					delete req.session.user;
					delete req.session.user_expires;
					delete req.session.player;
					return res.redirect('/login?redirect_uri='+req.url);
				}
			}
			return next();
		});
	}
  , route: function(app){
		app.get('/oauth/callback', function(req, res){
			// We're not handling the grant callback (where we'd request the token)
			// Get the token
			OAuth2.AuthCode.getToken({
				code: req.param('code')
			  , redirect_uri: redirect_uri
			}, function(error, result) {
				if(error){
					console.log('Access Token Error', error.message);
					req.flash('error', 'There was an error retreiving an access token!');
					return res.redirect('/');
				}
				console.log('got token? ', arguments);
				req.session.token = result;
				if(req.session.redirect_uri){
					var uri = req.session.redirect_uri;
					delete req.session.redirect_uri;
					return res.redirect(uri);
				}
				res.redirect('/');
			});
			return;
		});
		app.get('/login', function(req, res, next){
			if(req.session.token){
				// We should do something with this token!
				var token = OAuth2.AccessToken.create(req.session.token);
				console.log('have token!', token);
				// TODO: We can't use this as the oauth provider code doesn't set expiration
				// We should replace this with a call to the server to determine if the user's session is still available / active
//				if(!token.expired()){
					// Can continue!
					if(req.param('redirect_uri')){
						return res.redirect(req.param('redirect_uri'));
					}
					return res.redirect('/');
//				}
//				// Need to refresh, so delete and fall-through;
//				delete req.session.token;
			}
			
			// We've fallen through to here, meaning
			//	- We don't have a token in our session
			//	- So, we need to push the user to the auth server to login
			req.session.redirect_uri = req.url;
			var authorization_uri = OAuth2.AuthCode.authorizeURL({
				redirect_uri: redirect_uri
			  , scope: '<scope>'
			  , state: '<state>'
			});
			res.redirect(authorization_uri);
		});
		app.get('/logout', function(req, res, next){
			delete req.session.redirect_uri;
			delete req.session.token;
			delete req.session.user;
			delete req.session.user_expires;
			delete req.session.player;
			return res.redirect((process.env.AUTH_SERVER || 'http://app.local:8000') + '/logout');
		});
	}
  , authorize: function(requiredState, requiredRole, message, skipQuestionCount){
		if(!requiredState){
			requiredState = 0;
		}
		if(!requiredRole){
			requiredRole = 0;
		}
		return function(req, res, next){
			if(req.session && req.session.user){
				// We have a user!
				if(req.session.user.role < requiredRole){
					// But the user doesn't have an appropriate role
					req.flash('error', 'You are not authorized to view that page!');
					res.redirect('/');
					return;
				}
				// We're authorized!
				return next();
			}
			req.flash('error', 'Please login to access that page!');
			return res.redirect('/');
		};
	}
};