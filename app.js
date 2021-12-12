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

	socket.on('lock', (index) => {
		if (mapElem[index].lock)
			return;

		console.log(`Locking element: ${index}`);
		mapElem[index].lock = true;

		socket.broadcast.emit('UpdateElement', index, mapElem[index]);
		socket.emit("SelectElement", index);
	});

	socket.on('unlock', (index, data, editorUser, hasChanged) => {		
		if (index < 0)
			return;

		if (!mapElem[index].lock || (data.cat != mapElem[index].cat))
			return;

		console.log(`Unlocking element: ${index}`);
		if (hasChanged)
		{
			if (mapElem[index].user.name != editorUser.name)
				users[mapElem[index].user.name].emit('userEditedYourWork', editorUser.name);

			data.user = editorUser;
			mapElem[index] = data;
		}
		mapElem[index].lock = false;

		socket.emit("UnSelectElement");
		io.emit('UpdateElement', index, mapElem[index]);
	});

	socket.on('delete', (index, editorUser, data) => {
		console.log("trigger delete");
		if (index < 0)
			return;

		if (!mapElem[index].lock || (data.cat != mapElem[index].cat))
			return;

		console.log(`Deleting element: ${index}`);

		if (mapElem[index].user.name != editorUser.name)
			users[mapElem[index].user.name].emit('userDeletedYourWork', editorUser.name);

		mapElem.splice(index,1);
		socket.emit("UnSelectElement");
		io.emit('DeleteElement', index);
	});
})
