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

var toggleEditCategory = function() {
    $("#category").hide();
    $("#editCategory").show();
}

var submitEditCategory = function(ideaId) {
    var newCategory = $("#chosenCategory")[0].value;

    var params = "category=" + newCategory;

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('PUT', '/idea/' + ideaId, true);
    xmlhttp.addEventListener("load", function() {
	document.location.reload(true);
    }, false);
    xmlhttp.setRequestHeader("Content-type",
			     "application/x-www-form-urlencoded");
    xmlhttp.send(params);
}

var deleteIdea = function(ideaId) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('DELETE', '/idea/' + ideaId, true);
    xmlhttp.addEventListener('load', function() {
	// Redirect to the idea browsing page.
	window.location.href = '/';
    }, false);
    xmlhttp.send();
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
