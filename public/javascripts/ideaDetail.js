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
