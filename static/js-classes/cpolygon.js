class cPolygon extends cElement
{
	constructor(user, positions)
	{
		super(user);
        this.polygon = L.polygon(positions, {
			color: user.color,		// It has the color of its original user
			fillColor: user.color,	//				''
			fillOpacity: 0.5
		}).addTo(map);
	}
}