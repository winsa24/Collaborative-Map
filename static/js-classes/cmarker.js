class cMarker extends cElement
{
	constructor(user, position)
	{
		super(user);

		const markerHtmlStyles = `
		background-color: ${user.color};
		width: 2rem;
		height: 2rem;
		display: block;
		left: -1.5rem;
		top: -1.5rem;
		position: relative;
		border-radius: 3rem 3rem 0;
		transform: rotate(45deg);
		border: 1px solid #FFFFFF`

		const colorIcon = L.divIcon({
		className: "my-custom-pin",
		iconAnchor: [0, 24],
		labelAnchor: [-6, 0],
		popupAnchor: [0, -36],
		html: `<span style="${markerHtmlStyles}" />`
		})

		this.marker = L.marker(position, {icon: colorIcon}).addTo(map);
	}
	RemoveElementFromMap()
	{
		super.RemoveElementFromMap();
	}
}