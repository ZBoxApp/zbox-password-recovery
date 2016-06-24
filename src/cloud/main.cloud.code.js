Parse.Cloud.define('getUserByName', function(req, res){
    res.success({});
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
