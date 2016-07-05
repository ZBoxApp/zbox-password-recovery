import React from 'react'
import ajax from 'superagent';
import swal from 'sweetalert';

import Step1 from './step1.jsx';
import Step2 from './step2.jsx';
import Step3 from './step3.jsx';
import Step4 from './step4.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class Root extends React.Component {
    constructor(props) {
        super(props);

        if (this.hasValidParameters(this.props.location.query)) {
            this.state = {
                step: 1,
                email: this.props.location.query.e,
                token: this.props.location.query.t
            };
            this.toStep4();
        } else {
            this.state = {
                step: 1
            };
        }

        this.ajaxCall = this.ajaxCall.bind(this);
        this.updateFromInput = this.updateFromInput.bind(this);
        this.getCurrentStep = this.getCurrentStep.bind(this);
        this.toStep2 = this.toStep2.bind(this);
        this.toStep3 = this.toStep3.bind(this);
        this.toStep4 = this.toStep4.bind(this);
        this.finish = this.finish.bind(this);
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
        ajax.post(url)
            .set('X-Parse-Application-Id', 'app1')
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(params)
            .end(function (error, response) {
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
                let state = {
                    step: data.send ? 3 : 2,
                    email: data.email,
                    secondaryEmail: data.hasOwnProperty('secondaryEmail') ? data.secondaryEmail : null,
                    phone: data.hasOwnProperty('phone') ? data.phone : null
                };

                if (state.step === 3) {
                    state.toEmail = state.secondaryEmail !== null
                }

                component.setState(state);
            });
        } else {
            swal("Error", "Debe ingresar un email válido", "error");
        }
    }

    toStep3(email) {
        let params = {
            email: this.state.email,
            type: email ? 'email' : 'sms'
        };

        this.ajaxCall(this, '/parse/functions/sendToken', params, (component, data)=> {
            swal({
                title: "Token envíado",
                text: "Se ha enviado la información a su " + (email ? 'email' : 'teléfono'),
                type: "success",
                showCancelButton: false,
                confirmButtonText: "Aceptar",
                closeOnConfirm: true
            }, function () {
                component.setState({
                    step: 3,
                    toEmail: email
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
        }, (component, error) => {
            component.setState({
                step: 1,
                email: null,
                secondaryEmail: null,
                phone: null,
                toEmail: null
            })
        });
    }

    finish(pass1, pass2) {
        if (pass1 === pass2) {
            // redireccionar a algun lado
            swal("Exito...", "Su password ha sido reestablecido exitosamente", "success");
        } else {
            swal("Error...", "Las contraseñas ingresadas no coinciden", "error");
        }
    }

    getCurrentStep() {
        switch (this.state.step) {
            case 1:
                return (
                    <Step1 nextStep={this.toStep2} onChange={this.updateFromInput}/>
                );
                break;
            case 2:
                return (
                    <Step2 email={this.state.email} secondaryEmail={this.state.secondaryEmail}
                           phone={this.state.phone} nextStep={this.toStep3}/>
                );
                break;
            case 3:
                return (
                    <Step3 email={this.state.email}
                           reciever={this.state.toEmail ? this.state.secondaryEmail : this.state.phone}
                           onChange={this.updateFromInput}
                           nextStep={this.toStep4}/>
                );
                break;
            case 4:
                return (
                    <Step4 email={this.state.email} nextStep={this.finish}/>
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
