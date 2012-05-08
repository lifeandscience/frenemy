module.exports = {
	// Number of rounds in each game
	roundsPerGame: 3
	
	// Number of points for players who start out high
  , defaultHighPoints: 10000

	// Number of points for players who start out low
  , defaultLowPoints: 0

	// Function to decide which a user has:
  , determineInitialPoints: function(){
		return (Math.floor(Math.random() * 2) ? module.exports.defaultHighPoints : module.exports.defaultLowPoints);
	}

  , points: {
		// 'friend' + 'friend'
		winningTie: 10
		// 'friend' in 'friend' + 'enemy'
	  , loss: -15
		// 'enemy' in 'friend' + 'enemy'
	  , win: 15
		// 'enemy' + 'enemy'
	  , losingTie: -15
	}
};