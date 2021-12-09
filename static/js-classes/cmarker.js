class cMarker extends cElement
{
	constructor(user, position)
	{
		super(user);
		this.marker = L.marker(position).addTo(map);
	}
	RemoveElementFromMap()
	{
		super.RemoveElementFromMap();
	}
}