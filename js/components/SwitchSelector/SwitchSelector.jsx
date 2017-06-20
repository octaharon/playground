require('./SwitchSelector.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';
import PropTypes from 'prop-types';
import _ from 'underscore';
import d3 from '../../d3-lib';

import Utils from '../../utils';

let propTypes =
    {
        options: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.number),
            PropTypes.arrayOf(PropTypes.string)
        ]).isRequired,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        onChange: PropTypes.func.isRequired
    };

class SwitchSelector extends React.Component {

    constructor(props) {
        super(props);
        if (!props.options.length)
            throw 'Empty values array';
        this.state = {
            value: props.value
        };
    }

    componentDidUpdate() {

    }

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return !Utils.compareObjectProps(this.props, nextProps);
    }

    render() {
        return (
            <div className="switch-selector">
                <div className="switch-selector__left"></div>
                <div className="switch-selector__container">
                    <div className="switch-selector__body-item">

                    </div>
                </div>
                <div className="switch-selector__right"></div>
            </div>
        )
    }

}

SwitchSelector.propTypes = propTypes;

export default SwitchSelector;