const AlertColor = {
  Connected: '#2FB986',
  Joining: '#47A8F5',
  Leaving: '#F66359',
  Edited: '#3C4043',
  Deleted: '#F2D163',
  Focus: '#6707B6'
};

var alertTimeOut;

var showAlert = function(text, color, emiter, time, pos)
{
	var alertTxt = document.getElementById("alert_text");
	alertTxt.textContent = text;

	var alertPanBtn = document.getElementById("alert_panbtn");
	alertPanBtn.style.background = emiter.color;
	alertPanBtn.onclick = snapToEmiterView.bind(alertPanBtn, emiter.name);

	var alertViewBtn = document.getElementById("alert_viewbtn");
	if (pos != null)
	{
		alertViewBtn.textContent = "see";
		alertViewBtn.onclick = panToPos.bind(alertViewBtn, pos);
		alertViewBtn.style.display = "block";
	}
	else
	{		
		alertViewBtn.style.display = "none";
	}

	var alert = document.getElementById("alert");
	alert.style.background = color;
	alert.style.display = "block";


	if(typeof alertTimeOut !== 'undefined')
		clearTimeout(alertTimeOut);

	alertTimeOut = setTimeout(closeAlert, time * 1000);
}


// ==== Alert Button Callbacks ====

var snapToEmiterView = function(name)
{
	var snapBtn = document.getElementById('userBtn_' + name);
	if (snapBtn == null)
		return;
	
	snapBtn.click();
}
var panToPos = function(pos)
{
	console.log("panToPos " + pos);
	map.panTo(pos);
}
var closeAlert = function()
{
	var alert = document.getElementById("alert");
	alert.style.display = "none";
}