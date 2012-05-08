exports.staticHelpers = {
};

exports.dynamicHelpers = {
	errorMessages: function(req, res){
		
	},
	flashMessages: function(req, res) {
		var html = '';
		['error', 'info'].forEach(function(type) {
			var messages = req.flash(type);
			if (messages.length > 0) {
				messages.forEach(function(message){
					html += '<div class="alert alert-block alert-'+(type == 'info' ? 'warning' : type)+' fade in"><a class="close" data-dismiss="alert" href="#">×</a>'+message+'</div>';
				});
			}
		});
		return html;
	}
};
