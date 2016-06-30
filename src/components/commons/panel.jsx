import React from 'react';
import Button from './button.jsx';

export default class Panel extends React.Component {
    render() {
        let btns = null;

        if (this.props.btnsHeader) {
            btns = this.props.btnsHeader.map((btn, i) => {
                if (btn.setComponent) {
                    return btn.setComponent;
                }
                return (
                    <Button
                        btnAttrs={btn.props}
                        key={`button-${i}`}
                    >
                        {btn.label}
                    </Button>
                );
            });
        }

        let panelHeader;
        if (this.props.hasHeader && (this.props.btnsHeader || this.props.title || this.props.filter)) {
            panelHeader = (
                <div className='panel-heading hbuilt clearfix'>
                    <div className='pull-right'>{btns}</div>
                    <div className='heading-buttons pull-left'>
                        {this.props.title || this.props.filter}
                    </div>
                </div>
            );
        }

        return (
            <div className={'hpanel ' + this.props.classHeader}>
                {panelHeader}
                {this.props.error}
                <div className='panel-body'>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

Panel.propTypes = {
    hasHeader: React.PropTypes.bool,
    btnsHeader: React.PropTypes.array,
    title: React.PropTypes.string,
    classHeader: React.PropTypes.string,
    error: React.PropTypes.element,
    children: React.PropTypes.any,
    filter: React.PropTypes.element
};

Panel.defaultProps = {
    hasHeader: true,
    btnsHeader: [],
    title: '',
    error: null,
    classHeader: ''
};
