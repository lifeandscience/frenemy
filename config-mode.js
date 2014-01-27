/*
	Known Modes:
		- neutral
		- walkaway
			- Enable walkaway option
		- play-by-play
			- Enable play-by-play popup window showing the history of this game
		- condition-random
			- Utilize a random condition provided by the auth server
		- condition
			- Utilize a specific condition provided by the auth server
			- MUST provide a 'slug' or 'id' param indicating the slug / id of the condition that should be used
		- reputation-request
			- Each player is asked to provide a reputation for the player at the end of the game.
		- reputation-display
			- The recorded reputation for a given player is displayed
			- MUST provide a 'from' date param indicating which reputation should be displayed (typically yesterday's, but sometimes not).
		- cooperation-display
		- reputation-request-plus-scoreboard
			- The player is asked for their opponent's reputation at the end of the game
*/

module.exports = {
	'52e16ff5da19f40200000066': {
		'2014-01-27': 'walkaway',
		'2014-01-28': 'cooperation-display',
		'2014-01-29': 'reputation-request',
		'2014-01-30': 'reputation-display',
		'2014-01-31': 'reputation-request-plus-scoreboard'
	},
	'52e16fbada19f40200000065': {
		'2014-01-27': 'condition-random',
		'2014-01-28': {
			'mode': 'condition',
			'slug': '*'
		},
		'2014-01-29': 'play-by-play',
		'2014-01-30': {
			'mode': 'condition',
			'slug': '*'
		},
		'2014-01-31': {
			'mode': 'condition',
			'slug': '*'
		}
	},
	'*': {
		'2014-02-01': 'neutral',
		'2014-02-02': {
			'mode': 'condition',
			'slug': 'condition-color'
		},
		'2014-02-04': {
			'mode': 'condition',
			'slug': 'condition-political'
		},
		'2014-02-05': {
			'mode': 'walkaway'
		},
		'2014-02-07': {
			'mode': 'play-by-play'
		},
		'2014-02-08': {
			'mode': 'condition',
			'slug': 'condition-emoticon'
		},
		'2014-02-09': {
			'mode': 'condition',
			'slug': 'condition-political'
		},
		'2014-02-10': {
			'mode': 'condition',
			'slug': 'condition-color'
		},
		'2014-02-11': {
			'mode': 'play-by-play'
		},
		'2014-02-12': {
			'mode': 'reputation-request'
		},
		'2014-02-13': {
			'mode': 'reputation-display',
			'from': '2014-02-12'
		},
		'2014-02-14': {
			'mode': 'reputation-request'
		},
		'2014-02-15': {
			'mode': 'reputation-display',
			'from': '2014-02-14'
		},
		'2014-02-17': {
			'mode': 'walkaway'
		},
		'2014-02-18': {
			'mode': 'play-by-play'
		},
		'2014-02-19': {
			'mode': 'condition',
			'slug': 'condition-emoticon'
		},
		'2014-02-20': {
			'mode': 'condition',
			'slug': 'condition-color'
		},
		'2014-02-22': {
			'mode': 'condition',
			'slug': 'condition-emoticon'
		},
		'2014-02-23': {
			'mode': 'play-by-play'
		},
		'2014-02-24': {
			'mode': 'condition',
			'slug': 'condition-political'
		},
		'2014-02-25': {
			'mode': 'cooperation-display'
		},
		'2014-02-28': {
			'mode': 'reputation-request-plus-scoreboard'
		}
	}
};