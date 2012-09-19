$(function() {
	$('body').on('click', '[data-bootbox-confirm]', function(e){
		e.preventDefault();
		var target = $(e.currentTarget);
        bootbox.confirm(target.data('bootbox-confirm'), function(confirmed) {
        	if(confirmed){
	        	document.location = target.attr('href');
        	}
        });
		return false;
	});
	$('body').on('click', '[data-bootbox-alert]', function(e){
		e.preventDefault();
		var target = $(e.currentTarget);
        bootbox.alert(target.data('bootbox-alert'));
		return false;
	});
})