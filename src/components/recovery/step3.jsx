import React from 'react';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';
import * as Utils from '../../utils/utils.jsx';

export default class TokenInputForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleNext = this.handleNext.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.protectReciever = this.protectReciever.bind(this);
    }

    protectReciever(data) {
        if (data.toString().indexOf('@') > 0) {
            return Utils.protectEmail(data);
        } else {
            return Utils.protectPhone(data);
        }
    }

    handleChange(event) {
        this.setState({value: event.target.value});

        this.props.onChange({token: event.target.value});
    }

    handleNext(e) {
        if (this.props.ajaxInProgress) {
            e.preventDefault();
            return;
        }
        
        this.props.nextStep();
    }

    render() {
        return (
            <Panel hasHeader={true} title={this.props.email}>
                <form method="post" className="form-horizontal">
                    <p className="text-center">Ingresa el código que hemos enviado
                        a {this.protectReciever(this.props.reciever)}</p>
                    <div className="form-group">
                        <div className="col-sm-12 text-center">
                            <input className="token-digit" type="text"
                                   onChange={this.handleChange}/>{/*<i className="fa fa-minus"/>*/}
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

TokenInputForm.propTypes = {
    phone: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    email: function (props, propName, componentName) {
        if (!Utils.isValidEmail(props[propName])) {
            return new Error(
                'Invalid prop `' + propName + '` supplied to' +
                ' `' + componentName + '`. Validation failed.'
            );
        }
    }
};


