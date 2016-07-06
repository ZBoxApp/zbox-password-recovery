"use strict";

import React from 'react';

export default class Button extends React.Component {
    render() {
        return (
            <a {...this.props.btnAttrs}>{this.props.children}</a>
        );
    }
}

Button.propTypes = {
    btnAttrs: React.PropTypes.object,
    children: React.PropTypes.any
};

Button.defaultProps = {};
