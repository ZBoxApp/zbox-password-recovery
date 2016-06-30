import React from 'react';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class PasswordChangeForm extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            pass1: '',
            pass2: ''
        };
        
        this.handleNext = this.handleNext.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleNext() {
        this.props.nextStep(this.state.pass1, this.state.pass2);
    }

    handleChange(event) {
        this.setState({ [event.target.name] : event.target.value});
    }

    render() {
        return (
            <Panel hasHeader={true} title={this.props.email}>
                <form method="get" className="form-horizontal">
                    <p className="text-center">Ingresa tu nueva contraseña</p>
                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <input className="form-control" name="pass1" type="password" placeholder="Nueva contraseña"
                                   value={this.state.pass1} onChange={this.handleChange}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <input className="form-control" name="pass2" type="password" placeholder="Confirmación"
                                   value={this.state.pass2} onChange={this.handleChange}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-12">
                            <Button
                                btnAttrs={{onClick: this.handleNext, className: "btn btn-info btn-block", href: "#"}}>Continuar</Button>
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


