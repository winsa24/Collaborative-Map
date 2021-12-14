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
	setupCircle(selected)
	{
		if (selected != null && selected)
		{
			this.circle = L.circle(super.getPosition(), {
				color: super.getColor(),
				fillColor: super.getColor(),
				fillOpacity: 0.5,
				radius: this.radius,
				clickable: true,
				draggable: true
			}).addTo(map);
			this.circle.on("dragend", (e) => {elementMoving(e.target.getLatLng());});
		}
		else
		{
			this.circle = L.circle(super.getPosition(), {
				color: super.getColor(),
				fillColor: super.getColor(),
				fillOpacity: 0.5,
				radius: this.radius,
				clickable: true
			}).addTo(map);
		}
		this.circle.on("click", (e) => {node_select(this);});
	}


	// Public Edit methods
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
	updateVisual(selected)
	{
		this.removeElem();
		this.setupCircle(selected);
	}	
	select()
	{
		this.circle.bindPopup("Selected").openPopup();
	}
}