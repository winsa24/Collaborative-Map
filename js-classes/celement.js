class cElement 	// c_ollaborative_Element
{
	constructor(user)
	{
		this.lastUser = user;
	}

	SetLastUser(newUser)
	{
		// we local isn't the new user
		// -> Popup to tell that the last user has changed
			// Replace if already existing
			// Else add only if local was the last user
		this.lastUser = newUser;
	}
	GetLastUser()
	{
		return this.lastUser;
	}
}