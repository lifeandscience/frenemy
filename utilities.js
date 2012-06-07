var async = require('async')
  , util = require('util');

module.exports = {
	doForm: function(as, populate, title, object, template, varNames, redirect, beforeRender, beforeSave, layout){
		return function(req, res){
	
			var validated = false;
			if(req.method == 'POST'){
				validated = req.form.isValid;
				if(!validated){
					util.log('errors: '+util.inspect(req.form.errors));
				}
			}
			
			var item = null;
			async.series([
				function(callback){
					if(req.params && req.params.id){
						var query = object.findById(req.params.id);
						if(populate){
							query.populate(populate);
						}
						query.run(callback);
					}else{
						callback(null);
					}
				},
			],
			function(callback, doc){
				if(doc[0]){
					item = doc[0];
				}
	
				if(validated){
					if(!item){
						item = new object();
					}
					varNames.forEach(function(name){
						if(req.form[name]){
							item[name] = req.form[name];
						}
					});
					if(beforeSave){
						item = beforeSave(req, res, item);
					}
					item.save(function(err, result){
						if(err){
							var obj = {title: title};
							obj[as] = item;
							if(beforeRender){
								obj = beforeRender(obj);
							}
							if(layout){
								util.log('layout: '+layout);
								obj.layout = layout;
							}
							util.log('rendering: '+util.inspect(obj));
							res.render(template, obj);
							return;
						}
						res.redirect(redirect);
						return;
					});
					return;
				}
	
				if(!item){
					item = {};
				}
				var obj = {title: title};
				obj[as] = item;
				if(beforeRender){
					obj = beforeRender(obj);
				}
				if(layout){
					util.log('layout: '+layout);
					obj.layout = layout;
				}
				util.log('rendering: '+util.inspect(obj));
				res.render(template, obj);
				return;
			});
		}
	}
	
  , getByID: function(object, title, populate){
		if(!populate){
			populate = [];
		}
		return function(req, res, next){
			if(req.params && req.params.id){
				var query = object.findById(req.params.id);
				for(var i=0; i<populate.length; i++){
					query.populate(populate[i]);
				}
				query.run(function(err, item){
					if(!err){
						req[title] = item;
					}else{
						req.flash('error', title+' not found.');
					}
					next();
				});
				return;
			}
			req.flash('error', 'No '+title+' ID provided');
			next();
		}
	}

  , checkAdmin: function(req, res, next){
		if(req.loggedIn && req.user && req.user.isAdmin){
			// Check if they're an admin!
			next();
			return;
		}
		req.flash('error', 'You are not authorized to view that resource!');
		res.redirect('/');
	}
}