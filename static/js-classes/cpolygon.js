class cPolygon extends cElement
{
	constructor(user, positions)
	{
		super(user);
        this.polygon = L.polygon(positions, {
			color: user.GetUserColor(),		// It has the color of its original user
			fillColor: user.GetUserColor(),	//				''
			fillOpacity: 0.5
		}).addTo(map);
	}
}