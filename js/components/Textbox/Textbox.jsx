require('./Textbox.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';
import PropTypes from '../../utilities/proptypes-extend';
import _ from '../../utilities/underscore-extend';
import d3 from '../../d3-lib';
import * as d3_live from 'd3-selection';

import Utils from '../../utils';
let propTypes =
    {
        onEnter: PropTypes.func,
        eventHandlers: PropTypes.objectOf(PropTypes.func),
        allowPaste: PropTypes.bool,
        placeholder: PropTypes.literal,
        maxLength: PropTypes.number,
        valueMask: PropTypes.string,
        valueMaskPlaceholder: PropTypes.char,
        symbolFilter: PropTypes.instanceOf(RegExp),
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    };

const defaultProps = {
    valueMaskPlaceholder: '_',
    symbolFilter: /[a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]/i, //only printable characters by default
};

class Textbox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            handlers: {},
            focus: false
        };
        [
            '_onChange',
            '_onBlur',
            '_onFocus',
            '_onKeyDown',
            '_proxyEvent',
            '_filterValue',
            '_setHandlers'
        ].forEach(method => this[method] = this[method].bind(this));
    }

    componentWillReceiveProps(nextProps) {
        this._setHandlers(nextProps);
    }

    componentWillMount() {
        this._setHandlers(this.props);
    }

    componentDidMount() {
        this.__container = ReactDOM.findDOMNode(this);
    }

    componentWillUnmount() {
        for (eventName of Object.keys(this.state.handlers)) {
            delete this.state.handlers[eventName];
        }
        delete this['__container'];
    }

    _setHandlers(props) {
        let handlers = {
            onChange: this._onChange,
            onKeyDown: this._onKeyDown,
            onFocus: this._onFocus,
            onBlur: this._onBlur
        };
        let propHandlers = {};
        if (props.eventHandlers && !_.isEmpty(props.eventHandlers))
            propHandlers = props.eventHandlers;
        _.each(_.omit(propHandlers, Object.keys(handlers)),
            (eventCallback, eventName) => handlers[eventName] = this._proxyEvent.bind(this, eventName, eventCallback));
        this.setState({handlers});
    }

    _filterValue(value) {
        return value;
    }

    _proxyEvent(eventName, callback = null, event) {
        if (callback === null && _.isObject(this.props.eventHandlers) && this.props.eventHandlers[eventName])
            callback = this.props.eventHandlers[eventName];
        if (_.isFunction(callback))
            if (false === callback(Object.assign(event.nativeEvent, {
                    component: this,
                    value: this.state.value
                }))) {
                event.preventDefault();
                return false;
            }
    }


    _onChange(e) {
        e.persist();
        let value = this._filterValue(e.target.value);
        if (_.isFunction(this.state.handlers.onChange))
            this.setState({value}, () => this._proxyEvent('onChange', null, e));
        else
            this.setState({value});

    }

    _onBlur(e) {
        e.persist();
        this.setState({
            focus: false
        }, () => this._proxyEvent('onBlur', null, e));
    }

    _onFocus(e) {
        e.persist();
        this.setState({
            focus: true
        }, () => this._proxyEvent('onFocus', null, e));
    }

    _onKeyDown(e) {
        console.log('event.keyCode: ', e.keyCode);
        console.log('event.which: ', e.which);
        console.log('event.key: ', e.key);
        console.log('event.code: ', e.code);
        return this._proxyEvent('onKeyDown', null, e)
    }

    render() {
        return (
            <div className={this.state.focus ? 'focus textbox' : 'textbox'}>
                <span className="textbox-placeholder" style={
                    {
                        opacity: !this.state.focus && !this.state.value.length ? 1 : 0
                    }
                }>
                    {this.props.placeholder}
                </span>
                <input className="textbox-value"
                       type="text"
                       value={this.state.value}
                       {...this.state.handlers}
                />
            </div>
        );
    }
}


Textbox.propTypes = /* remove-proptypes */ propTypes;
Textbox.defaultProps = defaultProps;

export default Textbox;

