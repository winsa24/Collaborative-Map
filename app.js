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


let users = {};			//store all sockets, linked to their user.name (as a key)
let onlineUsers = [];	//store all online users[{name:, color:}...]
var mapOps = []; 		//user operations messages

io.on('connection', function(socket){
	console.log("User Connecting...");


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
		onlineUsers.push(user);
		console.log("New user connected: " + user.name);
		
		io.emit('online users', onlineUsers);
		socket.emit('initMap', mapOps);
		socket.broadcast.emit('userJoined', user.name);
	});	
	
	socket.on('disconnect',()=>{
		let logoutUserName;

		for(let obj in users){			// loop through the user sockets to get the username linked to socket
			if(users[obj]==socket){
				logoutUserName = obj;
				delete users[obj];
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
	
	socket.on('addElement',(msg)=>{
		mapOps.push(msg);
		console.log(`Add: \t{${msg.cat}, [${msg.lat}, ${msg.lng}] }"`);
		io.emit('AddOnMap', msg);
	});
})
