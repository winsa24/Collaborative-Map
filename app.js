//引入依赖并创建实例
var express = require('express');
let app = require('express')();//引入express模块
let http = require('http').Server(app);//引入HTTP模块并启动服务
let io = require('socket.io')(http);//引入socket.io模块

//监听端口
const port = 3000;
http.listen(port,()=>{
    console.log(`Http is listening to port ${port}`);
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html'); // change the path to your index.html
});

app.use("/static", express.static('./static/'));


let users = {};//接收所有用户的对象{name1,name2,name3}
// single user format
//  var client = {
//   socket:socket,
//   name:false,
//   color:getColor()
// }
let onlineUsers = [];//接收所有在线用户的数组[{name:, color:, socket:,},{name:,id:}]or[name1,name2,name3]

//创建事件
io.on('connection',function(socket){
  socket.on('message',(msg)=>{
      console.log("receive msg: " + msg);
      io.emit('update map',msg);
  });

  socket.on('new user',(data)=>{
    // add only when new user not in users (never login before)
    if(!(data.name in users)){
      users[data.name] = socket;
      onlineUsers.push(data);
    }
    io.emit('online users', onlineUsers);//告诉前台用户在线用户列表
  });
 
  // 监听用户退出连接==disconnect
  socket.on('disconnect',()=>{
    let logoutUserName;
    // 遍历所有用户，判断用户是否正在聊天室
    for(let obj in users){
      // 如果在聊天室，提示退出，并在users中移除
      if(users[obj]==socket){
        logoutUserName = obj;
        delete users[obj];
      }
    }
    // 遍历所有在线用户，判断退出的用户是否在线
    for(let i in onlineUsers){
      // 如果该用户在线的话，移除用户
      if(onlineUsers[i]==logoutUserName){
        onlineUsers.splice(i,1);
      }
    }
    // 告诉前台在线用户列表
    io.emit('online users',onlineUsers);
    // 告诉所有用户该用户已离开聊天室
    io.emit('user disconnected',logoutUserName);
  })
})
