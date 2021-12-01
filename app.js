//引入依赖并创建实例
let app = require('express')();//引入express模块
let http = require('http').Server(app);//引入HTTP模块并启动服务
let io = require('socket.io')(http);//引入socket.io模块

//监听端口
const port = 3000;
http.listen(port,()=>{
    console.log(`Http is listening to port ${port}`);
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html'); // change the path to your index.html
});

//创建变量
let users = {};//接收所有用户的对象{name1,name2,name3}
let onlineUsers = [];//接收所有在线用户的数组[{name:,id:},{name:,id:}]or[name1,name2,name3]

//创建事件
io.on('connection',function(socket){
// 监听发私有消息事件==private message
    socket.on('private message',(from,to,msg)=>{
      if(to in users){
        users[to].emit('to'+to,{msg,from,to});
      }
    });
    // 监听新用户进入聊天室事件==new user
    socket.on('new user',name=>{
      // 只有当该用户不在用户列表中才进行操作
      if(!(name in users)){
        users[name] = socket;//将用户私有的socket保存给用户
        onlineUsers.push(name);//将用户保存到在线列表
      }
      io.emit('online users',onlineUsers);//告诉前台用户在线用户列表
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
