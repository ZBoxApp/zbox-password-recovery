const moment = require('moment');
const nodemailer = require('nodemailer');
const ZimbraAdminApi = require('zimbra-admin-api-js');

const Utils = require('../utils/Utils.jsx');

const TokenRequest = Parse.Object.extend("TokenRequest");
const securityStatus = process.env.SECURITY_RESTRINGE_STATUS.split(',');

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
    UNAUTHORIZED: {code: 'ZB006', description: 'No esta autorizado para realizar esta operación'}
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

    transporter.sendMail({
        from: process.env.MAILER_USERNAME,
        to: 'gustavo@zboxapp.com',
        subject: 'RECOVERY EMAIL',
        text: `Su codigo de confirmación es ${token}`
    }, (error, data) => {
        callback(error, data)
    });
}

function sendSMS(to, tokenRequest, callback) {
    callback();
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
                                                    secondaryEmail: Utils.protectEmail('gustavo@zboxapp.com')
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
                                                    phone: Utils.protectEmail('gustavo@zboxapp.com')
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

/*Parse.Cloud.define('sendEmail', function (req, res) {
 let email = req.params.email;

 zimbraApi.getAccount(email, (error, data)=> {
 if (error) {
 response.error(RESET_ERROR.NOT_EXIST);
 } else {
 let transporter = nodemailer.createTransport(smtpConfig);

 // Se debe verificar si existe para generar otro
 token = makeid();

 transporter.sendMail({
 from: process.env.MAILER_USERNAME,
 to: 'gustavo@zboxapp.com',
 subject: 'RECOVERY EMAIL',
 text: `Su codigo de confirmación es ${token}`
 }, (err, info) => {
 if (err) {
 res.error({e: err});
 } else {
 res.success({});
 }
 });
 }
 });
 });*/

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
