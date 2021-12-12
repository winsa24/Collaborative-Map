class cUserView 	// c_ollaborative_UserView_point
{
	constructor(userColor, bound)
	{
		this.color = userColor;
		this.sw_lat;
		this.sw_lng;
		this.ne_lat;
		this.ne_lng;
		this.rectangle;
		this.setupRect(bound);
	}
	setupRect(bound)
	{
		this.sw_lat = bound.sw_lat;
		this.sw_lng = bound.sw_lng;
		this.ne_lat = bound.ne_lat;
		this.ne_lng = bound.ne_lng;

		this.rectangle = L.rectangle(this.getBounds(),{
			color: this.color,
			fill: false,
			weight: 5
		}).addTo(map);
	}

	removeRect()
	{
		this.rectangle.remove();
	}
	change(bound)
	{
		this.removeRect();
		this.setupRect(bound);
	}

	getBounds()
	{
		return [
			[this.sw_lat, this.sw_lng],
			[this.ne_lat, this.ne_lng]
		];
	}
}