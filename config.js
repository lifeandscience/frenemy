module.exports = {
	// Number of points for players who start out high
	defaultHighPoints: 10000

	// Number of points for players who start out low
  , defaultLowPoints: 0

  , points: {
		// 'friend' + 'friend'
		winningTie: 15
		// 'friend' in 'friend' + 'enemy'
	  , loss: -5
		// 'enemy' in 'friend' + 'enemy'
	  , win: 25
		// 'enemy' + 'enemy'
	  , losingTie: 5
	}
	
//  , defaultDefenderEmail: 'beck@becktench.com'
//  , defaultNonDefenderEmail: 'elizfleming@gmail.com'
  , admins: ['ben.schell@gmail.com']
};