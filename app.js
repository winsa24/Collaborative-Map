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
let onlineUsersSelectItem = {};	//store all locked/selected item indexes, linked to their user.name (as a key, like sockets in users)
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
		socket.broadcast.emit('userJoined', user);
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

		let logoutUser;
		for(let i in onlineUsers){
			if(onlineUsers[i].name == logoutUserName){
				logoutUser = onlineUsers[i];
				onlineUsers.splice(i,1);
				break;
			}
		}

		// if was locking an element, unlock it
		if (logoutUserName in onlineUsersSelectItem)
		{
			let lockedIndex = onlineUsersSelectItem[logoutUserName];
			mapElem[lockedIndex].lock = false;
			io.emit('UpdateElement', onlineUsersSelectItem[logoutUserName], mapElem[onlineUsersSelectItem[logoutUserName]]);
			delete onlineUsersSelectItem[logoutUserName];
		}
		

		io.emit('online users', onlineUsers, onlineUsersView);
		io.emit('userDisconnected', logoutUser);
		console.log(logoutUserName + " left at " + new Date().toLocaleTimeString());
	})




	// ====<<<<==== User Focus ====>>>>>====

	socket.on('requestFocus',(user, pos)=>{
		socket.broadcast.emit('userRequestFocus', user, pos);
		socket.emit('requestFocusOk',pos);
	});




	// ====<<<<==== User Editing Map ====>>>>>====
	
	socket.on('addElement',(data)=>{
		mapElem.push(data);
		io.emit('AddOnMap', data);
	});

	socket.on('lock', (index, username) => {
		if (mapElem[index].lock || username in onlineUsersSelectItem)
			return;

		console.log(`Locking element: ${index}`);
		mapElem[index].lock = true;
		onlineUsersSelectItem[username] = index;

		socket.broadcast.emit('UpdateElement', index, mapElem[index]);
		socket.emit("SelectElement", index);
	});

	socket.on('unlock', (index, data, editorUser, hasChanged) => {		
		if (index < 0)
			return;

		if (!(editorUser.name in onlineUsersSelectItem) || onlineUsersSelectItem[editorUser.name] != index)
			return;

		//if (!mapElem[index].lock || (data.cat != mapElem[index].cat))	// additional useless checks
		//	return;

		console.log(`Unlocking element: ${index}`);
		if (hasChanged)
		{
			if (mapElem[index].user.name != editorUser.name)
				users[mapElem[index].user.name].emit('userEditedYourWork', editorUser, mapElem[index].pos);

			data.user = editorUser;
			mapElem[index] = data;
		}
		mapElem[index].lock = false;
		delete onlineUsersSelectItem[editorUser.name];

		socket.emit("UnSelectElement");
		io.emit('UpdateElement', index, mapElem[index]);
	});

	socket.on('delete', (index, editorUser, data) => {
		if (index < 0)
			return;

		if (!mapElem[index].lock || (data.cat != mapElem[index].cat))
			return;

		console.log(`Deleting element: ${index}`);

		if (mapElem[index].user.name != editorUser.name)
			users[mapElem[index].user.name].emit('userDeletedYourWork', editorUser, mapElem[index].pos);


		mapElem.splice(index,1);
		delete onlineUsersSelectItem[editorUser.name];			
		for (let lockingUser in onlineUsersSelectItem)		// decrement the lock index of the other users
		{
			if (onlineUsersSelectItem[lockingUser] > index)
				onlineUsersSelectItem[lockingUser]--;
		}

		socket.emit("UnSelectElement");
		io.emit('DeleteElement', index);
	});
})
