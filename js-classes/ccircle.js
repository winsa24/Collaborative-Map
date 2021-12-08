class cCircle extends cElement
{
	constructor(map, L, user, position, radius)
	{
		super(user);
		this.circle = L.circle(position, {
			color: user.GetUserColor(),		// It has the color of its original user
			fillColor: user.GetUserColor(),	//				''
			fillOpacity: 0.5,
			radius: radius
		}).addTo(map);
	}
}