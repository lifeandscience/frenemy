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
	
  , defaultDefenderEmail: 'ben.schell+defender@bluepanestudio.com'
//  , defaultDefenderEmail: 'ben.schell+defender@bluepanestudio.com'
  , defaultNonDefenderEmail: 'ben.schell+non+defender@bluepanestudio.com'
  , admins: ['ben.schell@gmail.com', 'beck@becktench.com']
};