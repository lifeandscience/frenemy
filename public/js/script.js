jQuery(function(){
	// INIT
	jQuery('#vote > a').click(function(){
		var t = jQuery(this);
		if(!t.hasClass('disabled')){
			return window.confirm('Are you sure you meant to select '+t.html()+'?');
		}
		return false;
	});
});