module.exports = {
	points: {
		// 'friend' + 'friend'
		winningTie: process.env.pointsForFriendlyTie || 15
		// 'friend' in 'friend' + 'enemy'
	  , loss: process.env.pointsForLoss || -5
		// 'enemy' in 'friend' + 'enemy'
	  , win: process.env.pointsForWin || 25
		// 'enemy' + 'enemy'
	  , losingTie: process.env.pointsForUnfriendlyTie || 5
	}
  , admins: ['ben.schell@gmail.com']
};