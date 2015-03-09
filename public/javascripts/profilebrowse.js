var clickFilter = function(specialty) {
    filters = [];
    var filterInputs = $('.filter-input');
    for (i = 0; i < filterInputs.length; ++i) {
	if (filterInputs[i].checked) {
	    filters.push(encodeURIComponent(filterInputs[i].id));
	}
    }

    console.log('Filters:', filters);
    // Reload with the new filters.
    if (filters.length > 0) {
	window.location.href = '/profile/browse?filters=' + filters.join(',');
    } else {
	window.location.href = '/profile/browse';
    }
}
