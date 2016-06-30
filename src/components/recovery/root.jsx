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

    updateFromInput(email) {
        this.setState(email);
    }

    toStep2() {
        let email = this.state.email;
        let that = this;

        if (Utils.isValidEmail(email)) {
            ajax.post('/parse/functions/getAccount')
                .set('X-Parse-Application-Id', 'app1')
                .set('Content-Type', 'application/json')
                .send({email: email})
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err || !res.ok){
                        swal("Error...", res.body.error, "error");
                    } else {
                        that.setState({
                            step: 2,
                            email: res.body.result.email,
                            secondaryEmail: res.body.result.secondaryEmail,
                            phone: res.body.result.phone
                        });
                    }
                });
        } else {
            swal("Error...", "Debe ingresar un email válido", "error");
        }
    }

    toStep3(email) {
        if (email) {
            console.log("Enviar token por email");
        } else {
            console.log("Enviar token por SMS");
        }

        this.setState({
            step: 3
        });
    }

    toStep4() {
        // Validar token

        this.setState({
            step: 4
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
                    <Step3 email={this.state.email} reciever={this.state.phone || this.state.secondaryEmail}
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
