jQuery(function(){
	// INIT
	jQuery('#vote > a.vote').click(function(){
		var t = jQuery(this);
		console.log('t: ', t);
		if(!t.hasClass('disabled')){
			console.log('what?');
			t.addClass('chosen');
			var h3 = jQuery('h3', t);
			if(window.confirm('Are you sure you meant to select '+h3.html()+'?')){
				return true;
			}
			t.removeClass('chosen');
		}
		return false;
	});

	var chat = jQuery('#chat');
	chat.css({
		opacity: 1
	  , top: -570
	});
	jQuery('#chat > .handle > a').click(function(){
		chat.toggleClass('visible');
		if(chat.hasClass('visible')){
			chat.css({
				top: 0
			  , 'z-index': 200
			});
		}else{
			chat.css({
				top: -570
			  , 'z-index': 0
			});
		}
	});
	jQuery('a[href="#chat"]').click(function(){
		console.log('woo?');
		jQuery('#chat > .handle > a').click();
		return false;
	});

	var leaderboard = jQuery('#leaderboard');
	leaderboard.css({
		opacity: 1
	  , bottom: -2000
	});
	jQuery('#leaderboard > .handle > a').click(function(){
		leaderboard.toggleClass('visible');
		if(leaderboard.hasClass('visible')){
			leaderboard.css({
				bottom: 0
			  , 'z-index': 200
			});
		}else{
			leaderboard.css({
				bottom: -675
			  , 'z-index': 0
			});
		}
	});
		
	var me = jQuery('#me');
	me.css({
		opacity: 1
	  , left: -550
	});
	jQuery('#me > .handle > a').click(function(){
		me.toggleClass('visible');
		if(me.hasClass('visible')){
			me.css({
				left: 0
			  , 'z-index': 100
			});
		}else{
			me.css({
				left: -550
			  , 'z-index': 0
			});
		}
//		jQuery('.icon-white', me).toggleClass('icon-forward').toggleClass('icon-backward');
		return false;
	});

	var myOpponent = jQuery('#my-opponent');
	myOpponent.css({
		opacity: 1
	  , right: -550
	});
	jQuery('#my-opponent > .handle > a').click(function(){
		myOpponent.toggleClass('visible');
		if(myOpponent.hasClass('visible')){
			myOpponent.css({
				right: 0
			  , 'z-index': 100
			});
		}else{
			myOpponent.css({
				right: -550
			  , 'z-index': 0
			});
		}
		return false;
	});
});