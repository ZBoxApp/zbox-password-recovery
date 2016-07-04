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
                step: 3,
                email: this.props.location.query.e,
                secondaryEmail: this.props.location.query.se,
                phone: this.props.location.query.p
            };
        } else {
            this.state = {
                step: 1
            };
        }

        this.updateFromInput = this.updateFromInput.bind(this)
        this.getCurrentStep = this.getCurrentStep.bind(this);
        this.toStep2 = this.toStep2.bind(this);
        this.toStep3 = this.toStep3.bind(this);
        this.toStep4 = this.toStep4.bind(this);
        this.finish = this.finish.bind(this);
    }

    hasValidParameters(query) {
        if (query.s == 3 && query.e && query.e.length > 0 && ((query.p && query.p.length > 0) || (query.se && query.se.length > 0))) {
            //Validar si existe token para los parametros obtenidos de al URL
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

    toStep2() {
        let email = this.state.email;
        let that = this;

        if (Utils.isValidEmail(email)) {
            ajax.post('/parse/functions/startReset')
                .set('X-Parse-Application-Id', 'app1')
                .set('Content-Type', 'application/json')
                .send({email: email})
                .set('Accept', 'application/json')
                .end(function (error, response) {
                    if (error || !response.ok || (response.hasOwnProperty('body') && response.body.hasOwnProperty('error'))) {
                        swal("Error...", response.body.error.description, "error");
                    } else {
                        let data = response.body;

                        let state = {
                            step: data.result.send ? 3 : 2,
                            email: data.result.email,
                            secondaryEmail: data.result.hasOwnProperty('secondaryEmail') ? data.result.secondaryEmail : null,
                            phone: data.result.hasOwnProperty('phone') ? data.result.phone : null
                        };

                        if (state.step === 3) {
                            state.toEmail = state.secondaryEmail !== null
                        }

                        that.setState(state);
                    }
                });
        } else {
            swal("Error...", "Debe ingresar un email válido", "error");
        }
    }

    toStep3(email) {
        let that = this;

        ajax.post('/parse/functions/sendToken')
            .set('X-Parse-Application-Id', 'app1')
            .set('Content-Type', 'application/json')
            .send({email: this.state.email})
            .send({type: email ? 'email' : 'sms'})
            .set('Accept', 'application/json')
            .end(function (error, response) {
                if (error || !response.ok || (response.hasOwnProperty('body') && response.body.hasOwnProperty('error'))) {
                    swal("Error...", response.body.error.description, "error");
                } else {
                    swal({
                        title: "Token envíado",
                        text: "Se ha enviado la información a su " + (email ? 'email' : 'sms'),
                        type: "success",
                        showCancelButton: false,
                        confirmButtonText: "Aceptar",
                        closeOnConfirm: true
                    }, function () {
                        that.setState({
                            step: 3,
                            toEmail: email
                        });
                    });
                }
            });
    }

    toStep4() {
        ajax.post('/parse/functions/validateToken')
            .set('X-Parse-Application-Id', 'app1')
            .set('Content-Type', 'application/json')
            .send({email: this.state.email})
            .send({token: this.state.token})
            .set('Accept', 'application/json')
            .end(function (error, response) {
                console.log(response.body);

                if (error || !response.ok || (response.hasOwnProperty('body') && response.body.hasOwnProperty('error'))) {
                    console.log('ERROR');
                    swal("Error...", response.body.error.description, "error");
                } else {
                    console.log('SUCCESS');

                    // Validar token
                    this.setState({
                        step: 4,
                        token: response.body.result.token
                    });
                }
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
                console.log('state', this.state);
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
