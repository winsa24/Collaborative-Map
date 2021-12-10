//import { cMarker, cCircle } from "./classes";

const CollaborativeElementEnum = {
  Marker: 'Marker',
  Circle: 'Circle',
  Polygon: 'Polygon',
  Popup: 'Popup'
};

var currUser = new cUser("User_00", "#f03");
var map;
let msg;
var currentCategory = CollaborativeElementEnum.Marker;
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

	map.on('click', function(e) {
		msg = {'lat': e.latlng.lat, 'lng': e.latlng.lng, 'shiftDown': e.shiftKey, 'cat': currentCategory};
		// mapOnClick(e.latlng.lat, e.latlng.lng, !!e.shiftKey);		
	}); 
}

var setUserColor = function()
{
	const colorInput = document.getElementById("user_color");
	currUser = new cUser(currUser.GetUserName(), colorInput.value);
}

// =========== Set Map On Click ==============
// TODO : var mapOnClick = function(lat, lng, shiftDown, category, username, usercolor)
var mapOnClick = function(lat, lng, shiftDown)
{
	console.log(lat,lng);	
	// try to select an element to edit it...

	// no element found : add one
	switch(currentCategory) {
		case CollaborativeElementEnum.Marker:
			addMarker(lat,lng);
			break;
		case CollaborativeElementEnum.Circle:
			addCircle(lat,lng);
			break;
		case CollaborativeElementEnum.Polygon:
			addPolygon(lat,lng, shiftDown);
			break;
		case CollaborativeElementEnum.Popup:
			addPopup(lat,lng);
			break;
	  }
}
// TODO: add color
var addMarker  = function(lat, lng)
{
	var marker = new cMarker(currUser, [lat, lng]);
}
var addCircle  = function(lat, lng)
{
	var circle = new cCircle(currUser, [lat, lng], 500);
}
var polyPositions = [];
var addPolygon  = function(lat, lng, shiftDown)
{
	if (polyPositions.length > 2)
	{
		console.log(shiftDown);
		if (shiftDown)
			polyPositions.push([lat,lng]);
		else
		{
			var polygon = new cPolygon(currUser, polyPositions);
			polyPositions = [];
		}
	}
	else
		polyPositions.push([lat,lng]);
}
var addPopup  = function(lat, lng)
{
	//var circle = new cCircle(currUser, [lat, lng], 500);
}


// ===========================================

const ip = 'localhost';
const port = 3000;
$(function(){
	var onlineUsers = [],socket,userName = '',userColor = '';
	

	//login
	$("#login").on("click",function(){
		$('#login_div').hide()
		socket = io(`ws://${ip}:${port}`);
		socket.on('connect', function (data) {              
			userName = $('#user_name').val();
			userColor = $('#user_color').val();
			var tmp = {'name':userName, 'color':userColor};
			socket.emit('new user', tmp);
			$('#div').show();
			$('#main').show();
			
			socket.on('initial map', function(ops){
				ops.forEach(data => {
					mapOnClick(data.lat, data.lng, !!data.shiftKey);		
				//TODO: mapOnClick(data.lat, data.lng, !!data.shiftKey, data.cat, data.name, data.color);
				});
			})

			socket.on("online users",function(data){
				console.log("get online users: " + data);
				if(data.length>onlineUsers.length){
					console.log(data.at(-1));
					$('#message_status').append(`<li><b>${data.at(-1).name}</b>&nbsp;<b>${data.at(-1).color}</b>&nbsp;enter&nbsp;${new Date().toLocaleTimeString()}</li>`);
				}
				var onlineUsersNames = data.map((item)=>{
					return item.name;
				})
				$('#online').html(onlineUsersNames.join(','));
				onlineUsers = data;
				console.log("update online user number："+onlineUsers.length);
			});

			socket.on('user disconnected',function(name){
					$('#message_status').append(`<li><b>${name.slice(-1)[0]}</b>&nbsp;quite&nbsp;${new Date().toLocaleTimeString()}</li>`);
			})

		});
	});	

	$("#markers").click(function(e){
		currentCategory = CollaborativeElementEnum.Marker;
	});
	$("#circles").click(function(e){  
		currentCategory = CollaborativeElementEnum.Circle;
	});
	$("#polygons").click(function(e){
		currentCategory = CollaborativeElementEnum.Polygon;
	});
	$("#popups").click(function(e){
		currentCategory = CollaborativeElementEnum.Popup;
	});

	$("#map").click(function(e){
		msg.name = userName;
		msg.color = userColor;
		console.log("socket emit update map: " + msg.cat);
		socket = io(`ws://${ip}:${port}`);
		socket.on('connect', function (data) {  
			
			socket.emit('message', msg);
			console.log("after emit: " + msg);
			socket.on('update map', function (data) {
				// let $message_list = $('#message_list');
				// $message_list.append(`<li><span><span class='name'>${data.name}&nbsp;<small>${data.cat}</small></span></span></li>`);

				mapOnClick(data.lat, data.lng, !!data.shiftKey);		
				//TODO: mapOnClick(data.lat, data.lng, !!data.shiftKey, data.cat, data.name, data.color);
			});

		})
		
	});

	
	
});


