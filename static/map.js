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


var map;
let msg;
var currentCategory = CollaborativeElementEnum.Marker;
var onlineUserViews = {};

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

// =========== Set Map On CallBacks ==============

var mapOnClick = function(e)	// locally check what the user is doing : he is picking an element (selection) or adding an element (add)
{
	let lat = e.latlng.lat
	let lng = e.latlng.lng
	console.log("Clicked on: [" + lat + "," +lng + "]");	
	
	// TODO : try to select an element to edit it...

	// no element found : add one	
	msg = {'user': localUser, 'type': MessageEnum.Add, 'lat': e.latlng.lat, 'lng': e.latlng.lng, 'shiftDown': e.shiftKey, 'cat': currentCategory};	// set the message using the coords that will be used by the sockets
}
var mapOnPan = function()
{
	msg = {'type': MessageEnum.Pan,};	// block the map update emision because we are paning

	node_MapOnPan();
}
var node_MapOnPan = function()
{	
	let b = map.getBounds();

	var sw = b.getSouthWest();
	var ne = b.getNorthEast();
	let bounds = { 'sw_lat': sw.lat,'sw_lng': sw.lng,'ne_lat': ne.lat,'ne_lng': ne.lng };	// latlngbound isn't recognized by app, so put it in regular object of which we know the attributes name
	
	console.log(`${bounds.sw_lat},${bounds.sw_lng} ; ${bounds.ne_lat},${bounds.ne_lng}`);
	socket.emit('userPaned', localUser.name, bounds);
}
// map.panTo(pos, zoom);
var snapToUserView = function(username)
{
	if (username == localUser.name)
		return;
	map.panInsideBounds(onlineUserViews[username].getBounds());
}


// =========== Element Addition ==============
// TODO: add color
var addElement = function(user, category, lat, lng, shiftDown)	// Add an element locally called by event callbacks
{
	switch(category) {
		case CollaborativeElementEnum.Marker:
			addMarker(user, lat,lng);
			break;
		case CollaborativeElementEnum.Circle:
			addCircle(user, lat,lng);
			break;
		case CollaborativeElementEnum.Polygon:
			addPolygon(user, lat,lng, shiftDown);
			break;
		case CollaborativeElementEnum.Popup:
			addPopup(user, lat,lng);
			break;
	}
}

var addMarker  = function(user, lat, lng)
{
	var marker = new cMarker(user, [lat, lng]);
}
var addCircle  = function(user, lat, lng)
{
	var circle = new cCircle(user, [lat, lng], 500);
}
//var polyPositions = [];
var addPolygon  = function(user, lat, lng, shiftDown)
{
	/*if (polyPositions.length > 2)
	{
		console.log(shiftDown);
		if (shiftDown)
			polyPositions.push([lat,lng]);
		else
		{
			var polygon = new cPolygon(localUser, polyPositions);
			polyPositions = [];
		}
	}
	else
		polyPositions.push([lat,lng]);*/
}
var addPopup  = function(user, lat, lng)
{
	//var circle = new cCircle(localUser, [lat, lng], 500);
}
// ---
var node_AddElement = function(msg)		// Use the given message to add an element for everyone
{
	console.log("E: emit addElement");
	socket.emit('addElement', msg);
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

var localUser;
var socket;
$(function(){
	//login
	$("#login").on("click",function(){
			
		let name = $('#user_name').val();
		if (name === "")
		{
			$("#user_name").css("background-color","#F0544B");
			return;
		}

		$('#login_div').hide();
		socket = io(`ws://${ip}:${port}`);	
	
		
		// Setup socket callbacks

		socket.on('connect', function (data) {			
			let userName = $('#user_name').val();
			let userColor = $('#user_color').val();
			localUser = new cUser(userName, userColor);

			var tmp = {'name':userName, 'color':userColor};
			socket.emit('newUser', tmp);	// litterally the localUser cUser but app doesn't know cUser
			$('#div_OnlineUsers').show();
			$('#main').show();
			map.invalidateSize();
		});
		socket.on('nameChanged', function(newName) {
			localUser.name = newName;
		});
		socket.on('mapNameChange', function(newMapName) {
			console.log("Change name : " + newMapName);
			document.getElementById("mapNameTxt").textContent = newMapName;
		});

		socket.on("online users", function(users, userViews){
			for (let us in onlineUserViews)
			{
				onlineUserViews[us].removeRect();
				delete onlineUserViews[us];
			}
			
			var ul = document.getElementById("list_OnlineUsers");
			while( ul.firstChild ){
				ul.removeChild( ul.firstChild );
			}

			for (let user of users)
			{				
				var listItem = document.createElement("li");

				var button = document.createElement('button');
				button.type = 'button';
				button.innerHTML = user.name;
				button.style.backgroundColor = user.color
				button.className = 'userBtn';
			
				button.onclick = snapToUserView.bind(button, user.name);
				listItem.appendChild(button);

				ul.appendChild(listItem);
				console.log("Online: Added " + user.name);

				if (user.name != localUser.name)
				{
					let cUsV = new cUserView(user.color, userViews[user.name]);
					onlineUserViews[user.name] = cUsV;
				}
			}
		});

		socket.on('otherUserPaned', function(username, bound)
		{
			for (let name in onlineUserViews)
				console.log(name);

			onlineUserViews[username].change(bound);
		});
		socket.on('userJoined', function(name){
			showAlert(`${name} joined !`, AlertColor.Joining);
		});
		socket.on('userDisconnected', function(name){
			showAlert(`${name} has left.`, AlertColor.Leaving);
		});


		socket.on('initMap', function(ops, mapName, view){		// Init the map by adding every already added element
			console.log("Initialising map...");
			document.getElementById("mapNameTxt").textContent = mapName;
			map.setView(view.pos, view.zoom);
			ops.forEach(data => {
				addElement(data.user, data.cat, data.lat, data.lng, !!data.shiftKey);
			})
			showAlert(`Connected as ${localUser.name} !`, AlertColor.Connected);
			node_MapOnPan();
		});

		socket.on('AddOnMap', function (data) {
			console.log("Add on Map: " + data.cat);
			addElement(data.user, data.cat, data.lat, data.lng, !!data.shiftKey);
		});
	});

	

	$("#mapNameBtn").click(function(e){
		var text = $('#mapNameInput').val();
		console.log("Set name : " + text);
		socket.emit('setMapName', text);
	});
	$("#defViewBtn").click(function(e){
		let curView = {'pos': map.getCenter(), 'zoom': map.getZoom()};
		socket.emit('setDafaultView', curView);
	});


	// On map release, called even when panning
	$("#map").click(function(e){
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
				//node_MapOnPan();			
				break;
			}
		}
	});
});