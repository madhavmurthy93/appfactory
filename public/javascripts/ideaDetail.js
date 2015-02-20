$(document).ready(function() {
	$('#defaultVote').change(function() {
		$('#dollarVote').val($('#defaultVote').val());
	});
});