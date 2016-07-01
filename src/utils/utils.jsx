const crypto = require('crypto');


function protectPhone(phone) {
    let a = phone.substring(0, 2);
    let b = phone.substring(9);

    return `${a}*****${b}`;
}

function protectEmail(email) {
    let split = email.split("@");
    let a = split[0].substring(0, 2);
    let b = split[1][0];
    let c = split[1].substring(split[1].lastIndexOf("."));

    return `${a}****@${b}***${c}`;
}

function isValidEmail(email) {
    var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return emailRegex.test(email);
}

function generateToken(length = 6) {
    if ((0 >= length) || (40 < length)) {
        throw new Error('La longitud del token debe estar en el rango entre 1 y 40')
    }

    let timestamp = Math.floor(Date.now());
    console.log(typeof  timestamp);
    console.log(typeof  timestamp.toString());
    let hash = crypto.createHash('sha1').update(timestamp.toString(), 'utf8').digest('hex');

    // 40 is a length of sha1
    let startPosition = Math.min(40 - length, mt_rand(0, 33));

    return hash.substr(startPosition, length);
}

function mt_rand(min, max) {
    var argc = arguments.length;
    if (argc === 0) {
        min = 0;
        max = 2147483647;
    } else if (argc === 1) {
        throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given')
    } else {
        min = parseInt(min, 10);
        max = parseInt(max, 10);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = {
    protectPhone: protectPhone,
    protectEmail: protectEmail,
    isValidEmail: isValidEmail,
    generateToken: generateToken
};
