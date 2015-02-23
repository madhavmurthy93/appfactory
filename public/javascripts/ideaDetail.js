var removeImage = function(ideaId, imageNum) {
    // Send a request to the server to remove this image.  If it's
    // successful, we'll call removalComplete() to reload the page.
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('DELETE', '/idea/' + ideaId + '/screens/' + imageNum, true);
    xmlhttp.addEventListener("load", removalComplete, false);
    xmlhttp.send();
}

var removalComplete = function() {
    document.location.reload(true);
}

$(document).ready(function() {
	if (!($('#checkbox-toggle').prop('checked'))) {
		$('.optional').prop('disabled', true);
	}
	$('[data-toggle="tooltip"]').tooltip();

	$('#checkbox-toggle').change(function() {
		console.log('Hello world!');
		if (this.checked) {
			$('.optional').prop('disabled', false);
		} else {
			$('.optional').prop('disabled', true);
		}
	});

});
