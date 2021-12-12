class cCircle extends cElement
{
	constructor(data)
	{
		super(data);
		this.radius = data.radius;
		this.circle;
		this.setupCircle();
	}
	getData()
	{
		var data = super.getData();
		data.cat = CollaborativeElementEnum.Circle;
		data.radius = this.radius;
		return data;
	}

	// methods that shouldn't be used outside of this class
	setupCircle()
	{
		this.circle = L.circle(super.getPosition(), {
			color: super.getColor(),
			fillColor: super.getColor(),
			fillOpacity: 0.5,
			radius: this.radius,
			clickable: true
		}).addTo(map);
		this.circle.on("click", (e) => {node_select(this);});
	}


	// Edit methods
	update(data)
	{
		super.update(data.user, data.pos, data.lock);
		this.radius = data.radius;
		this.updateCircle();
	}
	removeElem()
	{
		this.circle.remove();
	}
	updateCircle()
	{
		this.removeElem();
		this.setupCircle();
	}	
	select()
	{
		this.circle.bindPopup("Selected").openPopup();
	}
}