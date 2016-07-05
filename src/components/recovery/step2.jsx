import React from 'react';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class SendTokenForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSendEmail = this.handleSendEmail.bind(this);
        this.handleSendSMS = this.handleSendSMS.bind(this);
    }

    handleSendEmail() {
        this.props.nextStep(true);
    }

    handleSendSMS() {
        this.props.nextStep(false);
    }

    render() {
        return (
            <Panel hasHeader={true} title={this.props.email}>
                <form method="get" className="form-horizontal">
                    <p className="text-center">Selecciona un método para recibir un código de verificación y poder
                        cambiar tu contraseña</p>
                    <div className="form-group">
                        <div className="col-sm-12">
                            <Button
                                btnAttrs={{onClick: this.handleSendEmail, className: "btn btn-info btn-block", href: "#"}}>Enviar
                                correo a {Utils.protectEmail(this.props.secondaryEmail)}</Button>
                        </div>
                    </div>
                    <p className="text-center">o</p>
                    <div className="form-group">
                        <div className="col-sm-12">
                            <Button
                                btnAttrs={{onClick: this.handleSendSMS, className: "btn btn-info btn-block", href: "#"}}>Enviar
                                SMS a {Utils.protectPhone(this.props.phone)}</Button>
                        </div>
                    </div>
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

