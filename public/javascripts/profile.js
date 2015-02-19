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

var setDeveloperChecked = function(checked) {
    var isDeveloperCheckbox = document.getElementById('isDeveloper');
    isDeveloperCheckbox.checked = checked;
}

window.onload = function() {
    // Make sure the checkbox is checked if it's supposed to be.
    var isDeveloperCheckbox = document.getElementById('isDeveloper');
    console.log('idc:', isDeveloperCheckbox);
    isDeveloperCheckbox.checked = parseInt(isDeveloperCheckbox.value);
}
