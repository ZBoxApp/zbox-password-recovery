"use strict";

import React from 'react';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class SendTokenForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSendEmail = this.handleSendEmail.bind(this);
        this.handleSendSMS = this.handleSendSMS.bind(this);
        this.handleSendTwitter = this.handleSendTwitter.bind(this);
    }

    handleSendEmail(e) {
        if (this.props.ajaxInProgress) {
            e.preventDefault();
            return;
        }

        this.props.nextStep('email');
    }

    handleSendSMS(e) {
        if (this.props.ajaxInProgress) {
            e.preventDefault();
            return;
        }

        this.props.nextStep('sms');
    }

    handleSendTwitter(e) {
        if (this.props.ajaxInProgress) {
            e.preventDefault();
            return;
        }

        this.props.nextStep('twitter');
    }

    render() {
        var buttons = [];

        if(this.props.secondaryEmail){
            buttons.push((
                <div className="form-group">
                    <div className="col-sm-12">
                <Button
                    btnAttrs={{onClick: this.handleSendEmail, className: "btn btn-info btn-block", href: "#", disabled: this.props.ajaxInProgress}}>Enviar
                    correo a {this.props.secondaryEmail}</Button>
                    </div>
                </div>
            ));
        }

        if(this.props.twitter){
            buttons.push((
                <div className="form-group">
                    <div className="col-sm-12">
                <Button
                    btnAttrs={{onClick: this.handleSendTwitter, className: "btn btn-info btn-block", href: "#", disabled: this.props.ajaxInProgress}}>Enviar
                    Mensaje Directo de Twitter a {this.props.twitter}</Button>
                    </div>
                </div>
            ))
        }

        if(this.props.phone){
            buttons.push((
                <div className="form-group">
                    <div className="col-sm-12">
                        <Button
                    btnAttrs={{onClick: this.handleSendSMS, className: "btn btn-info btn-block", href: "#", disabled: this.props.ajaxInProgress}}>Enviar
                    SMS a {this.props.phone}</Button>
                    </div>
                </div>
            ))
        }

        return (
            <Panel hasHeader={true} title={`Hola ${this.props.name} - ${this.props.email}`}>
                <form method="post" className="form-horizontal">
                    <p className="text-center">Selecciona un método para recibir un código de verificación y poder
                        cambiar tu contraseña</p>
                    {buttons}
                </form>
            </Panel>
        );
    }
}

SendTokenForm.propTypes = {
    phone: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    secondaryEmail: React.PropTypes.string,
    email: function (props, propName, componentName) {
        if (!Utils.isValidEmail(props[propName])) {
            return new Error(
                'Invalid prop `' + propName + '` supplied to' +
                ' `' + componentName + '`. Validation failed.'
            );
        }
    }
};

SendTokenForm.defaultProps = {
    name: 'Usuario'
};
