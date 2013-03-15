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

module.exports = {
	setup: function(app){
	
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
						return next();
					});
				}else if(!req.session.user_expires){
					delete req.session.token;
					delete req.session.user;
					delete req.session.user_expires;
					return res.redirect('/login?redirect_uri='+req.url);
				}else if(Date.compare(req.session.user_expires, new Date) == -1){
					// We have a user but it's expired
					// Delete the token, delete the user, and have the user login again to get a new token
					delete req.session.token;
					delete req.session.user;
					delete req.session.user_expires;
					return res.redirect('/login?redirect_uri='+req.url);
				}
			}
			return next();
		});
		return;
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		
		var Player = mongoose.model('Player')
		  , authenticationHandler = function(done){
				return function(err, player, message){
					if(err){
						done(null, false, {message: message});
						return;
					}
	/*
					if(player.state < 1){
						done('Please check your email for the link to confirm your email address and activate your account.', null);
						return;
					}
	*/
					done(err, player, {message: message});
				}
			};
		passport.use(new LocalStrategy({
				usernameField: 'email'
			}
		  , function(email, password, done) {
				Player.authenticate(email, password, authenticationHandler(done));
	/*
				Player.findOne({ email: email }, function(err, player) {
					if (err) { return done(err); }
					if (!player) {
						return done(null, false, { message: 'Unknown user' });
					}
					if (!player.validPassword(password)) {
						return done(null, false, { message: 'Invalid password' });
					}
					return done(null, user);
				});
	*/
			}
		));
		
		passport.use(new FacebookStrategy({
				clientID: process.env.FB_APP_ID || '240269872746246'
			  , clientSecret: process.env.FB_SECRET || '7797ab8af4f7e1cda5e7f9418e7a9db5'
			  , callbackURL: (process.env.BASEURL || 'http://localhost:5000') + '/auth/facebook/callback'
			},
			function(accessToken, refreshToken, profile, done) {
				if(!profile || !profile.emails || profile.emails.length == 0){
					done(new Error('Email must be provided!'), null);
					return;
				}
				Player.facebookAuthenticate(profile, authenticationHandler(done));
				return;
			}
		));;

		passport.use(new TwitterStrategy({
				consumerKey: process.env.TW_CONSUMER_KEY || 'LU94k2MmBtXyp3uoAwPoA'
			  , consumerSecret: process.env.TW_CONSUMER_SECRET || 'hVBOfweBGvtoXR2b0vp5wanDqK0Wgs608bwoso9u8'
			  , callbackURL: (process.env.BASEURL || 'http://localhost:5000') + '/auth/twitter/callback'
			},
			function(token, tokenSecret, profile, done) {
				Player.twitterAuthenticate(profile, authenticationHandler(done));
				return;
			}
		));
		
		// TODO: Figure this out?
		// serialize user on login
		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});
		
		// TODO: Figure this out?
		// deserialize user on logout
		passport.deserializeUser(function(id, done) {
			Player.findById(id, function (err, user) {
				done(err, user);
			});
		});
	
		app.use(passport.initialize());
		app.use(passport.session());
		
		var checkProfile = function(req, res, next){
			var ProfileQuestion = mongoose.model('ProfileQuestion')
			  , ProfileAnswer = mongoose.model('ProfileAnswer');
			ProfileQuestion.find({published: true}).exec(function(err, questions){
				if(err){
					console.log('error retrieving questions: ', arguments);
					next();
					return;
				}
				ProfileAnswer.find({player: req.user._id}).exec(function(err, answers){
					if(err){
						console.log('error retrieving answers: ', arguments);
						next();
						return;
					}
					console.log('questions: ', questions.length, ' answers: ', answers.length);
					req.flash('question');
					if(questions.length > answers.length){
						console.log('posing a question!');
						// There are some un-answered questions!
						// Pick a random question of those that aren't answered
						var answered = {}
						  , availableQuestions = [];
						for(var i=0; i<answers.length; i++){
							answered[answers[i].question] = true;
						}
						for(var i=0; i<questions.length; i++){
							if(!answered[questions[i]._id]){
								availableQuestions.push(questions[i]);
							}
						}
						var question = availableQuestions[Math.floor(Math.random()*availableQuestions.length)];
						app.render('profile/mixins', {question: question, answer: null, active: false}, function(err, html){
							req.flash('question', '<p>Your profile is incomplete! Please answer the following question:</p>'+html);
		/* 					res.redirect('/profile'); */
							next();
						});
						return;
					}
					console.log('stopped');
					// This user has answered all the questions!
					next();
					return;
				});
			});
			return false;
		}

		app.use(function(req, res, next){
			if(req.user){
				// Check if the user has filled out their profile!
				checkProfile(req, res, next);
				return;
			}
			next();
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
			return res.redirect((process.env.AUTH_SERVER || 'http://app.local:8000') + '/logout');
		});
		return;
		
		
		
		
		
		
		
		
		
		
		
		

		var authenticateOptions = {
				successRedirect: '/profile'
			  , failureRedirect: '/login'
			  , successFlash: 'Welcome!'
			  , failureFlash: true
			}
		  , Player = mongoose.model('Player');
		app.get('/login', function(req, res){
			if(req.user){
				res.redirect('/profile');
				return;
			}
			res.render('login', {title: 'Login / Register'});
		});
		app.get('/logout', function(req, res){
			req.logOut();
			res.redirect('/');
		});
		
		
		// LOCAL LOGIN / REGISTRATION
		app.post('/auth/local/login', passport.authenticate('local', authenticateOptions), function(req, res) {
			// If this function gets called, authentication was successful.
			// `req.user` property contains the authenticated user.
			console.log('authentication successful!', req.user);
		});
		app.post('/auth/local/register', function(req, res){
			// TODO: implement!
			var password = req.param('password')
			  , confirmPassword = req.param('confirm-password')
			  , email = req.param('email');
			if(password != confirmPassword){
				req.flash('error', 'Passwords do not match!');
				res.redirect('/login');
				return;
			}
			Player.findOne({email: email}, function(err, player){
				if(err){
					req.flash('error', 'An unexpected error occured. Please try again later.');
					res.redirect('/login');
					return;
				}
				if(player){
					req.flash('error', 'That email address is already in use.');
					res.redirect('/login');
					return;
				}
				// Email address wasn't found, password seems to be good. Let's save!
				player = new Player();
				player.email = email;
				player.password = password;
				player.generateActivationCode();
				player.save(function(err){
					if(err){
						req.flash('error', 'There was an error during registration. Please try again.');
						res.redirect('/login');
						return;
					}
					// Successful!
					// They need to activate the account?
					// Send an email to spur activation
					player.sendActivationEmail();
					
					req.flash('info', 'Registration successful! Please check your email for further instructions.');
					res.redirect('/');
					return;
				});
			});
		});
		app.get('/auth/local/register/resend/:email', function(req, res){
			var email = req.param('email');
			Player.findOne({email: email}, function(err, player){
				if(err || !player){
					req.flash('error', 'Player not found.');
					res.redirect('/login');
					return;
				}

				player.sendActivationEmail();

				req.flash('info', 'Please check your email for further instructions.');
				res.redirect('/');
				return;
			});
		});
		app.get('/auth/local/confirm/:email/:activationCode', function(req, res){
			var email = req.param('email')
			  , activationCode = req.param('activationCode');
			if(!email || !activationCode){
				req.flash('error', 'Missing parameters');
				res.redirect('/login');
				return;
			}
			email = new Buffer(email, 'base64').toString('utf8');
			activationCode = new Buffer(activationCode, 'base64').toString('utf8');
			Player.findOne({email: email}, function(err, player){
				if(err || !player){
					req.flash('error', 'Missing parameters');
					res.redirect('/login');
					return;
				}
				if(player.activationCode != activationCode){
					req.flash('error', 'Invalid activation code!');
					res.redirect('/login');
					return;
				}
				if(player.state > 1){
					req.flash('info', 'You may now login below.');
					res.redirect('/login');
					return;
				}

				// Successful!
				player.state = 2;
				player.save(function(err){
					player.notify('Thanks for confirming your email address!', function(err){
						req.flash('info', 'Your email address was confirmed! You may now login.');
						res.redirect('/login');
						return;
					});
				});
			})
		});
		
		// Redirect the user to Facebook for authentication.  When complete,
		// Facebook will redirect the user back to the application at
		// /auth/facebook/callback
		app.get('/auth/facebook', passport.authenticate('facebook'));
		
		// Facebook will redirect the user to this URL after approval.  Finish the
		// authentication process by attempting to obtain an access token.  If
		// access was granted, the user will be logged in.  Otherwise,
		// authentication has failed.
		app.get('/auth/facebook/callback', passport.authenticate('facebook', authenticateOptions));

		// Redirect the user to Twitter for authentication.  When complete, Twitter
		// will redirect the user back to the application at
		// /auth/twitter/callback
		app.get('/auth/twitter', passport.authenticate('twitter'));
		
		// Twitter will redirect the user to this URL after approval.  Finish the
		// authentication process by attempting to obtain an access token.  If
		// access was granted, the user will be logged in.  Otherwise,
		// authentication has failed.
		app.get('/auth/twitter/callback', passport.authenticate('twitter', authenticateOptions));
		
		
		app.post('/auth/addEmail', function(req, res){
			// TODO: implement!
			var email = req.param('email');
			if(!req.user){
				// How did this happen?!
				req.flash('error', 'You must be logged in to add your email address!');
				res.redirect('/login');
				return;
			}
			if(!email){
				req.flash('error', 'Please input your email address!');
				res.redirect('/profile');
				return;
			}
			req.user.email = email;
			req.user.state = 0;
			req.user.generateActivationCode();
			req.user.save(function(err){
				if(err){
					req.flash('error', 'There was an error during registration. Please try again.');
					res.redirect('/login');
					return;
				}
				// Successful!
				// They need to activate the account?
				// Send an email to spur activation
				req.user.sendActivationEmail();
				
				req.flash('info', 'Your email was successfully added! Please check your email for further instructions.');
				res.redirect('/');
				return;
			});
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
					res.redirect('back');
					return;
				}
				// We're authorized!
				return next();
			}
			req.flash('error', 'Please login to access that page!');
			return res.redirect('back');
		
		
		
		
		
		
		
		
		
		
			if(!req.user || req.user.state < requiredState){
				if(!message){
					console.log(req.user);
					if(req.user && req.user.state == 0){
						message = 'Please check your email to confirm your address. (<a href="/auth/local/register/resend/'+req.user.email+'">Resend?</a>)';
					}else{
						message = 'Please login to access that page.';
					}
				}
				req.flash('error', message);
				res.redirect('back');
				return;
			}
			if(!req.user || req.user.role < requiredRole){
				if(!message){
					message = 'You are not authorized to view that page!';
				}
				req.flash('error', message);
				res.redirect('back');
				return;
			}
			// We're authorized!
			// No longer calling checkProfile
			next();
			return;
			
			
			
			

			// Check if we need to answer questions
			if(req.user.role >= 10 || skipQuestionCount){
				// If we're an admin, we don't check for questions
				next();
				return;
			}
			console.log('calling checkProfile');
			checkProfile(req, res, next);
		};
	}
};