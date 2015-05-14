// function NobleCard(name, points) {
// 			this.name =  name;
// 			this.points = points;
// 			this.color;
// 			this.position;
// 			this.description;
// 	}

// function ActionCard(name, consequence) {
// 		this.name =  name;
// 		// this.played;
// 		this.consequence = consequence;
// 		this.position;
// 		this.actionType; //move, freeze, collect extra, add cards
// 		this.locked =  false;
// }

function Player(name) {
	this.name = name;
	this.hand = [];
	this.actionsPlayed = [];
	this.playedCard = false;
	this.collected = [];
	this.score = function() {
		var total = 0;
		this.collected.forEach(function (value) {
			total += value.points;
		});

		return total;
	};
	this.collect = function(event) {
		event.preventDefault();
		var collectedCard;
		var player = Controller.model.currPlayer; //This gets passed pointer to object, not a copy
		
		collectedCard = Controller.model.noblesInPlay.shift();
		
		player.collected.push(collectedCard);
		View.removeCard();
		setTimeout(Controller.model.endTurn, 1000);
	};
	// this.collect = function() {
	// 	var collectedCard = nobleCards.shift();
	// 	this.collected.push(collectedCard);
	// }
}