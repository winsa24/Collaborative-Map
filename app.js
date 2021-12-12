const { Console } = require('console');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = 3000;
http.listen(port,()=>{
    console.log(`Http is listening to port ${port}`);
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html'); // change the path to your index.html
});

app.use("/static", express.static('./static/'));


let mapName = "Collaborative Map";
let defaultView = {'pos': [51.505, -0.09], 'zoom':13};
let users = {};				//store all sockets, linked to their user.name (as a key)
let onlineUsers = [];		//store all online users[{name:, color:}...]
let onlineUsersView = {};	//store all view bounds, linked to their user.name (as a key, like sockets in users)
//var mapOps = []; 			//user operations messages
var mapElem = [];			//map elements

io.on('connection', function(socket){
	console.log("User Connecting...");


	// ====<<<<==== Default Server Properties ====>>>>>====

	socket.on('setMapName', (name)=>{
		mapName = name;
		io.emit('mapNameChange', mapName);
	});	
	socket.on('setDafaultView', (view)=>{
		defaultView.pos = view.pos;
		defaultView.zoom = view.zoom;
	});	


	// ====<<<<==== User Connection ====>>>>>====

	socket.on('newUser', (user)=>{

		if(user.name in users)	// this username is already used
		{
			let i = 0;
			while (`${user.name}.${i}` in users)
			{
				i++;
			}
			user.name = `${user.name}.${i}`;
			socket.emit('nameChanged', user.name);
		}
			
		users[user.name] = socket;
		onlineUsersView[user.name] = {'sw_lat': 0,'sw_lng': 0,'ne_lat': 0,'ne_lng': 0};
		onlineUsers.push(user);
		console.log("New user connected: " + user.name);
		
		io.emit('online users', onlineUsers, onlineUsersView);
		socket.emit('initMap', mapElem, mapName, defaultView);
		socket.broadcast.emit('userJoined', user.name);
	});	

	socket.on('userPaned', (username, bounds) => {
		onlineUsersView[username] = bounds;
		socket.broadcast.emit("otherUserPaned", username, bounds);
	});
	
	socket.on('disconnect',()=>{
		let logoutUserName;

		for(let obj in users){			// loop through the user sockets to get the username linked to socket
			if(users[obj]==socket){
				logoutUserName = obj;
				delete users[obj];
				delete onlineUsersView[obj];
				break;
			}
		}

		for(let i in onlineUsers){
			if(onlineUsers[i].name == logoutUserName){
				onlineUsers.splice(i,1);
				break;
			}
		}

		io.emit('online users', onlineUsers);
		io.emit('userDisconnected',logoutUserName);
		console.log(logoutUserName + " left at " + new Date().toLocaleTimeString());
	})



	// ====<<<<==== User Editing Map ====>>>>>====
	
	socket.on('addElement',(data)=>{
		mapElem.push(data);
		io.emit('AddOnMap', data);
	});

	socket.on('lock', (data) => {
		let index = -1;
		console.log("data: ");
		console.log(data);
		for (let i in mapElem)
		{
			console.log(mapElem[i]);
			if (!mapElem[i].lock && (data.cat == mapElem[i].cat) && (data.pos.lat == mapElem[i].pos.lat) && (data.pos.lng == mapElem[i].pos.lng))
			{
				index = i;
				break;
			}
		}
		console.log("Lock : " + index);
	})
})
