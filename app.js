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


let users = {};//store all users{name1,name2,name3}
// single user format
//  var client = {
//   socket:socket,
//   name:false,
//   color:getColor()
// }
let onlineUsers = [];//store all online users[{name:, color:, socket:,}...]
var mapOps = []; //user operations 

io.on('connection', function(socket){
	console.log("User Connected" + socket.id);

	socket.on('message',(msg)=>{
		mapOps.push(msg);
		console.log("receive msg: [" + msg.name + ", " + msg.type + ", [" + msg.lat + "," + msg.lng + "], " + msg.cat + "]");
		io.emit('update map', msg);	
		// socket.broadcast.emit(...) eveyry one but socket
	});

	socket.on('new user',(data)=>{
		// add only when new user not in users (never logged before)
		if(!(data.name in users)){
			users[data.name] = socket;
			onlineUsers.push(data);
		}
		io.emit('online users', onlineUsers);
		socket.emit('initial map', mapOps);
	});
	
	
	socket.on('disconnect',()=>{
		let logoutUserName;
		for(let obj in users){
			if(users[obj]==socket){
				logoutUserName = obj;
				delete users[obj];
			}
		}
		for(let i in onlineUsers){
			if(onlineUsers[i]==logoutUserName){
				onlineUsers.splice(i,1);
			}
		}
		io.emit('online users',onlineUsers);
		io.emit('user disconnected',logoutUserName);
	})
})
