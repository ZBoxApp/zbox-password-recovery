const ajax = require('superagent');
const express = require('express');
const router = express.Router();
const parseApp1 = require('../utils/parseConfig.jsx').getConfig('app1');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'zBox Password Recovery Tool'});
});

module.exports = router;
