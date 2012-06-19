jQuery(function(){
	// INIT
	jQuery('#vote > a.vote').click(function(){
		var t = jQuery(this);
		if(!t.hasClass('disabled')){
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
		if(_gaq){
			_gaq.push(['_trackPageview', document.location.pathname+'/chat']);
		}
		return false;
	});
	jQuery('a[href="#chat"]').click(function(){
		jQuery('#chat > .handle > a').click();
		return false;
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
		if(_gaq){
			_gaq.push(['_trackPageview', document.location.pathname+'/me']);
		}
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
		if(_gaq){
			_gaq.push(['_trackPageview', document.location.pathname+'/my-opponent']);
		}
		return false;
	});

	var leaderboard = jQuery('#leaderboard');
	leaderboard.css({
		opacity: 1
	  , bottom: -(leaderboard.hasClass('logged-in') ? 435 : 475)
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
				bottom: -(leaderboard.hasClass('logged-in') ? 435 : 475)
			  , 'z-index': 0
			});
		}
		if(_gaq){
			_gaq.push(['_trackPageview', document.location.pathname+'/leaderboard']);
		}

		if(leaderboard.hasClass('visible') && jQuery('table', leaderboard).length > 0){
			var lastSort = jQuery.cookie('leaderboard_sort');
			if(lastSort){
				lastSort = JSON.parse(lastSort);
				jQuery('table', leaderboard).trigger('sorton', lastSort);
			}
		}
		return false;
	});
	
	jQuery('div[data-src]').each(function(index, item){
		var container = jQuery(item)
		  , url = container.data('src')
		  , spinner = new Spinner().spin();
		container.append(spinner.el);
		container.load(url, function(){
			jQuery('th.name .th-inner', container).tooltip({
				title: 'To appear in the results list, players must play, on average, at least three times a day.'
			});
			jQuery('th.friendliness .th-inner', container).tooltip({
				title: 'Friendliness = The number of times you\'ve chosen friend divided by the number of moves you made.'
			});
			jQuery('th.score .th-inner', container).tooltip({
				title: 'Average Points Per Move (APPM) = your total number of points divided by your total number of moves.'
			});
			// Check the cookie and programmatically sort the table on load
			
			var table = jQuery('table', container).tablesorter().bind('sortEnd', function(){
				// Store the sort in a cookie
				var sort = [];
				jQuery('th', table).each(function(index, item){
					var i = jQuery(item)
					  , event = '/leaderboard-sort'
					  , didSort = false;
					if(i.hasClass('name')){
						event += 'name-';
					}else if(i.hasClass('score')){
						event += 'pointsPerVote-';
					}
					
					if(i.hasClass('headerSortUp')){
						didSort = true;
						event += 'descending';
						sort.push([index, 1]);
					}else if(i.hasClass('headerSortDown')){
						didSort = true;
						event += 'ascending';
						sort.push([index, 0]);
					}

					if(_gaq && didSort){
						_gaq.push(['_trackPageview', document.location.pathname+event]);
					}
				});
				jQuery.cookie('leaderboard_sort', JSON.stringify([sort]));
			});
			
			var lastSort = jQuery.cookie('leaderboard_sort');
			if(container.parent().hasClass('visible') && lastSort){
				lastSort = JSON.parse(lastSort);
				table.trigger('sorton', lastSort);
			}
		});
	});
	
	var faq = jQuery('#faq').modal({show: false})
	  , faqButton = jQuery('#faq-button').hide()
	  , confessButton = jQuery('#confessional-button').hide();
	if(document.location.pathname.match(/^\/games\/(.*)/) || document.location.pathname.match(/^\/$/) || document.location.pathname.match(/^\/confess/) ){
		confessButton.insertAfter('#messages').show();
		faqButton.insertAfter('#messages').show().click(function(){
			faq.modal('toggle');
			if(_gaq){
				_gaq.push(['_trackPageview', document.location.pathname+'/faq']);
			}
		});
	}
	
	var playByPlay = jQuery('#play-by-play').modal({show: false});
	jQuery('#play-by-play-trigger').click(function(){
		playByPlay.modal('toggle');
		if(_gaq){
			_gaq.push(['_trackPageview', document.location.pathname+'/play-by-play']);
		}
	});
	
	jQuery('.tablesorter').tablesorter();
});