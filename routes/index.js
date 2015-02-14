var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {title: 'AppFactory'});
});

router.get('/about', function(req, res, next) {
	res.render('about');
});

router.post('/post', function(req, res, next) {

});

module.exports = router;
