import React from 'react';
import PasswordStrengthMeter from 'react-password-strength-meter';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class PasswordChangeForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pass1: '',
            password: ''
        };

        this.handleNext = this.handleNext.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleNext(e) {
        if (this.props.ajaxInProgress) {
            e.preventDefault();
            return;
        }

        this.props.nextStep(this.state.pass1, this.state.password);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});

        this.props.onChange({password: event.target.value});
    }

    render() {
        return (
            <Panel hasHeader={true} title={this.props.email}>
                <form method="post" className="form-horizontal" id="password-form">
                    <p className="text-center">Ingresa tu nueva contraseña</p>
                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <input className="form-control" name="pass1" type="password" value={this.state.pass1}
                                   onChange={this.handleChange}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <PasswordStrengthMeter className="form-control" name="password"
                                                   passwordText={"Confirme Contraseña"} hasLabel={true}
                                                   value={this.state.password} onChange={this.handleChange}/>

                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-12">
                            <Button
                                btnAttrs={{onClick: this.handleNext, className: "btn btn-info btn-block", href: "#", disabled: this.props.ajaxInProgress}}>Continuar</Button>
                        </div>
                    </div>
                </form>
            </Panel>
        );
    }
}

PasswordChangeForm.propTypes = {
    email: function (props, propName, componentName) {
        if (!Utils.isValidEmail(props[propName])) {
            return new Error(
                'Invalid prop `' + propName + '` supplied to' +
                ' `' + componentName + '`. Validation failed.'
            );
        }
    }
};


