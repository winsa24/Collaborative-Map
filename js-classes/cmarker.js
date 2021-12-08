class cMarker extends cElement
{
	constructor(map, L, user)
	{
		super(user);
		this.marker = L.marker([51.5, -0.09]).addTo(map);
	}
}