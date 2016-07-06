const moment = require('moment');
const nodemailer = require('nodemailer');
const ZimbraAdminApi = require('zimbra-admin-api-js');

const Utils = require('../utils/Utils.jsx');

const TokenRequest = Parse.Object.extend("TokenRequest");
const securityStatus = process.env.SECURITY_RESTRINGE_STATUS.split(',');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);

const zimbraApi = new ZimbraAdminApi({
    'url': process.env.ZIMBRA_HOST,
    'user': process.env.ZIMBRA_USERNAME,
    'password': process.env.ZIMBRA_PASSWORD
});

const mailerConfig = {
    host: process.env.MAILER_SMTP,
    port: process.env.MAILER_PORT,
    secure: process.env.MAILER_SSL == true,
    auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD
    }
};

const RESET_ERROR = {
    UNKNOWN: {code: 'ZB000', description: 'Error desconocido'},
    NOT_EXIST: {code: 'ZB001', description: 'La cuenta no existe'},
    NO_RECOVERY_METHODS: {code: 'ZB002', description: 'No hay metodos de recuperación disponibles'},
    RESET_IN_PROGRESS: {code: 'ZB003', description: 'Ya hay una solicitud en progreso para reinicio de contraseña'},
    SMTP: {code: 'ZB004', description: 'Error enviando correo'},
    SMS: {code: 'ZB005', description: 'Error enviando SMS'},
    UNAUTHORIZED: {code: 'ZB006', description: 'No esta autorizado para realizar esta operación'},
    TOKEN_EXPIRED: {code: 'ZB007', description: 'El token ha expirado'},
    TOKEN_INVALID: {code: 'ZB008', description: 'El token no es válido'},
    PASSWORD_SHORT: {code: 'ZB009', description: 'El password ingresado es demasiado corto'}
};

function getRecoveryMethods(account) {
    let methods = [];

    // Simulados (Primero agregar el email  luego el telefono)
    methods.push({type: 'email', value: 'gustavo@zboxapp.com'});
    methods.push({type: 'phone', value: '+56998587383'});

    return methods;
}

function sendEmail(to, tokenRequest, callback) {
    let transporter = nodemailer.createTransport(mailerConfig);
    let token = tokenRequest.toJSON().objectId;
    let url = `http://${process.env.HOSTNAME}${process.env.HOST != 80 ? (':' + process.env.PORT) : ''}?e=${tokenRequest.get('account')}&t=${token}`;

    transporter.sendMail({
        from: process.env.MAILER_USERNAME,
        to: to,
        subject: 'RECOVERY EMAIL',
        text: `Ingrese el token de confirmación ${token} en el formulario o haga clic en la siguiente url ${url}`
    }, (error, data) => {
        callback(error, data)
    });
}

function sendSMS(to, tokenRequest, callback) {
    let token = tokenRequest.toJSON().objectId;

    twilio.sendMessage({
        to: to, // Any number Twilio can deliver to
        from: process.env.TWILIO_PHONE, // A number you bought from Twilio and can use for outbound communication
        body: `Ingrese el token de confirmación ${token} en el formulario`
    }, function (err, responseData) { //this function is executed when a response is received from Twilio
        callback(err, responseData);
    });
}

Parse.Cloud.define('startReset', (request, response) => {
    let email = request.params.email || '';
    zimbraApi.getAccount(email, (error, account)=> {
        if (error) {
            return response.error(RESET_ERROR.NOT_EXIST);
        } else {
            // Se verifica si la cuenta
            if (securityStatus.indexOf(account.attrs.zimbraAccountStatus) > 0) {
                return response.error(RESET_ERROR.UNAUTHORIZED);
            }

            let query = new Parse.Query(TokenRequest);
            query.equalTo("account", email);

            query.find({
                success: function (results) {
                    // Hay un token de recuperación para esa cuenta
                    if (results.length !== 0) {
                        let isExpired = moment().isAfter(results[0].get('expireAt'));

                        if (isExpired) {
                            results[0].destroy();
                        } else {
                            return response.error(RESET_ERROR.RESET_IN_PROGRESS);
                        }
                    }

                    // Validar si hay metodos de recuperación
                    let recoveryMethods = getRecoveryMethods(account);

                    if (recoveryMethods.length == 0) {
                        return response.error(RESET_ERROR.NO_RECOVERY_METHODS);
                    }

                    let tokenRequest = new TokenRequest();

                    tokenRequest.set('account', email);
                    tokenRequest.set('expireAt', moment().add(process.env.SECURITY_TOKEN_TIMEOUT || 10, 'm').toDate());
                    tokenRequest.save(null, {
                        success: (tokenRequest) => {
                            if (recoveryMethods.length === 1) {
                                switch (recoveryMethods[0].type) {
                                    case 'email':
                                        sendEmail(recoveryMethods[0].value, tokenRequest, (error, data) => {
                                            if (error) {
                                                return response.error(RESET_ERROR.SMTP);
                                            } else {
                                                return response.success({
                                                    send: true,
                                                    email: email,
                                                    secondaryEmail: Utils.protectEmail(recoveryMethods[0].value)
                                                });
                                            }
                                        });
                                        break;
                                    case 'phone':
                                        sendSMS(recoveryMethods[0].value, tokenRequest, (error, data) => {
                                            if (error) {
                                                return response.error(RESET_ERROR.SMS);
                                            } else {
                                                return response.success({
                                                    send: true,
                                                    email: email,
                                                    phone: Utils.protectPhone(recoveryMethods[0].value)
                                                });
                                            }
                                        });
                                        break;
                                    default:
                                        return response.error(RESET_ERROR.UNKNOWN);
                                }
                            } else {
                                return response.success({
                                    email: email,
                                    send: false,
                                    secondaryEmail: Utils.protectEmail(recoveryMethods[0].value),
                                    phone: Utils.protectPhone(recoveryMethods[1].value)
                                });
                            }
                        },
                        error: (error) => {
                            return response.error(RESET_ERROR.UNKNOWN);
                        }
                    })
                },
                error: function (error) {
                    return response.error(RESET_ERROR.UNKNOWN);
                }
            });
        }
    });
});

Parse.Cloud.define('sendToken', function (request, response) {
    let email = request.params.email || '';
    let type = request.params.type || '';

    zimbraApi.getAccount(email, (error, account)=> {
        if (error) {
            return response.error(RESET_ERROR.NOT_EXIST);
        } else {
            // Se verifica si la cuenta
            if (securityStatus.indexOf(account.attrs.zimbraAccountStatus) > 0) {
                return response.error(RESET_ERROR.UNAUTHORIZED);
            }

            let query = new Parse.Query(TokenRequest);
            query.equalTo("account", email);

            query.find({
                success: function (results) {
                    // Hay un token de recuperación para esa cuenta
                    if (results.length === 1) {
                        let tokenRequest = results[0];

                        let isExpired = moment().isAfter(tokenRequest.get('expireAt'));

                        if (isExpired) {
                            tokenRequest.destroy();
                            return response.error(RESET_ERROR.TOKEN_EXPIRED);
                        } else {
                            let recoveryMethods = getRecoveryMethods(account);
                            switch (type) {
                                case 'email':
                                    sendEmail(recoveryMethods[0].value, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMTP);
                                        } else {
                                            return response.success({
                                                send: true,
                                                email: email,
                                                secondaryEmail: Utils.protectEmail(recoveryMethods[0].value)
                                            });
                                        }
                                    });
                                    break;
                                case 'sms':
                                    sendSMS(recoveryMethods[1].value, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMS);
                                        } else {
                                            return response.success({
                                                send: true,
                                                email: email,
                                                phone: Utils.protectPhone(recoveryMethods[1].value)
                                            });
                                        }
                                    });
                                    break;
                                default:
                                    return response.error(RESET_ERROR.UNKNOWN);
                            }
                        }
                    } else {
                        return response.error(RESET_ERROR.UNKNOWN);
                    }
                },
                error: function (error) {
                    return response.error(RESET_ERROR.UNKNOWN);
                }
            });
        }
    });
});

Parse.Cloud.define('validateToken', function (request, response) {
    let email = request.params.email || '';
    let token = request.params.token || '';

    let query = new Parse.Query(TokenRequest);
    query.equalTo("account", email);
    query.equalTo("objectId", token);

    query.find({
        success: function (results) {
            if (results.length === 1) {
                let isExpired = moment().isAfter(results[0].get('expireAt'));

                if (isExpired) {
                    results[0].destroy();
                    return response.error(RESET_ERROR.TOKEN_EXPIRED);
                }
                return response.success({
                    token: results[0].id,
                    email: email
                });
            } else {
                return response.error(RESET_ERROR.TOKEN_INVALID)
            }
        },
        error: function (error) {
            return response.error(RESET_ERROR.UNKNOWN)
        }
    });
});

Parse.Cloud.define('changePassword', function (request, response) {
    let email = request.params.email || '';
    let token = request.params.token || '';
    let password = request.params.password || '';

    let query = new Parse.Query(TokenRequest);
    query.equalTo("account", email);
    query.equalTo("objectId", token);

    query.find({
        success: function (results) {
            if (results.length === 1) {
                let isExpired = moment().isAfter(results[0].get('expireAt'));

                if (isExpired) {
                    results[0].destroy();
                    return response.error(RESET_ERROR.TOKEN_EXPIRED);
                }

                if (password.length < parseInt(process.env.SECURITY_PASSWORD_POLICY_SIZE)) {
                    results[0].destroy();
                    return response.error(RESET_ERROR.PASSWORD_SHORT);
                }

                zimbraApi.getAccount(email, (error, account)=> {
                    results[0].destroy();
                    if (error) {
                        return response.error(RESET_ERROR.NOT_EXIST);
                    } else {
                        account.setPassword(password, () => {
                            return response.success({
                                redirect: process.env.ZIMBRA_WEBMAIL_URL
                            });
                        });
                    }
                });
            } else {
                return response.error(RESET_ERROR.TOKEN_INVALID)
            }
        },
        error: function (error) {
            return response.error(RESET_ERROR.UNKNOWN)
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
