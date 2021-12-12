class cCircle extends cElement
{
	constructor(data)
	{
		super(data.user, data.pos);
		this.radius = 500
		this.circle = L.circle(super.getPosition(), {
			color: super.getColor(),
			fillColor: super.getColor(),
			fillOpacity: 0.5,
			radius: this.radius
		}).addTo(map);
	}
}