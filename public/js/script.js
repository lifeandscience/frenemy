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
	
	jQuery('div[data-src]').each(function(index, item){
		var container = jQuery(item)
		  , url = container.data('src')
		  , spinner = new Spinner().spin();
		container.append(spinner.el);
		container.load(url, function(){
			var content = jQuery('.content', container)
			  , ul = jQuery('ul', content).css('left', 0)
			  , i = -1
			  , page = 0
			  , numPages = 1
			  , uls = [ul];
			jQuery('<div class="headings"><h3 class="leader">leader</h3><h3 class="score">score</h3></div>').insertBefore(ul);
			var prev = jQuery('<a class="prev disabled"><i class="icon-chevron-left"></i> Previous</a>').insertBefore(content).click(function(){
				if(prev.hasClass('disabled')){
					return;
				}
				var oldPage = uls[page--]
				  , newPage = uls[page];

				oldPage.css({left: oldPage.width()});
				newPage.css({left: 0});

				if(page == 0){
					prev.addClass('disabled');
				}
				if(page+1 < numPages){
					next.removeClass('disabled');
				}
				return false;
			});
			var next = jQuery('<a class="next">Next <i class="icon-chevron-right"></i></a>').insertBefore(content).click(function(){
				if(next.hasClass('disabled')){
					return;
				}

				var oldPage = uls[page++]
				  , newPage = uls[page];

				oldPage.css({left: -oldPage.width()});
				newPage.css({left: 0});

				if(page > 0){
					prev.removeClass('disabled');
				}
				if(page+1 == numPages){
					next.addClass('disabled');
				}
				return false;
			});
			jQuery('li', ul).each(function(index, li){
				if(++i < 5){
					return;
				}
				if(i % 5 == 0){
					// Create a new list and append it!
					ul = jQuery('<ul></ul>').insertAfter(ul);
					uls.push(ul);
					numPages++;
				}
				jQuery(li).appendTo(ul);
			});
			if(numPages == 1){
				next.addClass('disabled');
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