//import { cMarker, cCircle } from "./classes";

const CollaborativeElementEnum = {
  Marker: 'Marker',
  Circle: 'Circle',
  Polygon: 'Polygon',
  Popup: 'Popup'
};

var currUser = new cUser("User_00", "#f03");
var map;
var createViz = function (){
	map = L.map('map').setView([51.505, -0.09], 13);
	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1IjoibHV1dXV1bmEiLCJhIjoiY2t3bmp2MXRsMmt1czJwbnZ2ZWJqYmc2aiJ9.bN47LX5kw_O6ClfXzmeRTg'
	}).addTo(map);   
}

var setUserColor = function()
{
	const colorInput = document.getElementById("user_color");
	currUser = new cUser(currUser.GetUserName(), colorInput.value);
}


const ip = 'localhost';
const port = 3000;
$(function(){
	var onlineUsers = [],socket,userName = '';
	//登录
	$("#login").on("click",function(){
		$('#login_div').hide()
		socket = io(`ws://${ip}:${port}`);
		socket.on('connect', function (data) {              
			userName = $('#user_name').val();
			socket.emit('new user',userName);
			$('#div').show();

			//获得当前在线人员
			socket.on("online users",function(data){
				if(data.length>onlineUsers.length){
					$('#message_status').append(`<li><b>${data.slice(-1)[0]}</b>&nbsp;enter&nbsp;${new Date().toLocaleTimeString()}</li>`);
				}
				$('#online').html(data.join(','));
				onlineUsers = data;
				console.log("update online user number："+onlineUsers.length);
				let $select = $('#select');
				$select.empty();
				for(var j=0; j< onlineUsers.length; j++){
					if(userName!=onlineUsers[j]){
						var option = $("<option value='"+onlineUsers[j]+"'>"+onlineUsers[j]+"</option>");
						$select.append(option);
					}
				}
			});
			// 退出聊天室
			socket.on('user disconnected',function(name){
					$('#message_status').append(`<li><b>${name.slice(-1)[0]}</b>&nbsp;quite&nbsp;${new Date().toLocaleTimeString()}</li>`);
			})
		});
	});	
	// //发送消息
	// $("#send").click(function(e){     
	//     var msg  = $('#message').val(),
	//         to = $('#select').val();
	//     socket.emit('private message',userName,to,msg);
	//     let $message_list = $('#message_list');
	//     $message_list.append(`<li><span class='rt'><span class='name'>${msg}&nbsp;&nbsp;<small>to:${to}</small></span></span></li>`);
	//     $('#message').val('');
	// });

	$("#markers").click(function(e){     
		var marker = new cMarker(map, L, currUser);
	});
	$("#circles").click(function(e){     
		/*var circle = L.circle([51.508, -0.11], {
			color: 'red',
			fillColor: '#f03',
			fillOpacity: 0.5,
			radius: 500
		}).addTo(map);*/

		var circle = new cCircle(map, L, currUser, [51.508, -0.11], 500);
	});

	$("#polygons").click(function(e){     
		var polygon = L.polygon([
			[51.509, -0.08],
			[51.503, -0.06],
			[51.51, -0.047]
		]).addTo(map);

	});
});


