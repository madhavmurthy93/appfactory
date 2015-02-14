var express = require('express');
var fs = require('fs');
var multer = require('multer');
var router = express.Router();


/* GET idea page. */
router.get('/', function(req, res) {
    res.render('idea');
});


// This route receives the posted form.
// As explained above, usage of 'body-parser' means
// that `req.body` will be filled in with the form elements
router.post('/',
	    multer({dest: './idea_images/',
		    limits:{fileSize: 1024*1024,
			    files: 1},
		    onFileUploadComplete: function (file) {
			console.log(file.fieldname + ' uploaded to  '
				    + file.path);
		    }}),
	    function(req, res){
		var imagePath = req.files.displayImage.path;
		var imageName = req.files.displayImage.name;
		/*
		var readStream = fs.createReadStream(
		    imagePath);
		readStream.pipe(res);
		*/

		console.log('Post handler.', req.files)
		var html = 'Hello ' + req.body.name + '.<br>' +
		    '<img src="/idea/thumbs/' + imageName + '"><br>' +
		    '<a href="/idea">Try again.</a>';
		    res.send(html);

	    });


router.get('/thumbs/*', function(req, res) {
    console.log('Thumbs image:', req.path.split('/')[2]);
    var imagePath = './idea_images/'
    var readStream = fs.createReadStream(
	imagePath);
		readStream.pipe(res);
    res.send('');
});

module.exports = router;
