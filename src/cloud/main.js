"use strict";

const moment = require('moment');
const nodemailer = require('nodemailer');
const ZimbraAdminApi = require('zimbra-admin-api-js');

const Utils = require('../utils/utils.jsx');

const TokenRequest = Parse.Object.extend("TokenRequest");
const securityStatus = process.env.SECURITY_RESTRINGE_STATUS.split(',');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNTSID, process.env.TWILIO_AUTHTOKEN);
const Twitter = require('twitter');

const twitterApi = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const zimbraApi = new ZimbraAdminApi({
    'url': process.env.ZIMBRA_HOST,
    'user': process.env.ZIMBRA_USERNAME,
    'password': process.env.ZIMBRA_PASSWORD
});

const ZIMLET_NAME = 'zbox_pr';
const ZIMLET_PARAM_EMAIL = 'recovery_email';
const ZIMLET_PARAM_PHONE = 'recovery_phone';
const ZIMLET_PARAM_TWITTER = 'recovery_twitter';

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
    PASSWORD_SHORT: {code: 'ZB009', description: 'El password ingresado es demasiado corto'},
    TWITTER: {code: 'ZB010', description: 'Error enviando mensaje, recuerde que debe seguirnos en twitter para utilizar este método'},
};

const DEBUG = (msg, error) => {
    if (process.env.DEBUG) {
        console.log(msg, error);
    }
};

const getRecoveryMethods = (account) => {
    let methods = {};

    if (account.attrs.hasOwnProperty('zimbraZimletUserProperties')) {
        let obj = account.attrs.zimbraZimletUserProperties;

        Object.keys(obj).map(k=> {
            let item = obj[k].split(':');
            if (item[0] == ZIMLET_NAME) {
                switch (item[1]) {
                    case ZIMLET_PARAM_PHONE:
                        methods['phone'] = item[2];
                        break;
                    case ZIMLET_PARAM_EMAIL:
                        methods['email'] = item[2];
                        break;
                    case ZIMLET_PARAM_TWITTER:
                        methods['twitter'] = item[2];
                        break;
                }
            }
        });
    }

    return methods;
};

const sendEmail = (to, name, tokenRequest, callback) => {
    let transporter = nodemailer.createTransport(mailerConfig);
    let token = tokenRequest.toJSON().objectId;
    let duracion = process.env.SECURITY_TOKEN_TIMEOUT > 60 ? process.env.SECURITY_TOKEN_TIMEOUT / 60 : process.env.SECURITY_TOKEN_TIMEOUT;
    let units = process.env.SECURITY_TOKEN_TIMEOUT > 60 ? 'horas' : 'minutos';

    token = `${token.substr(0, 5)}-${token.substr(5, token.length)}`;

    let url = `https://${process.env.HOSTNAME}?e=${tokenRequest.get('account')}&t=${token}`;

    let html = `
        <p>Hola ${name},<br/>
           El siguiente mensaje contiene el código para que puedas cambiar tu contraseña de correo electrónico.
        </p>
        <p><strong>Código:</strong> ${token}</p>
        <p>Si lo prefieres, también puedes cambiar tu contraseña haciendo click en el siguiente enlace o copiar y pegarlo en tu navegador.</p>
        <p>${url}</p>
        <p>Este token tiene una duración de solo ${duracion} ${units}.</p>
        <p>Si tu no solicitaste el cambio de contraseña puedes descartar este correo.</p>
        <hr/>
        <p><img style="max-width:120px" src="https://${process.env.HOSTNAME}/images/zbox-logo.png"></p>`;

    transporter.sendMail({
        from: process.env.MAILER_USERNAME,
        to: to,
        subject: 'Recuperación de contraseña ZBox',
        html: html,
    }, (error, data) => {
        callback(error, data)
    });
};

const sendSMS = (to, tokenRequest, callback) => {
    let token = tokenRequest.toJSON().objectId;
    token = `${token.substr(0, 5)}-${token.substr(5, token.length)}`;

    twilio.sendMessage({
        to: to, // Any number Twilio can deliver to
        from: process.env.TWILIO_PHONE, // A number you bought from Twilio and can use for outbound communication
        body: `ZBox Mail: Tu Código de recuperación de contraseña es: ${token}`
    }, function (err, responseData) { //this function is executed when a response is received from Twilio
        callback(err, responseData);
    });
};

const sendTwitterDM = (to, tokenRequest, callback) => {
    let token = tokenRequest.toJSON().objectId;
    token = `${token.substr(0, 5)}-${token.substr(5, token.length)}`;

    twitterApi.post('direct_messages/new', {
        screen_name: to,
        text: `ZBox Mail: Tu Código de recuperación de contraseña es: ${token}`
    }, (error, tweet, response) => {
        callback(error, response);
    });
};

const getAccountName = (account) => {
    if (account.attrs.hasOwnProperty('displayName')) {
        return account.attrs.displayName;
    }

    if (account.attrs.hasOwnProperty('cn')) {
        return `${account.attrs.cn} ${account.attrs.sn}`;
    }

    if (account.attrs.hasOwnProperty('givenName')) {
        return `${account.attrs.givenName} ${account.attrs.sn}`;
    }

    return '';
};

Parse.Cloud.define('startReset', (request, response) => {
    let email = request.params.email || '';
    zimbraApi.getAccount(email, (error, account) => {
        if (error) {
            DEBUG('Cuenta No existe', error);
            return response.error(RESET_ERROR.NOT_EXIST);
        } else {
            DEBUG('Esta es la cuenta', account);
            // Se verifica si la cuenta
            if (securityStatus.indexOf(account.attrs.zimbraAccountStatus) > 0) {
                return response.error(RESET_ERROR.UNAUTHORIZED);
            }

            let query = new Parse.Query(TokenRequest);
            query.equalTo("account", email);

            let _accountName = getAccountName(account);

            query.find({
                success: (results) => {
                    // Hay un token de recuperación para esa cuenta
                    if (results.length !== 0) {
                        let isExpired = moment().isAfter(results[0].get('expireAt')) || process.env.APP_DEV;

                        if (isExpired) {
                            results[0].destroy();
                        } else {
                            return response.error(RESET_ERROR.RESET_IN_PROGRESS);
                        }
                    }

                    // Validar si hay metodos de recuperación
                    let recoveryMethods = getRecoveryMethods(account);

                    if (Object.keys(recoveryMethods).length == 0) {
                        return response.error(RESET_ERROR.NO_RECOVERY_METHODS);
                    }

                    let tokenRequest = new TokenRequest();

                    tokenRequest.set('account', email);
                    tokenRequest.set('expireAt', moment().add(process.env.SECURITY_TOKEN_TIMEOUT || 10, 'm').toDate());
                    tokenRequest.save(null, {
                        success: (tokenRequest) => {
                            if (Object.keys(recoveryMethods).length === 1) {
                                if (recoveryMethods.hasOwnProperty('email')) {
                                    sendEmail(recoveryMethods.email, _accountName, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMTP);
                                        } else {
                                            return response.success({
                                                name: _accountName,
                                                send: true,
                                                email: email,
                                                secondaryEmail: Utils.protectEmail(recoveryMethods.email)
                                            });
                                        }
                                    });
                                } else if (recoveryMethods.hasOwnProperty('phone')) {
                                    sendSMS(recoveryMethods.phone, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMS);
                                        } else {
                                            return response.success({
                                                name: _accountName,
                                                send: true,
                                                email: email,
                                                phone: Utils.protectPhone(recoveryMethods.phone)
                                            });
                                        }
                                    });
                                } else if (recoveryMethods.hasOwnProperty('twitter')) {
                                    sendTwitterDM(recoveryMethods.twitter, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.TWITTER);
                                        } else {
                                            return response.success({
                                                send: true,
                                                name: _accountName,
                                                email: email,
                                                twitter: Utils.protectGeneric(recoveryMethods.twitter, 4)
                                            });
                                        }
                                    });
                                } else {
                                    DEBUG('UNKNOWN ERROR', null);
                                    return response.error(RESET_ERROR.UNKNOWN);
                                }
                            } else {
                                return response.success({
                                    name: _accountName,
                                    email: email,
                                    send: false,
                                    secondaryEmail: Utils.protectEmail(recoveryMethods.email),
                                    phone: Utils.protectPhone(recoveryMethods.phone),
                                    twitter: Utils.protectGeneric(recoveryMethods.twitter, 4)
                                });
                            }
                        },
                        error: (error) => {
                            DEBUG('UNKNOWN ERROR 2', error);
                            return response.error(RESET_ERROR.UNKNOWN);
                        }
                    })
                },
                error: function (error) {
                    DEBUG('UNKNOWN ERROR 3', error);
                    return response.error(RESET_ERROR.UNKNOWN);
                }
            });
        }
    });
});

Parse.Cloud.define('sendToken', (request, response) => {
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

            let _accountName = getAccountName(account);

            query.find({
                success: (results) => {
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
                                    sendEmail(recoveryMethods.email, _accountName, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMTP);
                                        } else {
                                            return response.success({
                                                send: true,
                                                name: _accountName,
                                                email: email,
                                                secondaryEmail: Utils.protectEmail(recoveryMethods.email)
                                            });
                                        }
                                    });
                                    break;
                                case 'sms':
                                    sendSMS(recoveryMethods.phone, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.SMS);
                                        } else {
                                            return response.success({
                                                send: true,
                                                name: _accountName,
                                                email: email,
                                                phone: Utils.protectPhone(recoveryMethods.phone)
                                            });
                                        }
                                    });
                                    break;
                                case 'twitter':
                                    sendTwitterDM(recoveryMethods.twitter, tokenRequest, (error, data) => {
                                        if (error) {
                                            return response.error(RESET_ERROR.TWITTER);
                                        } else {
                                            return response.success({
                                                send: true,
                                                name: _accountName,
                                                email: email,
                                                twitter: Utils.protectGeneric(recoveryMethods.twitter, 4)
                                            });
                                        }
                                    });
                                    break;
                                default:
                                    DEBUG('UNKNOWN ERROR (SendToken 1)');
                                    return response.error(RESET_ERROR.UNKNOWN);
                            }
                        }
                    } else {
                        DEBUG('UNKNOWN ERROR (SendToken 2)');
                        return response.error(RESET_ERROR.UNKNOWN);
                    }
                },
                error: (error) => {
                    DEBUG('UNKNOWN ERROR (SendToken 3)', error);
                    return response.error(RESET_ERROR.UNKNOWN);
                }
            });
        }
    });
});

Parse.Cloud.define('validateToken', (request, response) => {
    let email = request.params.email || '';
    let token = request.params.token || '';

    let query = new Parse.Query(TokenRequest);
    query.equalTo("account", email);
    query.equalTo("objectId", token);

    query.find({
        success: (results) => {
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
        error: (error) => {
            return response.error(RESET_ERROR.UNKNOWN)
        }
    });
});

Parse.Cloud.define('changePassword', (request, response) => {
    let email = request.params.email || '';
    let token = request.params.token || '';
    let password = request.params.password || '';

    let query = new Parse.Query(TokenRequest);
    query.equalTo("account", email);
    query.equalTo("objectId", token);

    query.find({
        success: (results) => {
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
                        let batch = [
                            zimbraApi.modifyAccount(account.id, {zimbraAccountStatus: 'active'}),
                            zimbraApi.setPassword(account.id, password)
                        ];

                        zimbraApi.makeBatchRequest(batch, (err, data) => {
                            if (data.errors && data.errors.length > 0) {
                                let desc = "";

                                data.errors.forEach((element, index)=> {
                                    desc += element.extra.reason + "\n";
                                });

                                return response.error({description: desc})
                            }

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
        error: (error) => {
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
