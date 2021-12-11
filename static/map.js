const MessageEnum = {
  Add: 'Add',
  Select: 'Select',
  Pan: 'Pan',
  Zoom: 'Zoom'
};
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

	map.on('click', function(e){ mapOnClick(e); }); 
	map.on('moveend', function(e){ mapOnPan(); }); 
}
var setUserColor = function()
{
	const colorInput = document.getElementById("user_color");
	currUser = new cUser(currUser.GetUserName(), colorInput.value);
}

// =========== Set Map On CallBacks ==============

var mapOnClick = function(e)	// locally check what the user is doing : he is picking an element (selection) or adding an element (add)
{
	let lat = e.latlng.lat
	let lng = e.latlng.lng
	console.log("Clicked on: [" + lat + "," +lng + "]");	
	
	// TODO : try to select an element to edit it...

	// no element found : add one	
	msg = {'type': MessageEnum.Add, 'lat': e.latlng.lat, 'lng': e.latlng.lng, 'shiftDown': e.shiftKey, 'cat': currentCategory};	// set the message using the coords that will be used by the sockets
}
var mapOnPan = function()
{
  console.log("Panned on: " + map.getCenter().toString());
  msg = {'type': MessageEnum.Pan};	
}


// =========== Element Addition ==============
// TODO: add color
var addElement = function(category, lat, lng, shiftDown)	// Add an element locally, called by node_AddElement and on login only
{
	console.log(category);
	switch(category) {
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
// ---
var node_AddElement = function(msg)		// Use the given message to add an element for everyone
{
	socket.emit('message', msg);
	/*socket = io(`ws://${ip}:${port}`);
	socket.on('connect', function (data) { 		
		socket.emit('message', msg);
		console.log("after emit: " + msg);
	})*/
}


// ========= Toolbar's OnClicks ==============

var changeCategory = function (category)
{
	currentCategory = category;
}
var onMarkerCategoryClick = function() 		{ changeCategory(CollaborativeElementEnum.Marker); }
var onCircleCategoryClick = function() 		{ changeCategory(CollaborativeElementEnum.Circle); }
var onPolygonCategoryClick = function() 	{ changeCategory(CollaborativeElementEnum.Polygon); }
var onPopupCategoryClick = function()		{ changeCategory(CollaborativeElementEnum.Popup); }






// ===========================================

const ip = 'localhost';
const port = 3000;
var socket;
$(function(){
	var onlineUsers = [],userName = '',userColor = '0xFFFFDDDD';
	

	//login
	$("#login").on("click",function(){
		$('#login_div').hide()
		socket = io(`ws://${ip}:${port}`);
		
		// Setup socket callbacks

		socket.on('connect', function (data) {              
			userName = $('#user_name').val();
			userColor = $('#user_color').val();
			var tmp = {'name':userName, 'color':userColor};
			socket.emit('new user', tmp);
			$('#div').show();
			$('#main').show();
		});

		socket.on("online users",function(data){
			/*
			console.log("get online users: " + data);
			if(data.length > onlineUsers.length){
				console.log(data.at(-1));
				$('#message_status').append(`<li><b>${data.at(-1).name}</b>&nbsp;<b>${data.at(-1).color}</b>&nbsp;enter&nbsp;${new Date().toLocaleTimeString()}</li>`);
			}
			var onlineUsersNames = data.map((item)=>{
				return item.name;
			})
			$('#online').html(onlineUsersNames.join(','));
			onlineUsers = data;
			console.log("update online user number: "+onlineUsers.length);
			*/
		});

		socket.on('user disconnected',function(name){
			$('#message_status').append(`<li><b>${name.slice(-1)[0]}</b>&nbsp;quite&nbsp;${new Date().toLocaleTimeString()}</li>`);
		})

		
		socket.on('initial map', function(ops){		// Add on map every already added element
			ops.forEach(data => {
				//mapOnClick(data.lat, data.lng, !!data.shiftKey);		
				//TODO: mapOnClick(data.lat, data.lng, !!data.shiftKey, data.cat, data.name, data.color);
				console.log("Called for data: " + data.toString());
				console.log("Added " + data.cat);
				addElement(data.cat, data.lat, data.lng, !!data.shiftKey);
			})
		})

		socket.on('update map', function (data) {
			// let $message_list = $('#message_list');
			// $message_list.append(`<li><span><span class='name'>${data.name}&nbsp;<small>${data.cat}</small></span></span></li>`);

			console.log("Update Map: " + data.cat);
			addElement(data.cat, data.lat, data.lng, !!data.shiftKey);
		});

	});

	

	// On map release, called even when panning
	$("#map").click(function(e){
		// Whatever the message is, we add the username and color to it
		msg.name = userName;
		msg.color = userColor;
		console.log("socket emit update map: " + msg.type + " " + (msg.type == MessageEnum.Add ? msg.cat : ""));
		switch(msg.type) {
			case MessageEnum.Add:
			{
				node_AddElement(msg);
				break;
			}
			case MessageEnum.Select:
			{
			
				break;
			}
			case MessageEnum.Pan:
			{
			
				break;
			}
		}
	});
});