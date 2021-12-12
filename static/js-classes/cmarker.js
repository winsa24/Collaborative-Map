class cMarker extends cElement
{
	// Constructor & Extractor
	constructor(data)
	{
		super(data);
		this.text = "";
		this.marker;
		this.setupMarker();
	}
	getData()
	{
		var data = super.getData();
		data.cat = CollaborativeElementEnum.Marker;
		data.text = this.text;
		return data;
	}

	// methods that shouldn't be used outside of this class
	createIcon()
	{
		const markerHtmlStyles = `
		background-color: ${super.getColor()};
		width: 2rem;
		height: 2rem;
		display: block;
		left: -1.5rem;
		top: -1.5rem;
		position: relative;
		border-radius: 3rem 3rem 0;
		transform: rotate(45deg);
		border: 1px solid #FFFFFF`

		const colorIcon = L.divIcon({
		className: "my-custom-pin",
		iconAnchor: [0, 24],
		labelAnchor: [-6, 0],
		popupAnchor: [0, -36],
		html: `<span style="${markerHtmlStyles}" />`
		})

		return colorIcon;
	}
	setupMarker()
	{
		this.marker = L.marker(super.getPosition(), {icon: this.createIcon(), title: this.text, clickable: true}).addTo(map);
		this.marker.on("click", (e) => {node_select(this);});
	}
	removeMarker()
	{
		this.marker.remove();
	}
	updateMarker()
	{
		this.removeMarker();
		this.setupMarker();
	}


	// Edit methods
	update(data)
	{
		super.update(data.user, data.pos, data.lock);
		this.text = data.text;
		this.updateMarker();
	}
	deleteMarker(socket)
	{
		let msg = {'user': localUser, 'type': MessageEnum.Remove, 'cat': CollaborativeElementEnum.Marker, 'pos':this.position};
		socket.emit("deleteElement", msg);
		this.remove();
	}
	select()
	{
		super.changeUser(localUser);
		this.updateMarker();
	}
}