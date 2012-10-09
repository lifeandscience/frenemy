var mongoose = require('mongoose')
  , fs = require('fs')
  , jade = require('jade')
  , moment = require('moment')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy;


module.exports = {
	setup: function(app){
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
	}
  , route: function(app){
		var authenticateOptions = {
				successRedirect: '/profile'
			  , failureRedirect: '/login'
			  , successFlash: 'Welcome!'
			  , failureFlash: true
			}
		  , Player = mongoose.model('Player');
		app.get('/login', function(req, res){
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
			// Check if we need to answer questions
			if(req.user.role >= 10 || skipQuestionCount){
				// If we're an admin, we don't check for questions
				next();
				return;
			}
			
			var ProfileQuestion = mongoose.model('ProfileQuestion')
			  , ProfileAnswer = mongoose.model('ProfileAnswer');
			ProfileQuestion.count({published: true}).exec(function(err, numQuestions){
				if(err){
					console.log('error retrieving questions: ', arguments);
					next();
					return;
				}
				ProfileAnswer.count({player: req.user._id}).exec(function(err, numAnswers){
					if(err){
						console.log('error retrieving answers: ', arguments);
						next();
						return;
					}
					if(numQuestions != numAnswers){
						// There are some un-answered questions!
						req.flash('error', 'Your profile is incomplete! You\'ve been redirected to <a href="/profile">your profile</a>; please answer all "additional information" questions then try your previous action again.');
						res.redirect('/profile');
						return;
					}
					// This user has answered all the questions!
					next();
					return;
				});
			});
		};
	}
};