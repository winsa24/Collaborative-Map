class cMarker extends cElement
{
	// Constructor & Extractor
	constructor(data)
	{
		super(data);
		this.title = data.title;
		this.marker;
		this.setupMarker();
	}
	getData()
	{
		var data = super.getData();
		data.cat = CollaborativeElementEnum.Marker;
		data.title = this.title;
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
		this.marker = L.marker(super.getPosition(), {icon: this.createIcon(), title: this.title, clickable: true}).addTo(map);
		this.marker.on("click", (e) => {node_select(this);});
	}


	// Edit methods
	update(data)
	{
		super.update(data.user, data.pos, data.lock);
		this.title = data.title;
		this.updateMarker();
	}
	removeElem()
	{
		this.marker.remove();
	}
	updateMarker()
	{
		this.removeElem();
		this.setupMarker();
	}
	select()
	{
		this.marker.bindPopup("Selected").openPopup();
	}
}