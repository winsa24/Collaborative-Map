const MessageEnum = {
  Add: 'Add',
  Remove: 'Remove',
  Select: 'Select',
  Pan: 'Pan',
  Zoom: 'Zoom'
};
const CollaborativeElementEnum = {
  Marker: 'Marker',
  Circle: 'Circle',
};


var map;
var currentCategory = CollaborativeElementEnum.Marker;
var onlineUserViews = {};

var markers = [];
var circles = [];


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
	let data = {'user': localUser, 'pos': e.latlng, 'lock': false, 'cat': currentCategory};
	// depending on currentCategory, add additional fields (raidus, title...)
	
	node_AddElement(data);
}
var mapOnPan = function()
{
	node_MapOnPan();
}
var node_MapOnPan = function()
{	
	let b = map.getBounds();

	var sw = b.getSouthWest();
	var ne = b.getNorthEast();
	let bounds = { 'sw_lat': sw.lat,'sw_lng': sw.lng,'ne_lat': ne.lat,'ne_lng': ne.lng };	// latlngbound isn't recognized by app, so put it in regular object of which we know the attributes name
	
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

var addElement = function(data)				// Add an element locally called by event callbacks
{
	switch(data.cat) {
		case CollaborativeElementEnum.Marker:
			addMarker(data);
			break;
		case CollaborativeElementEnum.Circle:
			addCircle(data);
			break;
	}
}

var addMarker  = function(data)
{
	var marker = new cMarker(data);
	markers.push(marker);
}
var addCircle  = function(data)
{
	var circle = new cCircle(data);
	circles.push(circle);
}
// ---
var node_AddElement = function(msg)		// Use the given message to add an element for everyone
{
	console.log("E: emit addElement");
	socket.emit('addElement', msg);
}




// =========== Element Selection ==============

var onMarkerSelection = function(markerSelected)	// marker has been clicked, ask the server if we can select it (already locked or not ?)
{
	if (markerSelected.lock)
		return; // we know that the marker is locked, no need to ask to the server

	let lockMsg = markerSelected.getData();
	console.log("lock: ");
	console.log(lockMsg);
	socket.emit("lock", lockMsg);
}
var selectMaker = function()	// After a onMarkerSelection call, if available we get a signal that we select the marker (the other users will get a signal too but different)	
{

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
			console.log("R: Change name : " + newMapName);
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



		socket.on('initMap', function(elems, mapName, view){		// Init the map by adding every already added element
			console.log("R: Initialising map...");
			document.getElementById("mapNameTxt").textContent = mapName;
			map.setView(view.pos, view.zoom);

			elems.forEach(data => {
				addElement(data);
			})

			showAlert(`Connected as ${localUser.name} !`, AlertColor.Connected);
			node_MapOnPan();
		});

		socket.on('AddOnMap', function (data) {
			console.log("R: Add on Map: " + data.cat);
			addElement(data);
		});
	});

	

	$("#mapNameBtn").click(function(e){
		var text = $('#mapNameInput').val();
		socket.emit('setMapName', text);
	});
	$("#defViewBtn").click(function(e){
		let curView = {'pos': map.getCenter(), 'zoom': map.getZoom()};
		socket.emit('setDafaultView', curView);
	});
});