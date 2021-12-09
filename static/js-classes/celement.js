class cElement 	// c_ollaborative_Element
{
	constructor(user)
	{
		this.lastUser = user;
	}
	RemoveElementFromMap()
	{
		// do nothing for now, maybe add js node stuff later
		// mainly used to be derivated to remove the element of the ap
	}

	SetLastUser(newUser)
	{
		// we local isn't the new user
		// -> Popup to tell that the last user has changed
			// Replace if already existing
			// Else add only if local was the last user
		this.lastUser = newUser;
		// Or change element color
	}
	GetLastUser()
	{
		return this.lastUser;
	}
}