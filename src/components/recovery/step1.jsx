import React from 'react';

import Button from '../commons/button.jsx';
import Panel from '../commons/panel.jsx';

export default class RequestForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {value: ''};

        this.handleNext = this.handleNext.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});

        this.props.onChange({email: event.target.value});
    }

    handleNext() {
        this.props.nextStep();
    }

    render() {
        return (
            <Panel hasHeader={true} title={'¿No recuerdas tu contraseña?'}>
                <form method="get" className="form-horizontal">
                    <p className="text-center">Ingresa tu email para comenzar</p>
                    <p className="text-center">Este es el lugar indicado para restablecer una contraseña olvidada, o
                        desbloquear tu cuenta</p>
                    <div className="form-group">
                        <div className="col-sm-12">
                            <input type="email" required className="form-control" value={this.state.value}
                                   onChange={this.handleChange}/>
                        </div>
                    </div>
                    <div className="form-group text-center">
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

