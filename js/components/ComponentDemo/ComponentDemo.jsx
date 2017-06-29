require('./ComponentDemo.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import update from 'immutability-helper';
import PropTypes from 'prop-types';
import _ from 'underscore';
import d3 from '../../d3-lib';

import Utils from '../../utils';

import Slider from '../Slider/Slider';
import CarouselSelector from '../CarouselSelector/CarouselSelector';
import GlassPane from '../GlassPane/GlassPane';

const supportedComponents = ['Rosette', 'Slider'];
const displayTemplates = ['GlassPane', 'Background', 'Empty'];
let propTypes = {
    component: PropTypes.oneOf(supportedComponents).isRequired,
    template: PropTypes.oneOf(displayTemplates)
};

class ComponentDemo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            componentProps: {},
            componentPropSettings: {},
            componentCallbacks: {},
            console: <p>This is console area, where component updates and callback will be logged</p>
        };
        [
            '_updateProperty',
            '_getId',
            '_getControlBlock',
            '_getModule'
        ].forEach(method => this[method] = this[method].bind(this));
    }

    _loadModule(moduleName) {
        console.log('loading module ' + moduleName);
        this.module = this._getModule(moduleName);
        let dProps = this.module.defaultProps;
        let callbacks = _.mapObject(this.module.propSettings, (settings, propName) => this._updateProperty.bind(this, propName));
        _.keysWhere(this.module.propSettings, v => v === 'callback').forEach(v => dProps[v] = callbacks[v]);
        this.setState({
            componentProps: dProps,
            componentPropSettings: this.module.propSettings,
            componentCallbacks: callbacks
        });
    }

    _updateProperty(propertyName, value) {
        delete this.state.console;
        let epsilon = 10e-6;
        if (_.isNumber(value))
            value = parseFloat((Math.round(value / epsilon) * epsilon).toPrecision(5));
        if (this.state.componentPropSettings[propertyName] === 'callback') {
            this.setState({
                console: <p>Callback <span>{propertyName}</span> called with value <span>{value}</span>
                </p>
            });
            return true;
        }
        if (this.state.componentProps[propertyName] != value)
            this.setState({
                console: <p>Set <span>{propertyName}</span> to <span>{value}</span></p>,
                componentProps: update(this.state.componentProps, {
                    [propertyName]: {
                        $set: value
                    }

                })
            });
    }

    _getModule(moduleName) {
        return require(`../${moduleName}/${moduleName}`);
    }

    _getId() {
        return this.__id || (this.__id = _.uniqueId('cmp-demo-'));
    }

    _getControlBlock(propName) {
        if (!this.state.componentPropSettings[propName])
            return '';
        let controlComponent,
            propSettings = this.state.componentPropSettings[propName],
            controlId = this._getId() + '-control-' + propName,
            defaultValue = null || this.state.componentProps[propName],
            displayValue = defaultValue;
        if (_.isNumber(defaultValue))
            displayValue = parseFloat((Math.round(defaultValue * 1000) / 1000).toPrecision(5));
        if (defaultValue === null)
            displayValue = 'NULL';
        switch (true) {
            case propSettings === 'callback':
                return null;
            case _.isArray(propSettings) && _.isNumber(propSettings[0]):
                if (propSettings.length > 2)
                    controlComponent = <Slider
                        id={controlId}
                        min={propSettings[0]}
                        max={propSettings[1]}
                        value={defaultValue}
                        ticks={Math.min(10, propSettings[1] - propSettings[0])}
                        step={propSettings[2]}
                        colorScheme="cool"
                        onChange={this.state.componentCallbacks[propName]}
                    />;
                else
                    controlComponent = <Slider
                        id={controlId}
                        min={propSettings[0]}
                        value={defaultValue}
                        max={propSettings[1]}
                        colorScheme="warm"
                        onChange={this.state.componentCallbacks[propName]}
                    />;
                break;
            case _.isArray(propSettings) && propSettings.length > 0:
                controlComponent = <CarouselSelector
                    options={propSettings}
                    value={defaultValue}
                    onChange={this.state.componentCallbacks[propName]}/>;
                break;
            case _.isArray(propSettings):
                controlComponent = <p>Text input</p>;
                break;
            case propSettings === true:
                //checkbox
                controlComponent = <p>Checkbox goes here</p>;
                break;
            case propSettings === 'color':
                //ColorPicker
                controlComponent = <p>ColorPicker</p>;
                break;
            default:
                return null;
        }
        return (
            <div className="component-demo__control-block" key={'component-' + propName}>
                <p className="caption">
                    <i className="fa fa-cogs"/>{`${this.props.component}.${propName} = `}<span>{displayValue}</span>
                </p>
                {controlComponent}
            </div>
        )
    }

    componentWillMount() {
        this._loadModule(this.props.component);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.component != this.props.component)
            this._loadModule(nextProps.component);
    }


    render() {

        const TestComponent = this.module['default'];
        let propControls = Object.keys(this.state.componentPropSettings)
                                 .map(this._getControlBlock)
                                 .filter(v => v !== null);
        return (
            <div className="component-demo">
                <div className="component-demo__component content-pane">
                    <GlassPane id={this._getId() + '-content'} hasTransition={true} bgBlurSource="#background">
                        <div className="component-demo__component-body" key="component-body">
                            <div className="component-demo__component-console">
                                {this.state.console}
                            </div>
                            <div className="component-demo__component-content">
                                <TestComponent id={this._getId() + '-component'} {...this.state.componentProps}/>
                            </div>
                        </div>
                        <div key="someOtherChild"></div>
                    </GlassPane>
                </div>
                <div className="component-demo__controls content-pane">
                    <GlassPane id={this._getId() + '-controls'} hasTransition={true} scroll={true}
                               bgBlurSource="#background">
                        <div className="component-demo__component-description" key="component-description">
                            <p className="heading">{this.props.component} component</p>
                            {this.props.children}
                        </div>
                        {propControls}
                    </GlassPane>
                </div>
            </div>
        )

    }
}

ComponentDemo.propTypes = propTypes;

export default ComponentDemo;