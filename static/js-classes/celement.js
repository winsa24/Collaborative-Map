class cElement 	// c_ollaborative_Element
{
	constructor(data)
	{
		this.user = data.user;
		this.position = data.pos;
		this.lock = data.lock;
		this.cat = data.cat;
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

	update(user, position, lock)
	{
		this.user = user;
		this.position = position;
		this.lock = lock;
	}
}