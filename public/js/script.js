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
	  , bottom: -(leaderboard.height() - leaderboard.find('.handles').height() - 5) //(leaderboard.hasClass('logged-in') ? 435 : 500)
	});
	var whichLeaderBoardVisible = null;
	jQuery('#leaderboard > .handles > .handle > a').click(function(){
		var t = jQuery(this)
		  , p = t.parent()
		  , pp = p.parent().parent();
		if(leaderboard.hasClass('visible') && p.hasClass('handle-stats') && whichLeaderBoardVisible == 'scoring'){
			// Switch to stats
			whichLeaderBoardVisible = 'stats';
			pp.find('.inner').hide();
			pp.find('.inner-stats').show();
			return false;
		}else if(leaderboard.hasClass('visible') && p.hasClass('handle-scoring') && whichLeaderBoardVisible == 'stats'){
			// Switch to scoring
			whichLeaderBoardVisible = 'scoring';
			pp.find('.inner').hide();
			pp.find('.inner-scoring').show();
			return false;
		}

		leaderboard.toggleClass('visible');
		if(leaderboard.hasClass('visible')){
			leaderboard.css({
				bottom: 0
			  , 'z-index': 200
			});
		}else{
			leaderboard.css({
				bottom: -(leaderboard.height() - leaderboard.find('.handles').height() - 5) //(leaderboard.hasClass('logged-in') ? 435 : 500)
			  , 'z-index': 0
			});
		}
		if(p.hasClass('handle-stats')){
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
			pp.find('.inner').hide();
			pp.find('.inner-stats').show();
			whichLeaderBoardVisible = 'stats';
		}else if(p.hasClass('handle-scoring')){
			pp.find('.inner').hide();
			pp.find('.inner-scoring').show();
			whichLeaderBoardVisible = 'scoring';
		}
		return false;
	});
	
	jQuery('div[data-src]').each(function(index, item){
		var container = jQuery(item)
		  , url = container.data('src');
/* 		  , spinner = new Spinner().spin(); */
/* 		container.append(spinner.el); */
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
	
	console.log('connecting to: ', _BASEURL);
	var socket = io.connect(_BASEURL);
	socket.on('news', function (data) {
		console.log(data);
		socket.emit('my other event', { my: 'data' });
	});
	jQuery(document).trigger('socket-ready', socket);
	
	var game = jQuery('[data-game-id]');
	if(game.length){
		game = game.data('game-id');
		socket.on('game-'+game, function(data){
			document.location.reload();
		});
	}

	
	jQuery('.vote a[data-reputation-request="true"]').click(function(){
		var t = jQuery(this)
		  , url = t.attr('href');
		jQuery('#reputation-request').modal('toggle').find('.modal-body a.btn').unbind('click').click(function(){
			// Submit this URL, then send the user to url
			var a = jQuery(this);
			jQuery.ajax({
				dataType: "json",
				url: a.attr('href'),
				success: function(){
					document.location = url;
				},
				error: function(){
					alert('error submitting reputation, try again');
				}
			});
			return false;
		});
		return false;
	});
	if(jQuery('#mood-request').length == 0){
		jQuery('#cooperation-display').modal('toggle');
		jQuery('#opponent.toShow').modal('toggle');
	}
	jQuery('#mood-request').modal('toggle').on('shown.bs.modal', function(){
		jQuery('#stressed-slider').slider();
		jQuery('#happy-slider').slider();
		jQuery('#tired-slider').slider();
	});
	jQuery('#mood-request form').on('submit', function(){
		var t = jQuery(this);
		jQuery.ajax({
			dataType: 'json',
			url: t.attr('action'),
			data: t.serialize(),
			success: function(){
				jQuery('#mood-request').modal('toggle');
			},
			error: function(){
				alert('error submitting mood, try again');
			}
		});
		return false;
	});
	jQuery('#mood-request').on('hidden.bs.modal', function(){
		jQuery('#cooperation-display').modal('toggle');
		jQuery('#opponent.toShow').modal('toggle');
	});
	if(jQuery('#cooperation-display').length > 0){
		jQuery('#cooperation-display').on('shown.bs.modal', function(){
			jQuery(this).find('div[data-cooperation-src]').each(function(index, item){
				var container = jQuery(item)
				  , url = container.data('cooperation-src');
				jQuery.getJSON(url, function(data){
					container.empty();
					var days = data.days;
					new Ico.LineGraph(
						"cooperation-display-container",                               // DOM element where the graph will be rendered
						[                                                // The 2 series
							data.values // Drawn first
						],
						{                                                // Graph components' options
							min: 0,
							max: 100,
							colors: ['#228899'],               // Series' colors
							curve_amount: 10,                              // Slightly curve series' lines path using Cubic B&eacute;zier
							mouseover_attributes: { stroke: 'green' },     // When hovering over values
							font_size: 16,                                 // for both labels and value labels and other elements
							labels: { values: days, angle: 0 },         // Set labels at a 30 degres angle
							x_padding_right: 40,                           // Make more room on the right to properly display labels
							units: '%',                                    // $ units to display values
							units_position: 1,                             // Render $ before values
							value_labels: {                                // Controls value labels
								marker_size: 4                               // Value labels markers set to 4 pixels instead of 5
							},
							background: { color: '#FFF', corners: 5 },     // Set entire div background color and corner size 
							meanline: false,                                // Display mean value of all series
							grid: true,                                    // Display a grid from labels and value labels
							mouse_pointer: true,                           // Display a cross mouse pointer in graph area
							status_bar : true,                             // Display status bar to show values on mouse over
						}
					)
				});
			});
		});
	}
});