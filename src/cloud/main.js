const ZimbraAdminApi = require('zimbra-admin-api-js');
const Utils = require('../utils/Utils.jsx');

const zimbraApi = new ZimbraAdminApi({
    'url': process.env.ZIMBRA_HOST,
    'user': process.env.ZIMBRA_USERNAME,
    'password': process.env.ZIMBRA_PASSWORD
});

Parse.Cloud.define('getAccount', function (req, res) {
    let email = req.params.email;

    zimbraApi.getAccount(email, (error, data)=> {
        if(error){
            res.error(`La cuenta ${email} no existe`);
        } else {
            res.success({
                id: data.id,
                email: email,
                secondaryEmail: Utils.protectEmail('gustavo@zboxapp.com'),
                phone: Utils.protectPhone('+56998587383')
            });
        }
    });
});

// the way to call this function in REST API is simple
// supose that you`re using http://localhost:1337/parse
// just use that url and append /functions/nameOfFunctionDefined.
// sample : http://localhost:1337/parse/functions/getUserByName
// once you call this function you must pass though headers like
// X-Parse-Application-Id : YOUR_APP_ID
// X-Parse-Master-Key : YOUR_MASTER_KEY || YOUR_CLIENT_KEY... etc.
// Content-Type : application/json
// and pass through body the params in json format like
// {nombre : 'YOUR NAME'}
