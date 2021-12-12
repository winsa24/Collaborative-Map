const AlertColor = {
  Connected: '#2FB986',
  Joining: '#47A8F5',
  Leaving: '#F66359',
  Edited: '#3C4043',
  Deleted: '#F2D163'
};

var alertTimeOut;

var showAlert = function(text, color)
{
	var alertTxt = document.getElementById("alert_text");
	alertTxt.textContent = text;

	var alert = document.getElementById("alert");
	alert.style.background = color;
	alert.style.display = "block";

	if(typeof alertTimeOut !== 'undefined')
		clearTimeout(alertTimeOut);

	alertTimeOut = setTimeout(closeAlert, 2000);
}

var closeAlert = function()
{
	var alert = document.getElementById("alert");
	alert.style.display = "none";
}