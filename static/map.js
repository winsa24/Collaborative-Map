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

var elements = [];
var selectedElementIndex = null;
var hasChanged = true;


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
	if (selectedElementIndex != null)
	{
		node_unselect();
	}
	else
	{
		let data = {'user': localUser, 'pos': e.latlng, 'lock': false, 'cat': currentCategory};
		if (currentCategory == CollaborativeElementEnum.Marker)
			data.title = "";
		else if (currentCategory == CollaborativeElementEnum.Circle)
			data.radius = 500;
		
		node_AddElement(data);
	}
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
	elements.push(marker);
}
var addCircle  = function(data)
{
	var circle = new cCircle(data);
	elements.push(circle);
}
// ---
var node_AddElement = function(msg)		// Use the given message to add an element for everyone
{
	console.log("E: emit addElement");
	socket.emit('addElement', msg);
}




// =========== Element Selection ==============

var node_select = function(elementSelected)	// marker has been clicked, ask the server if we can select it (already locked or not ?)
{
	console.log("Try Select");

	if (elementSelected.lock)
		return; // we know that the marker is locked, no need to ask to the server

	if(selectedElementIndex != null)
	{
		if (elements[selectedElementIndex] == elementSelected)
			return;
		else
			node_unselect();
	}

	// Check can select it according to local env (then the server will do another check) and get the index if so
	let index = -1;
	let data = elementSelected.getData();
	for (let i in elements)
	{
		let i_data = elements[i].getData();
		if ((data.cat == i_data.cat) && (data.pos == i_data.pos))
		{
			if (!elements[i].lock)
				index = i;
			break;	// found it, locked or not
		}
	}		
	if (index < 0)
		return;

	socket.emit("lock", index);
}
var select = function(i)	// After a onMarkerSelection call, if available we get a signal that we select the marker (the other users will get a signal too but different)	
{
	selectedElementIndex = i;
	hasChanged = false;

	switch(elements[i].cat) {
		case CollaborativeElementEnum.Marker:
			document.getElementById("input_markerTitle").value = elements[i].title;
			$('#markerEdit').show();
			break;
		case CollaborativeElementEnum.Circle:
			document.getElementById("input_circleRadius").value = elements[i].radius;
			$('#circleEdit').show();
			break;
	}

	$('#editTools').show();
	elements[i].select();
}

var node_unselect = function()
{
	if (selectedElementIndex == null)
		return;

	let selectedData = elements[selectedElementIndex].getData();
	socket.emit("unlock", selectedElementIndex, selectedData, localUser, hasChanged);	
}
var unselect = function()
{
	$('#editTools').hide();
	$('#markerEdit').hide();
	$('#circleEdit').hide();

	selectedElementIndex = null;
	hasChanged = null;	
}





// ========= Toolbar's OnClicks ==============

var changeCategory = function (category)
{
	currentCategory = category;
}
var onMarkerCategoryClick = function() 		{ changeCategory(CollaborativeElementEnum.Marker); }
var onCircleCategoryClick = function() 		{ changeCategory(CollaborativeElementEnum.Circle); }

var onMarkerTitleEditClick = function() {
	if (selectedElementIndex == null || elements[selectedElementIndex].cat != CollaborativeElementEnum.Marker)
		return;

	elements[selectedElementIndex].title = $("#input_markerTitle").val();;
	elements[selectedElementIndex].updateMarker();
	hasChanged = true;
	console.log("Marker edited" + elements[selectedElementIndex].title);
}
var onCircleCategoryChange = function() {
	if (selectedElementIndex == null || elements[selectedElementIndex].cat != CollaborativeElementEnum.Circle)
		return;

	elements[selectedElementIndex].radius = $("#input_circleRadius").val();;
	elements[selectedElementIndex].updateCircle();
	hasChanged = true;
	console.log("Circle edited" + elements[selectedElementIndex].radius);
}
var onDeleteButtonClick = function() {
	if (selectedElementIndex == null)
		return;

	console.log("trigger delete");
	socket.emit('delete', selectedElementIndex, localUser, elements[selectedElementIndex].getData());
}






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
			var ul = document.getElementById("list_OnlineUsers");
			while( ul.firstChild ){
				ul.removeChild( ul.firstChild );
			}
			for (let us in onlineUserViews)
			{
				onlineUserViews[us].removeRect();
				delete onlineUserViews[us];
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
		socket.on('userEditedYourWork', function(name){
			showAlert(`${name} edited your element.`, AlertColor.Edited);
		});
		socket.on('userDeletedYourWork', function(name){
			showAlert(`${name} deleted your element.`, AlertColor.Deleted);
		});



		socket.on('initMap', function(elems, mapName, view){		// Init the map by adding every already added element
			console.log("R: Initialising map...");
			document.getElementById("mapNameTxt").textContent = mapName;
			map.setView(view.pos, view.zoom);

			// Reset
			selectedElementIndex = null;
			hasChanged = true;
			for (el of elements)
			{
				el.removeElem();
			}
			elements = [];

			// Add Elements
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

		socket.on('UpdateElement', function(i, data) {
			console.log("R: Update element n°" + i);
			elements[i].update(data);
		})

		socket.on('SelectElement', function(i) {
			select(i);
		})
		socket.on('UnSelectElement', function() {
			unselect();
		})
		socket.on('DeleteElement', function(i) {
			console.log(elements.length);
			elements[i].removeElem();
			elements.splice(i,1);
			console.log(elements.length);

			if (selectedElementIndex != null && selectedElementIndex > i)	// move the selected index since we remove an element of the array before
				selectedElementIndex--;
		})
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