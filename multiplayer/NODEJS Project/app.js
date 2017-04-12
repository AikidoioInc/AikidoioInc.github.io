/* Gregory Jerian
 * CS Capstone 3rd Period */

// File communication (Express)
	// Client asks server for a file (EX: playerImg.png)

// Package communication (Socket.io)
	// Client sends data to a server (EX: Player inputs)
	// Server sends data to a client (EX: Enemy position)

// Mongo.exe allows client to send queries. Acts like a client
// Mongod.exe acts as a server.

// Database
	// collection0
		// document0
		// document1
		// document2
	// collection1
		//document0
		//document1
		//document2


//Debug flag. Set to FALSE if we are not debugging
var DEBUG_FLAG = true;

// Variables required for express and the server
var express = require("express");
var app = express();
var serv = require("http").Server(app);  // Create a server

// Loads the socket.io file and initializes it, returning the
// io object with all functionalities of socket.io library.
var io = require("socket.io")(serv,{});

// A list of all connected clients.
var socketList = {};

// Contains username and password for all players
var users = {
	//username:password
	"bob":"asd",
	"bob2":"bob",
	"bob3":"ttt",
}

// Checks if a password is valid. CB stands for callback
// callback does stuff in the future.
var isValidPassword = function(data, cb) {
	setTimeout(function() {
		cb(users[data.username] === data.password);
	},10);
}

// Checks if username is taken
var isUsernameTaken = function(data, cb) {
	setTimeout(function() {
		cb(users[data.username]);
	},10);
}

// Adds a user
var addUser = function(data, cb) {
	setTimeout(function() {
		users[data.username] = data.password;
		cb();
	},10);
}

// If the query starts with nothing, send /client/index.html.
// Example: localhost:2000
app.get("/", function(req, res) {
	res.sendFile(__dirname + "/client/index.html");
});

// If the query starts with "client", send the client file that
// is wanted. Example: localhost:2000/client/img/ramsay.jpg
app.use("/client", express.static(__dirname + "/client"));

// Make the server listen to requests on port 2000
serv.listen(2000);
console.log("Server started.");

// Superclass for all entities, such as bullets and players
var Entity = function() {
	// Sets many variables
	var self = {
		x: 250,
		y: 250,
		speedX: 0,
		speedY: 0,
		id: "",
	}

	// Updates various things of the entity
	self.update = function() {
		self.updatePosition();
	}

	// Updates the position of the entity
	self.updatePosition = function() {
		self.x += self.speedX;
		self.y += self.speedY;
	}

	// Distance formula method.
	self.getDistance = function(pt) {
		return Math.sqrt(Math.pow(self.x-pt.x, 2) + Math.pow(self.y-pt.y, 2));
	}
	return self;
}

// Class for players, a subclass of Entity
var Player = function(id) {
	var self = Entity();
	self.id = id;

	// Create random number between 0 and 9 for client to display.
	self.number = "" + Math.floor(10 * Math.random());

	// Sets the values for keys being pressed to false at first
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingLMB = false;

	// Mouse Angle
	self.mouseAngle = 0;

	// Maximum speed
	self.maxSpeed = 10;

	// Update continuously
	var superUpdate = self.update;
	self.update = function() {
		self.updateSpeed();

		// Spawns random bullets.
		if (self.pressingLMB) {
			// Shooting a bullet in a certain direction.
			self.shootBullet(self.mouseAngle);
		}
		superUpdate();
	}

	// Updates the position of the entity
	self.updatePosition = function() {
		self.x += self.speedX;
		self.y += self.speedY;

		if (self.y < 0) {
			self.y = 0;
			self.speedY = 0;
		}
	}

	self.shootBullet = function(angle) {
		// Creates the bullet
		var b = Bullet(self.id, angle);

		// x and y are the same as the player.
		b.x = self.x;
		b.y = self.y;
	}

	// Update positions based on values of variables
	// set by client
	self.updateSpeed = function() {
		if (self.pressingRight) {
			self.speedX = self.maxSpeed;
		} else if (self.pressingLeft) {
			self.speedX = -self.maxSpeed;
		} else {
			self.speedX = 0;
		}

		if (self.pressingUp) {
			self.speedY = -self.maxSpeed;
		} else if (self.pressingDown) {
			self.speedY = self.maxSpeed;
		} else {
			self.speedY = 0;
		}

		self.speedY -= 0.02;
	}
	Player.list[id] = self;
	return self;
}
Player.list = {};

// Creating a new player
Player.onConnect = function(socket) {
	var player = Player(socket.id);
	// Receives sockets for clients moving and sets pressingLeft,
	// pressingUp, pressingDown, pressingRight to either TRUE or FALSE
	socket.on("keyPress", function(data) {
		if (data.inputId === "left")
			player.pressingLeft = data.state;
		if (data.inputId === "right")
			player.pressingRight = data.state;
		if (data.inputId === "up")
			player.pressingUp = data.state;
		if (data.inputId === "down")
			player.pressingDown = data.state;
		if (data.inputId === "LMB")
			player.pressingLMB = data.state;
		if (data.inputId === "mouseAngle")
			player.mouseAngle = data.state;
	});
}
Player.onDisconnect = function(socket) {
	delete Player.list[socket.id];
}

Player.update = function() {
	// Array for the new coordinates of the players
	var coords = [];
	// Loops through every player in the playerList.
	for (var i in Player.list) {
		var player = Player.list[i];
		// Updates position based on keyboard inputs
		player.update();
		// Pushes new positions to the coords array
		coords.push ({
			x: player.x,
			y: player.y,
			number: player.number
		});
	}
	return coords;
}

var Bullet = function(parent, angle) {
	// Sets Bullet as a subclass of Entity
	var self = Entity();

	// Sets random id
	self.id = Math.random();

	// Sets speedX and speedY using the power
	// of trigonometry
	self.speedX = Math.cos(angle*Math.PI/180) * 10;
	self.speedY = Math.sin(angle*Math.PI/180) * 10;

	// Does a parent thing.
	self.parent = parent;

	// Overrides update loop to remove bullet after 100 frames.
	self.timer = 0;
	self.removalFlag = false;
	var superUpdate = self.update;
	self.update = function() {
		if (self.timer++ > 100)
			self.removalFlag = true;
		superUpdate();

		// Collisions
		for (var i in Player.list) {
			var p = Player.list[i];
			// TODO LATER
			if (self.getDistance(p) < 32 && self.parent != p.id) {
				self.removalFlag = true;
			}
		}
	}
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {};

Bullet.update = function() {
	var coords = [];
	for (var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.update();
		if (bullet.removalFlag === true) {
			delete Bullet.list[i];
		}
		else {
			coords.push({
				x:bullet.x,
				y:bullet.y,
			})
		}
	}
	return coords;
}


/** If a client connects to the server, call this function. */
io.sockets.on("connection", function(socket) {
	// Log that a socket has connected
	console.log("A socket has connected.");

	// Create a random ID
	socket.id = Math.random();

	// Assign this socket to the index of the randomly
	// generated socket id in socketList.
	socketList[socket.id] = socket;

	// Creates a player if the socket contains a sign in message
	socket.on("signIn", function(data) {
		isValidPassword(data, function(res) {
			if (res) {
				// Creates player based on socket id
				Player.onConnect(socket);
				socket.emit("signInResponse",{success:true});
			}
			else {
				socket.emit("signInResponse",{success:false});
			}
		});
	});

	// Creates a player if the socket contains a sign up message
	socket.on("signUp", function(data) {
		isUsernameTaken(data, function(res) {
			if (res) {
				// If the username is taken receive a false message
				socket.emit("signUpResponse",{success:false});
			}
			else {
				// If the username is not taken create the user.
				addUser(data, function(res) {
					socket.emit("signUpResponse",{success:true});
				});
			}
		});
	});

	// Disconnect code
	socket.on("disconnect",function() {
		delete socketList[socket.id];
		Player.onDisconnect(socket);
	});

	// Receiving chat messages
	socket.on("sendChatMessageToServer", function(data) {
		// Sets the player name
		var playerName = ("" + socket.id).slice(2, 7);

		// Emits the chat message
		for (var i in socketList) {
			socketList[i].emit("addToChat", playerName + ": " + data);
		}
	});

	// Receiving chat commands
	socket.on("sendChatCommandToServer", function(data) {
		if (DEBUG_FLAG === false) {
			return;
		}

		var retval = eval(data);
		socket.emit("addCommand", retval);

	});

});

/** A loop that runs at 30 fps.
 *  It takes every existing socket and increments their x and y
 *  coordinates once. */
setInterval(function() {
	// Update coordinates package
	var coords = {
		player: Player.update(),
		bullet: Bullet.update(),
	}

	// Loops through every socket in the socketList.
	for (var i in socketList) {
		var socket = socketList[i];

		// Sends the new positions of each socket to the client.
		socket.emit("newPositions", coords);
	}

},1000/30);
