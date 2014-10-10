var express = require('express');
var app = express();
var path = require('path');
var Twit = require('twit');
var Galileo = require("galileo-io");
var board = new Galileo();

var pin = 9;
var trend = "GalileoGirls";
var boardAvailable = false;
var currentTweets = [];
var latestId = 0;

var T = new Twit({
    consumer_key:         ''
  , consumer_secret:      ''
  , access_token:         ''
  , access_token_secret:  ''
});

app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});

app.get('/tweets', function(req, res){
  res.send(currentTweets);
});

function setupBoard() {
	if(boardAvailable) {
		board.on("ready", function() {
			this.pinMode(pin, this.MODES.OUTPUT);
			queryTwitter(trend, pin);
		});
	} else {
		queryTwitter(trend, pin);
	}
}

function queryTwitter(trendMessage, pin) {
	console.log("Processing trend " + trendMessage + " " +new Date());
	if(trendMessage) {
		T.get('search/tweets', { q: trendMessage, count: 100, since_id: latestId }, function(err, data) {
		  if(err) {
		  		console.log(err);
		  		setTimeout(function () {
					queryTwitter(trend, pin)
				}, 5000);
		  }
		  else if(data.statuses && data.statuses.length > 0) {
		  	getTweetList(data.statuses);
		  	processTrend(currentTweets, pin);
		  }
		});
	} 
}

function processTweetData(tweetData) {
	var tweet = {};
	tweet.created = tweetData.created_at;
	tweet.message = tweetData.text;
	tweet.user = tweetData.user.screen_name;
	tweet.profile = tweetData.user.profile_image_url;
	tweet.id = parseInt(tweetData.id_str);
	return tweet;
}

function getTweetList(tweetList) {
	currentTweets = [];
	for(var i = 0; i < tweetList.length; i++) {
		var tweet = processTweetData(tweetList[i]);
		currentTweets.push(tweet);
		setHightestId(tweet.id);
	}
}

function processTrend(tweeters, pin) {
	if(tweeters.length > 1) {	
		executePin(pin);
		console.log(tweeters);
	}
	setTimeout(function () {
		queryTwitter(trend, pin)
	}, 50000);
}

function executePin(pin) {
	if(boardAvailable) {
	  	setTimeout(flash(pin, 0, 0), 100);
	}
}

function flash(pin, increment, value) {
	board.digitalWrite(pin, 1);
	if(increment > 50)
		setTimeout(function () {
			flash(pin, increment++, (value ^= 1));
		}, 200);
}

function setHightestId(currentId) {
	if(currentId > latestId) 
		latestId = currentId;
}

setupBoard();