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
