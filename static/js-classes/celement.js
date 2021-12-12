class cElement 	// c_ollaborative_Element
{
	constructor(user, position)
	{
		this.user = user;
		this.position = position;
		this.lock = false;
	}
	changeUser(newUser)
	{
		this.user = newUser;
	}
	getColor()
	{
		if(this.lock)
			return "#C1C1C1";
		else
			return this.user.color;
	}
	getPosition()
	{
		return this.position;
	}
	getData()
	{
		return {'user': this.user, 'pos': this.position, 'lock': this.lock};
	}
}