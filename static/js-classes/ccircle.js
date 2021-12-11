class cCircle extends cElement
{
	constructor(user, position, radius)
	{
		super(user);
		this.circle = L.circle(position, {
			color: user.color,
			fillColor: user.color,
			fillOpacity: 0.5,
			radius: radius
		}).addTo(map);
	}
}