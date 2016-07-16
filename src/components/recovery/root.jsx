"use strict";

import React from "react";
import ajax from "superagent";
import swal from "sweetalert";
import Step1 from "./step1.jsx";
import Step2 from "./step2.jsx";
import Step3 from "./step3.jsx";
import Step4 from "./step4.jsx";
import * as Utils from "../../utils/utils.jsx";

export default class Root extends React.Component {
    constructor(props) {
        super(props);

        if (this.hasValidParameters(this.props.location.query)) {
            this.state = {
                step: 1,
                ajaxInProgress: false,
                email: this.props.location.query.e,
                token: this.props.location.query.t.replace('-', '')
            };
            this.toStep4();
        } else {
            this.state = {
                step: 1,
                ajaxInProgress: false
            };
        }

        this.ajaxCall = this.ajaxCall.bind(this);
        this.updateFromInput = this.updateFromInput.bind(this);
        this.getCurrentStep = this.getCurrentStep.bind(this);
        this.toStep2 = this.toStep2.bind(this);
        this.toStep3 = this.toStep3.bind(this);
        this.toStep4 = this.toStep4.bind(this);
        this.finish = this.finish.bind(this);
        this.resetState = this.resetState.bind(this);
        this.getReciever = this.getReciever.bind(this);
        this.getRecieverType = this.getRecieverType.bind(this);
    }

    hasValidParameters(query) {
        if (query.e && query.e.length > 0 && query.t && query.t.length > 0) {
            let existToken = true;
            if (existToken) {
                return true;
            }
        }

        return false
    }

    updateFromInput(data) {
        this.setState(data);
    }

    ajaxCall(component, url, params, successCb, errorCb) {
        component.setState({
            ajaxInProgress: true
        });

        ajax.post(url)
            .set('X-Parse-Application-Id', 'APPRESET')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(params)
            .end(function (error, response) {
                component.setState({
                    ajaxInProgress: false
                });

                if (error || !response.ok || (response.hasOwnProperty('body') && response.body.hasOwnProperty('error'))) {
                    swal({
                        title: "Error",
                        text: response.body.error.description,
                        type: "error",
                        showCancelButton: false,
                        confirmButtonText: "Aceptar",
                        closeOnConfirm: true
                    }, function () {
                        if (errorCb) {
                            errorCb(component, response.body.error);
                        }
                    });
                } else {
                    successCb(component, response.body.result);
                }
            });
    }

    toStep2() {
        let email = this.state.email;

        if (Utils.isValidEmail(email)) {
            this.ajaxCall(this, '/parse/functions/startReset', {email: email}, (component, data)=> {
                window.sessionStorage.setItem('attemps', 0);

                let state = {
                    step: data.send ? 3 : 2,
                    email: data.email,
                    name: data.name,
                    secondaryEmail: data.hasOwnProperty('secondaryEmail') ? data.secondaryEmail : null,
                    phone: data.hasOwnProperty('phone') ? data.phone : null,
                    twitter: data.hasOwnProperty('twitter') ? data.twitter : null,
                };

                if (state.step === 3) {
                    state.recieverType = component.getRecieverType(state);
                }

                component.setState(state);
            }, (component, data)=> {
                let attemps = window.sessionStorage.getItem('attemps') ? parseInt(window.sessionStorage.getItem('attemps')) : 0;
                let wait = (attemps + 1) * 10000;
                window.sessionStorage.setItem('attemps', attemps + 1);
                component.setState({disabled: true});

                setTimeout(()=> {
                    clearInterval(interval);
                    component.setState({disabled: false, wait: 0});
                }, wait);

                let interval = setInterval(()=> {
                    wait = wait - 1000;
                    component.setState({
                        wait: wait / 1000
                    });
                }, 1000);
            });
        } else {
            swal("Error", "Debe ingresar un email válido", "error");
        }
    }

    toStep3(type) {
        let params = {
            email: this.state.email,
            type: type
        };

        let desc = "";

        switch (type) {
            case "email":
                desc = "correo electrónico";
                break;
            case "sms":
                desc = "teléfono";
                break;
            case "twitter":
                desc = "twitter";
                break;
        }

        this.ajaxCall(this, '/parse/functions/sendToken', params, (component, data)=> {
            swal({
                title: "Código envíado",
                text: "Se ha enviado la información a su " + desc,
                type: "success",
                showCancelButton: false,
                confirmButtonText: "Aceptar",
                closeOnConfirm: true
            }, function () {
                component.setState({
                    step: 3,
                    recieverType: component.getRecieverType(component.state)
                });
            });
        });
    }

    toStep4() {
        let params = {
            email: this.state.email,
            token: this.state.token
        };

        this.ajaxCall(this, '/parse/functions/validateToken', params, (component, data)=> {
            let state = {
                step: 4,
                token: data.token
            };
            component.setState(state);
        });
    }

    finish(pass1, pass2) {
        if (pass1 === pass2) {
            let params = {
                email: this.state.email,
                token: this.state.token,
                password: this.state.password
            };

            this.ajaxCall(this, '/parse/functions/changePassword', params, (component, data)=> {
                swal({
                    title: "Exito",
                    text: "Su password ha sido reestablecido exitosamente. A continuación sera redireccionado a su webmail",
                    type: "success",
                    showCancelButton: false,
                    confirmButtonText: "Aceptar",
                    closeOnConfirm: true
                }, function () {
                    component.resetState();
                    window.location = data.redirect;
                });
            }, (component, error) => {
                component.resetState();
            });
        } else {
            swal("Error", "Las contraseñas ingresadas no coinciden", "error");
        }
    }

    resetState() {
        this.setState({
            step: 1,
            email: null,
            secondaryEmail: null,
            phone: null,
            recieverType: null
        })
    }

    getReciever(type) {
        switch (type) {
            case "email":
                return this.state.secondaryEmail;
                break;
            case "sms":
                return this.state.phone;
                break;
            case "twitter":
                return this.state.twitter;
                break;
            default:
                return null;
        }
    }

    getRecieverType(state) {
        if (state.secondaryEmail !== null) {
            return 'email';
        }

        if (state.twitter !== null) {
            return 'twitter';
        }

        if (state.phone !== null) {
            return 'sms';
        }

        return null;
    }

    getCurrentStep() {
        switch (this.state.step) {
            case 1:
                return (
                    <Step1 nextStep={this.toStep2} wait={this.state.wait} onChange={this.updateFromInput}
                           disabled={this.state.disabled} ajaxInProgress={this.state.ajaxInProgress}/>
                );
                break;
            case 2:
                return (
                    <Step2 email={this.state.email} secondaryEmail={this.state.secondaryEmail} name={this.state.name}
                           phone={this.state.phone} twitter={this.state.twitter} nextStep={this.toStep3}
                           ajaxInProgress={this.state.ajaxInProgress}/>
                );
                break;
            case 3:
                return (
                    <Step3 email={this.state.email} name={this.state.name}
                           reciever={this.getReciever(this.state.recieverType)}
                           onChange={this.updateFromInput} ajaxInProgress={this.state.ajaxInProgress}
                           nextStep={this.toStep4}/>
                );
                break;
            case 4:
                return (
                    <Step4 email={this.state.email} nextStep={this.finish} onChange={this.updateFromInput}
                           ajaxInProgress={this.state.ajaxInProgress} name={this.state.name}/>
                );
                break;
        }
    }

    render() {
        let cmp = this.getCurrentStep();
        return (
            cmp
        );
    }
}
