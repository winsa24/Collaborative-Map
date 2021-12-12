class cCircle extends cElement
{
	constructor(data)
	{
		super(data);
		this.radius = 500
		this.circle = L.circle(super.getPosition(), {
			color: super.getColor(),
			fillColor: super.getColor(),
			fillOpacity: 0.5,
			radius: this.radius
		}).addTo(map);
	}
}