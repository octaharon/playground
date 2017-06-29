require('./Slider.scss');


import React from 'react';
import PropTypes from 'prop-types';
import d3 from '../../d3-lib';
import * as d3_live from 'd3-selection';
import _ from 'underscore';

import Utils from '../../utils';

const colorSchemes = {
    'warm': x => d3.interpolateWarm(x),
    'cool': x => d3.interpolateCool(x),
    'warm-inverse': x => d3.interpolateWarm(1 - x),
    'cool-inverse': x => d3.interpolateCool(1 - x)
};

const propTypes = {
    id: PropTypes.string.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number,
    vertical: PropTypes.bool,
    size: PropTypes.number,
    colorScheme: PropTypes.oneOf(Object.keys(colorSchemes)),
    sliderOffset: PropTypes.number,
    ticks: PropTypes.number,
    tickSuffix: PropTypes.string,
    tickOffset: PropTypes.number,
    tickSize: PropTypes.number,
    tickFormat: PropTypes.string,
    handleRadius: PropTypes.number,
    captionsOffset: PropTypes.number,
    step: PropTypes.number,
    onChange: PropTypes.func
};

class Slider extends React.Component {
    constructor(props) {
        super(props);
        if (this.props.max <= this.props.min)
            throw '"Max" value for Slider Control must be greater than "Min" value';
        this.state = {
            value: _.isNumber(props.value) ? props.value : props.min
        };
        this._redraw = this._redraw.bind(this);
        this._interpolateColor = this._interpolateColor.bind(this);
    }

    componentDidMount() {
        this.__container = d3.select(`.slider-control#${this.props.id}`);
        this._redraw();
    }

    shouldComponentUpdate(nextProps, nextState) {
        let props = Object.assign({}, nextProps);
        let value = props.value;
        if (_.isNumber(value)) {
            delete props['value'];
            if (value != this.state.value) {
                this._updateValue(value, true);
            }
        }
        let a = true;
        return !Utils.compareObjectProps(this.props, props);
    }

    componentDidUpdate(prevProps, prevState) {
        this._redraw();
    }

    componentWillUnmount() {
        this.__container.remove();
        delete this.__container;
    }

    getValue() {
        return this.state.value;
    }

    _getGradientId() {
        return `slider-track-fill-${this.props.id}`;
    }

    _getGlowFilterId() {
        return `slider-handle-glow-${this.props.id}`;
    }

    _getTickId() {
        return `slider-tick-${this.props.id}`;
    }

    //this method is redefined within this._redraw
    _interpolateValue(value) {
        return value;
    }

    _interpolateColor(value) {
        value = parseFloat(value) || 0;
        value = Utils.fitInRange(value, 0, 1);
        if (_.isFunction(colorSchemes[this.props.colorScheme]))
            return colorSchemes[this.props.colorScheme](value);
        return d3.interpolateCool(value);
    }

    _updateView(value) {
        requestAnimationFrame(function () {
            let percent = this._interpolateValue(value);
            let color = this._interpolateColor(percent / 100);
            this.handle.attr("cx", `${percent}%`).attr('fill', color);
            this.__container.select('.track-select').attr('x2', `${percent}%`);
        }.bind(this));
    }


    _updateValue(value, force = false) {
        let epsilon = (this.props.max - this.props.min) * 10e-4;
        value = parseFloat(value);
        if (this.props.step)
            value = Math.max(this.props.min, Math.min(this.props.max, this.props.min + Utils.closestFraction(value - this.props.min - epsilon, this.props.step)));
        if (force)
            this.setState({value}, this._updateView(value));
        else if (Math.abs(value - this.state.value) > epsilon) {
            if (_.isFunction(this.props.onChange))
                this.props.onChange(value);
            this.setState({value}, this._updateView(value));
        }

    }

    _redraw() {
        let _self = this;
        let height = Math.round(_self.props.size);
        let svg = _self.__container.select("svg")
                       .attr('height', height);
        let gradientInterpolationDensity = 10;


        /**Cleaning memory**/
        svg.select('.track-overlay').on('.drag', null);
        svg.selectAll('g').remove();
        delete _self['_interpolateValue'];


        let cloneMe = function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        };

        _self._interpolateValue = d3.scaleLinear()
                                    .domain([_self.props.min, _self.props.max])
                                    .range([0, 100])
                                    .clamp(true);


        let slider = svg.append("g")
                        .attr("class", "slider")
                        .attr("transform", `translate(0, ${_self.props.sliderOffset * _self.props.size})`);

        let tickCount = Math.max(0, _self.props.ticks);
        let ticks = _.uniq(_self._interpolateValue.ticks(tickCount)
                                .concat(_self._interpolateValue.domain()));
        ticks = ticks.map(_self._interpolateValue.tickFormat(ticks.length, this.props.tickFormat));


        let colorStops = svg.select('defs')
                            .select(`linearGradient#${this._getGradientId()}`)
                            .selectAll('stop')
                            .data(_.range(0, gradientInterpolationDensity));
        colorStops.enter()
                  .append('stop')
                  .merge(colorStops)
                  .attr('offset', d => `${Math.round(d / gradientInterpolationDensity * 100)}%`)
                  .attr('stop-color', d => _self._interpolateColor(d / gradientInterpolationDensity));

        slider.append("line")
              .attr("class", "track")
              .attr("x1", 0)
              .attr("x2", '100%')
              .select(cloneMe)
              .attr("class", "track-inset")
              .select(cloneMe)
              .attr("class", "track-select")
              .select(cloneMe)
              .attr("class", "track-overlay")
              .call(d3.drag()
                      .on("start drag", function () {
                          let x = d3_live.event.x / svg.select('.slider').node().getBBox().width;
                          d3_live.event.sourceEvent.stopPropagation();
                          d3_live.event.sourceEvent.preventDefault();
                          _self._updateValue(_self._interpolateValue.invert(x * 100));
                      }));

        slider.select('line.track-select').attr("stroke", `url(#${this._getGradientId()})`);

        let tickLines = svg.append("g")
                           .attr("class", "tickLines")
                           .attr("transform", `translate(0,${_self.props.tickOffset * _self.props.size})`)
                           .selectAll("use")
                           .data(ticks);

        tickLines.enter().append("use").attr('class', 'tick').merge(tickLines)
                 .attr('x', d => _self._interpolateValue(d) + '%')
                 .attr('href', `#${this._getTickId()}`);

        let tickCaptions = svg.append("g")
                              .attr("class", "tickCaptions")
                              .attr("transform", `translate(0,${_self.props.captionsOffset * _self.props.size})`)
                              .selectAll("text")
                              .data(ticks);
        tickCaptions.enter().append('text').merge(tickCaptions)
                    .attr("x", d => (_self._interpolateValue(d) + '%'))
                    .attr("text-anchor", "middle")
                    .text(d => `${d}${_self.props.tickSuffix}`)
                    .on('click', d => this._updateValue(d));


        _self.handle = slider.insert("circle", ".track-overlay")
                             .attr("class", "handle")
                             .attr("r", _self.props.handleRadius)
                             .style('filter', `url('#${this._getGlowFilterId()}`);

        let value = _.isNumber(_self.props.value) ? _self.props.value : _self.props.min;
        _self._updateValue(value, true);

    }

    render() {
        return (
            <div className="slider-control" id={this.props.id}>
                <svg width="100%" height={this.props.size} preserveAspectRatio="xMidYMid meet">
                    <filter id={this._getGlowFilterId()} x="-200%" y="-200%" width="400%" height="400%">
                        <feGaussianBlur result="blurOut" in="SourceGraphic" stdDeviation="2"/>
                        <feGaussianBlur result="blurOut2" in="SourceGraphic" stdDeviation="1"/>
                        <feSpecularLighting surfaceScale="2" specularConstant="1" specularExponent="35"
                                            lightingColor="#ffffff" in="blurOut" result="specular">
                            <feDistantLight azimuth="240" elevation="60"/>
                        </feSpecularLighting>
                        <feComposite operator="in" in="specular" in2="SourceAlpha" result="composite"/>
                        <feBlend in="SourceGraphic" in2="blurOut2" mode="normal" result="blurred"/>
                        <feBlend in2="composite" in="blurred" mode="screen"/>
                    </filter>
                    <defs>
                        <linearGradient
                            x1="0"
                            x2="100%"
                            y1="0"
                            y2="0"
                            gradientUnits="userSpaceOnUse"
                            id={this._getGradientId()}/>
                        <line className="tick" x1="0" x2="0" y1="0" y2={this.props.tickSize} id={this._getTickId()}/>
                    </defs>
                </svg>
            </div>
        );
    }
}

const defaultProps = {
    min: 0,
    max: 100,
    size: 45,
    vertical: true,
    sliderOffset: 0.25,
    tickOffset: 0.42,
    tickSize: 5,
    captionsOffset: 0.85,
    handleRadius: 7,
    ticks: 10,
    tickSuffix: '',
    tickFormat: null,
    colorScheme: 'cool-inverse'
};

const propSettings = {
    colorScheme: Object.keys(colorSchemes),
    size: [5, 150],
    min: [-50, 50],
    max: [50, 100],
    step: [0, 10, 0.1],
    sliderOffset: [0, 1],
    captionsOffset: [0, 1],
    handleRadius: [0, 15],
    tickOffset: [0, 1],
    tickSize: [0, 15],
    ticks: [0, 20, 1],
    tickFormat: [],
    tickSuffix: [],
    onChange: 'callback'
};

Slider.propTypes = propTypes;
Slider.defaultProps = defaultProps;

export {Slider as default, propSettings, defaultProps};