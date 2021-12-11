const AlertColor = {
  Connected: '#2FB986',
  Joining: '#47A8F5',
  Leaving: '#F66359',
  Other: '#3C4043'
};

var showPopup = function(text, color)
{
	var alertTxt = document.getElementById("alert_text");
	alertTxt.textContent = text;

	var alert = document.getElementById("alert");
	alert.style.background = color;
	alert.style.display = "block";
}

var closePopup = function()
{
	var alert = document.getElementById("alert");
	alert.style.display = "none";
}