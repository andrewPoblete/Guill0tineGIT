//Guillotine Rules: http://www.orderofgamers.com/downloads/Guillotine_v1.pdf		


var i = 0;

var Model, Controller, View = {};

//game statistics and backend
var Model = {	
	"view": View,
	"players" : [],      
    "turnNumber" : 0,  
    "currPlayer": {}, 
    "nextTurn": function() {
    	/*
			Switch players
    	*/
    	Model.currPlayer = Model.players[Model.turnNumber % 2];
    	Model.turnNumber += 1;
    	View.drawBoard();
    	
    	setTimeout(View.drawBoard, 2000);
    },
	"buildDeck": function ( whichDeck, deck ) {
		/*
			Build a deck from the associated json files
    	*/
		var jsonFile;

		if(whichDeck === "action") {
			jsonFile = "actionCards.json";
		} else if(whichDeck === "noble") {
			jsonFile = "nobleCards.json";
		}

		$.getJSON(jsonFile, function (jsonData) {

			$.each(jsonData, function(index, value) {
				deck.push(value);
			});

			deck.shuffle();
		});	
	},
	"dealNoble": function(amt) {
		/*
			Deal the specified noble cards to the board
    	*/
		for(var i = 0; i < amt; i++) {
			//take the top cards off of noble deck 
			//and move it into play
			var card = Model.nobleDeck.shift();
			Model.noblesInPlay.push(card);
			
		}		
	},
	"dealAction": function(amt, player) {
		/*
			Deal specified amount of cards to the current player.
			Eventually to be used to give users cards when it is
			their turn
    	*/

		for(var i = 0; i < amt; i++) {
			//take the top cards off of noble deck 
			//and move it into play
			var card = Model.actionDeck.shift();
			
			//if card is not implemented yet, get another card
			if(card.dealable) {
				player.hand.push(card);
			} else {
				Model.actionDeck.push(card);
				i--;
			}
		}		
	},
    "nobleDeck": [],
    "actionDeck" : [],
    "noblesInPlay" : [],
    "day": 1,
    "init": function() {
    	/*
			Initialize all game components including 
			- creating all players
			- making the decks
			- resetting turn count and assigning player 1
    	*/
    	Model.players.length = 0;

    	var player1 = new Player("Player 1");
    	var player2 = new Player("Player 2");
    	Model.players.push(player1, player2);

    	$("#winner").remove();

    	Model.buildDeck("noble", Model.nobleDeck);
    	Model.buildDeck("action", Model.actionDeck);

    	Model.turnNumber = 1;
    	Model.currPlayer = Model.players[0];
    	View.initView();

		setTimeout(Model.startDay, 1000);
    },
    "startDay": function() {
   		/*
			At the start of the day, deal new set of nobles
    	*/
    	if(Model.day === 1 ){
    		Model.dealAction(5, Model.players[0]);
    		Model.dealAction(5, Model.players[1]);
    	}    

    	Model.dealNoble(10);
 	
 		//draw the board items and slide next player into view
    	View.drawBoard();
    	View.slideIn();

    },
    "changeLine": function(curr, moveTo) {
		/*
			Move the selected noble into another 
			position in the array
    	*/
		var placeHolder;

		placeHolder = Model.noblesInPlay.splice(curr, 1); //splice returns an array
		Model.noblesInPlay.splice(moveTo, 0, placeHolder[0]);
    },
    "endTurn": function() {
    	/*
			After the Executioner is clicked, the
			players turn ends which triggers 
			- clean up of all unlocked cards
			- check for end of day
			- swapping out to the next player
    	*/
		var player = Model.currPlayer;
		
		//Erase all played cards that aren't supposed to stay on the board
		player.actionsPlayed.forEach(function(value, index){
			console.log(value, index);
			if(!value.stays){
				var card = player.actionsPlayed.splice(index, 1);
				Model.actionDeck.push(card[0]);
			}
		});

		//change playedCard to false to allow player to play an action card next turn
		player.playedCard = false;

		//if endDay returns false, continue playing.
		if(!Model.endDay()) {
			Model.dealAction(1, player);
			Model.nextTurn();
			$(".myBoard").toggleClass("current").toggleClass("onDeck");
    	
    		View.slideOut();
		}
	},
    "endDay": function() {
    	/*
			If the noble line is empty, we will
			end the current day.
    	*/

		var day = Model.day;
		var nobles = Model.noblesInPlay;
		//if day = 3 & Noble line is empty,
		//endGame
		// else if Noble line is empty, 
		//increment day
		//start new day

		if(day === 1 && nobles.length === 0) {
			
			Model.endGame();
		} else if (nobles.length === 0) {
			Model.day++;
			Model.startDay();
		}

		return false;
	},	
    "endGame": function() {
    	/*
			If the end of day is reached and
			we are in the last day, the game will
			end and display the winner
    	*/

    	var $container = $("<div id='winner'>" +
    					       "<h3>The winner is...</h3>" +
    					    "</div>");
    	var score1 = Model.players[0].score();
    	var score2 = Model.players[1].score();
    	var $printedScore = $("<h4>" + score1 + " vs " + score2 + "</h4>");
    	var $playAgain = $("<div class='start'>Play Again?</div>");
    	var $winPlayer;

    	$("header").addClass("hidden").empty();
		$("#chop").addClass("hidden").empty();
		$("#score").addClass("hidden").empty(); 
		$(".myBoard").addClass("hidden");
		$(".myBoard .cardsPlayedBoard").empty();
		$(".myBoard .myHand").empty();


    	if(score1 > score2) {
    		$winPlayer = Model.players[0].name;
    	} else if (score1 < score2) {
    		$winPlayer = Model.players[1].name;
    	} else {
    		$winPlayer = "it's a tie!"
    	}

    	$container.append("<h1>" + $winPlayer + "</h1>").append($printedScore).append($playAgain);
    	$("#gameBoard").append($container);

    	$(".start").on("click", Model.init);

    	console.log("Game over!");
    },
	"setColor": function(color) {
		/*
			Set the color when displaying the hover details
    	*/
		switch(color) {
			case "red":
				return "#eb5b4b";
			case "green":
				return "#79d667";
			case "blue":
				return "#2db1e2";
			case "gray":
				return "#a8a8a8";
			case "purple":
				return "#d264e3";
			default:
				return "#a8a8a8";
		}
	}
};

//logic and interactions
var Controller = {
	"model": Model,
	"view": View,
	
	"nobleClicked": function(event) {
		/*
			If an action card is played that would move
			nobels in the line, this triggers the locations
			a user will be able to click
		*/
		event.preventDefault();

		var player = Controller.model.currPlayer;
		var $model = $(this).model;
		var exact;

		var lastActionPlayed = player.actionsPlayed.length;
		var action = player.actionsPlayed[lastActionPlayed - 1].consequence[0]; 
		var amtToMove = player.actionsPlayed[lastActionPlayed - 1].consequence[1];

		//if action is ex_before (exactly before), split it and set flag for exact.
		exact = action.split("_");

		if(exact.length > 1){
			action = exact[1];
			exact = true;
		} else {
			exact = false;
		}

		var $currCard = $(this);
		var currIndex = $currCard.index();

		$(this).addClass("selected");
		//turn all noble events off so another one can't be clicked again
		$("#noblesLine div").off("click"); 

		//after = forward, backward = before 
		switch(action) {
			case "both":
				indexStart = currIndex - amtToMove;
				amtToMove = amtToMove * 2;
				break;
			case "before":
				indexStart = currIndex - amtToMove;
				break;
			case "after":
				indexStart = currIndex;
				break;
			case "toFront":
				indexStart = 0;
				amtToMove = 0;
				break;
			case "toBack":
				indexStart = $("#noblesLine div").length - 1;
				amtToMove = 0;
				break;
			default:
				console.log("Something broke!");
				break;
		}

		//for future, action can allow to play another action
		player.playedCard = true;

		/*
			if the valid card selection would go beyond the first card,
			need to handle the negative instance which would allow user to select
			cards from the end (because negative numbers count from the end of 
			the array).
		*/
		if(indexStart < 0) {
			amtToMove += indexStart;
			indexStart = 0;
		} 

		//make all cards illegal first	
		for(var i = 0; i <= $("#noblesLine div").length - 1; i++) {
			if(i === currIndex) {
				continue;
			}

			$("#noblesLine div").eq(i).addClass("illegal");
		}

		if(exact) {
			$("#noblesLine div").eq(indexStart).removeClass("illegal").css({"left": "+=28px"});
			$("#noblesLine div").eq(indexStart + amtToMove).removeClass("illegal").css({"left": "+=28px"});

			$("#noblesLine div").eq(indexStart).on("click", function( event ) {
				Controller.model.changeLine(currIndex, $(this).index());  //changes the model
				View.insert(currIndex, $(this).index()); //changes the view
			});
			$("#noblesLine div").eq(indexStart + amtToMove).on("click", function( event ) {
				Controller.model.changeLine(currIndex, $(this).index());  //changes the model
				View.insert(currIndex, $(this).index()); //changes the view
			});
		} else {
			for( var i = indexStart; i <= indexStart + amtToMove; i++ ) {
				//Add: If current index = this.index, we need to
				//do a cancel function

				$("#noblesLine div").eq(i).removeClass("illegal").css({"left": "+=28px"});
				$("#noblesLine div").eq(i).on("click", function( event ) {

					Controller.model.changeLine(currIndex, $(this).index());  //changes the model
					View.insert(currIndex, $(this).index()); //changes the view
				});

			}
		}

	},
    "moveToPlayed": function() {
    	/*
			Move a selected action card into the 
			player's played pile
		*/
    	var player = Controller.model.currPlayer;
    	var x;

		//remove card from my hand
		x = player.hand.splice($(this).index(), 1);	
		
		//add card to cards in play. 
		//Splice returns array of length 1
		player.actionsPlayed.push(x[0]);
		
		View.drawBoard();
		//drawBoard creates all the event listeners
		//So we need to turn them off AFTER
		$(".myHand .card").off("click").removeClass("active");
    }
};

//what player sees
var View = {
	"model": Model,
	"controller": Controller,
	"clearBoard": function () {
		/*
			Remove all board elements
		*/
		$("#noblesLine").empty();
		$(".myHand").empty();
		$(".cardsPlayedBoard").empty();
		$("header").empty();
		$("#desc").empty();
	},
	"insert": function(curr, moveTo) {
		/*
			When moving a noble from one location
			to another, this renders the animation
		*/
		var offset = 62.36;
		var $clone;
		var $line = $("#noblesLine .card");
		var cardWidth = parseInt($line.first().css("width"));
		var pixelMove = (moveTo - curr) * offset;


		//make a clone of the card to be moved
		$clone = $("div.card").eq(curr).clone();

		//get the moving card's location apply it to the clone
		//so it sits exactly where the other card is 

		var $currLocation = $("div.card").eq(curr).css("transform");
		$clone.css("transform", $currLocation);
		$clone.addClass("clone");

		
		//get z-index of destination so it can be inserted between the
		//z-index of the 2 cards
		var $moveZ = parseInt($("div.card").eq(moveTo).css("z-index"));

		//open a space for the card at the moveTo location
		if(pixelMove < 0) {
			$moveZ += 1;
			$line.eq(moveTo).before($clone);
			$line.eq(curr).remove();	
		} else {
			$moveZ -= 1;
			$line.eq(moveTo).after($clone);
			$line.eq(curr).remove();
		}

		//get the new line and animate call cards back to their original state
		$line = $("#noblesLine .card")
		$line.eq(moveTo).css("z-index", $moveZ);

		//remove all added left styles from the line so that the moving card will move
		//into the right place
		$line.css("left", "");
		$line.eq(moveTo).animate({"left": pixelMove +"px"}, 600, function() {	
						
			$line.removeClass("illegal");
			$line.removeClass("selected");
			$line.removeClass("clone");
			$
		});

		setTimeout(View.drawBoard, 3000);
	},
	"hoverDetails": function() {
		/*
			Display card details since print on graphics
			is too small
		*/
    	var $name = $(this).find("h3").text();
    	var $points = $(this).find("h4").text() || 0;
    	var $desc1 = $(this).find("p").eq(0).text();
    	var $color = $(this).find("p").eq(1).text();
    	var $descDiv = $("#desc");
    	var pointsText = "";

    	//do not display undefined in the div
    	if($desc1 === "undefined") {
    		$desc1 = "";
    	}

    	//only display points if it is a noble card
    	if($points) {
			pointsText = "Points " + $points;
    	}

    	$name = $("<h3>" + $name + "</h3>");
    	$points = $("<h4>" + pointsText + "</h4>");
    	$points.css("color", Model.setColor($color));
    	$desc1 = $("<p>" + $desc1 + "</p>");

    	$descDiv.append($name).append($points).append($desc1);
    	$("#desc").removeClass("hidden");
    },
	"drawBoard": function() {
		/*
			Clears the board are redraws all elements with 
			their respective event listeners
		*/
		var model = View.model;
		var controller = View.controller;
		var player = Controller.model.currPlayer;

		View.clearBoard();
		
		//ensure there is no empty cards in the deck
		model.noblesInPlay.clean();
		
		//draw the board elements
		View.drawNobles(model, player);
		View.drawHand();
		View.drawPlayed(player);
		View.drawHeader();
		View.drawScore();

		//ensure that multiple click events aren't being piled on
		$("#chop").off();
		$("#chop").on("click", View.model.currPlayer.collect);

		$(".card").hover(View.hoverDetails, function() {			
			$("#desc").empty().addClass("hidden");
		});
	},
	"drawHand": function() {
		/*
			Draws hands for both players, including
			the cards off of frame.
		*/
		var players = View.model.players;
		var currPlayer = View.model.currPlayer;

		for(var i = 0; i < players.length; i++){
			
			players[i].hand.forEach(function(card, index) {
				var $cardDiv;
				
				$cardDiv = $("<div class='card active'>" +
						     "<h3 class='hidden'>" + card.name + "</h2>" +
						     "<p class='hidden'>" + card.description + "</p>" + 
						     "</div>");

				$cardDiv = View.setBackground(card, $cardDiv);

				$cardDiv.on("click", View.controller.moveToPlayed);	

				if(players[i] === currPlayer){
					//build current div
					$(".myBoard.current .myHand").append($cardDiv); //put the cards into the line
				} else {
					//build to other players div
					$(".myBoard.onDeck .myHand").append($cardDiv); //put the cards into the line
				}
			});
		}
	},
	"setBackground": function(card, $cardDiv) {
		/*
			Set background for all cards in play
			using a css sprite
		*/

		/* 
			Create and add a hidden element into the DOM so 
			we can grab the CSS height and width. Did this so 
			that if there is a change in height/width, we only need
			to do it in the css file.
		*/
		var $cardTemp = $("<div class='card hidden'></div>");
		$("#noblesLine").append($cardTemp);
		
		//8 is the padding (4 on each side)
		var cardWidth = parseInt($(".card.hidden").css("width")) - 8;
		var cardHeight = parseInt($(".card.hidden").css("height")) - 8;

		//remove the temp card from the DOM
		$(".card.hidden").remove();

		//x is the horizontal movement, y is vertical
		var x = -(card.position % 10);
		var y = -Math.floor(card.position / 10);

		$cardDiv.css("background-position", (cardWidth*x) + "px " + (cardHeight*y) + "px");

		return $cardDiv;
	},
	"drawPlayed": function(player) {
		/*
			Draw all action cards in play for 
			the specified user
		*/
		
		player.actionsPlayed.forEach(function(card, index) {
			var $cardDiv;

			$cardDiv = $("<div class='card'>" +
						 "<h3 class='hidden'>" + card.name + "</h2>" +
						 "<p class='hidden'>" + card.description + "</p>" + 
						 "</div>");

			$cardDiv = View.setBackground(card, $cardDiv);

			$(".cardsPlayedBoard").append($cardDiv); //put the cards into the line		

		});
	},
	"drawNobles": function(model, player) {	
		/*
			Draw all nobles cards in play
		*/
		
		model.noblesInPlay.forEach(function(card, index) {
			var $cardDiv;

			$cardDiv = $("<div class='card'>" +
						"<h3 class='hidden'>" + card.name + "</h2>" +
						"<h4 class='hidden'>" + card.points + "</h4>" +
						"<p class='hidden'>" + card.description + "</p>" + 
						"<p class='hidden'>" + card.color + "</p>" + 
						"</div>");

			$cardDiv = View.setBackground(card, $cardDiv);

			/*	if the player has already played an action card, don't add any event listeners
			 	to the noble line.
			 */
			if(!player.playedCard) {
				//if no action has been played or the type is not a move type, then do not add
				//any event listeners to the noble line.
				if(player.actionsPlayed[player.actionsPlayed.length] !== 0 ||
				   player.actionsPlayed[player.actionsPlayed.length - 1].actionType === "move")	{

					//Select the proper cards that can be moved, such as by color or all.
					$cardDiv.on("click", View.controller.nobleClicked);
					$cardDiv.addClass("active");
				}
			}
		
			$("#noblesLine").append($cardDiv); //put the cards into the line
		});
	},	
	"drawHeader": function() {
		/*
			Draw current player and day
		*/
		var $header = $("header");
		var $ul = $("<ul>");
		$ul.append("<li>Day " + Model.day + "</li>");
		$ul.append("<li>" + Model.currPlayer.name + "</li>");

		$header.append($ul);
	},
	"drawScore": function() {
		/*
			Draw score
		*/
		var player = Model.currPlayer;

		//change this when functionality to draw both players instead of just current is added
		var score = player.score();
		$("#score").text(score);
	},
	"slideIn": function() {
		/*
			Animate the next players deck moving into frame
		*/
		$(".myBoard.onDeck").removeAttr("style");
		View.drawBoard();
		$(".myBoard.current").animate({"left" : 0}, 800);
	},
	"slideOut": function() {
		/*
			Animate current user's hand out of frame
			when their turn is over.
		*/
		$(".myBoard.onDeck").animate({"left" : "5000px"}, 1000, View.slideIn);
	},
	"removeCard": function(position) {
		/*
			functionality to remove any card will be added here in future
		*/
		position = position || 0;

		$("#noblesLine .card").eq(0).remove()
	},
	"initView": function() {
		/*
			Initialize the view so that all board elements can be seen
		*/
		$("#inst").remove();
		$("header").removeClass("hidden");
		$("#chop").removeClass("hidden");
		$("#score").removeClass("hidden");
		$(".myBoard").removeClass("hidden");

	}
};


//http://www.kirupa.com/html5/shuffling_array_js.htm
Array.prototype.shuffle = function() {
    var input = this;
    
    //start at end of array 
    for (var i = input.length-1; i >=0; i--) {
     	
        var randomIndex = Math.floor(Math.random()*(i+1)); 
        var itemAtIndex = input[randomIndex]; 
         
        input[randomIndex] = input[i]; 
        input[i] = itemAtIndex;
    }
    return input;
} 

Array.prototype.clean = function() {
	//array is part of object, it will affect array that is referenced
	// array = [];
	var input = this;
	
	for (var i = 0; i < input.length; i++) {
	
		if(input[i] === undefined){
			input.splice(i, 1);
		}
	}
	return input;
}

$("#inst .start").on("click", Model.init);
console.log("Done!");

/*BUGS!!
	- Don't add "active" class to myhand once player has played a card.
		Check that playedCard is false before changing cursor.
	- When any deck runs out, don't throw an error
	- change players hands before animation of next player occurs.
	- When moving to front, selected card does not pop out.
	- Able to select another action card once you played one.
	*/

 /*
 C - Should be able to start the game.
 C - A user should have some instructions on how to play.
 C - A user should know which player's turn it is
 N - Animate action card fade out before div slides out. Keep locked cards
 N - show locked cards
 N - Calculate the gray cards properly.
 N - Exact user movement.
 N - Who's the winner is with what score. Restart.
 N - A user should see an animation when collecting a Noble
 N - A user should have a pause between turns so the next player can't see
 their cards.
 N - Other card functionalities
 B -- 
 */