var isDeveloperClicked = function(isDeveloperCheckbox) {
    // Notify the server of the new state, whether the user is a
    // developer or not.
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', '/profile/setDeveloper', true);
    xmlhttp.setRequestHeader('Content-type',
			     'application/x-www-form-urlencoded');
    var isDeveloperValue = 0;
    if (isDeveloperCheckbox.checked) {
	isDeveloperValue = 1;
    }
    xmlhttp.send('isDeveloper=' + isDeveloperValue);
}
