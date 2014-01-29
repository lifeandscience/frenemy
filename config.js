module.exports = {
	points: {
		// 'friend' + 'friend'
		winningTie: process.env.pointsForFriendlyTie || 30
		// 'friend' in 'friend' + 'enemy'
	  , loss: process.env.pointsForLoss || -10
		// 'enemy' in 'friend' + 'enemy'
	  , win: process.env.pointsForWin || 40
		// 'enemy' + 'enemy'
	  , losingTie: process.env.pointsForUnfriendlyTie || 0
	}
  , admins: ['ben.schell@gmail.com']
};