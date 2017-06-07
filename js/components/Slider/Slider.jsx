require('./Slider.scss');


import React from 'react';
import PropTypes from 'prop-types';
import d3 from '../../d3-lib';
import * as d3_live from 'd3-selection';
import _ from 'underscore';

import Utils from '../../utils';

const propTypes = {
    id: PropTypes.string.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number,
    sliderOffset: PropTypes.number,
    ticks: PropTypes.number,
    tickSuffix: PropTypes.string,
    tickOffset: PropTypes.number,
    tickSize: PropTypes.number,
    handleRadius: PropTypes.number,
    size: PropTypes.number,
    captionsOffset: PropTypes.number,
    step: PropTypes.number,
    onChange: PropTypes.func
};

class Slider extends React.Component {
    constructor(props) {
        super(props);
        this.widthConstant = 1000;
        if (this.props.max <= this.props.min)
            throw '"Max" value for Slider Control must be greater than "Min" value';
        this.state = {
            value: props.value || props.min
        };
        this.redraw = this.redraw.bind(this);
    }

    componentDidMount() {
        this.container = d3.select(`.slider-control#${this.props.id}`);
        this.redraw();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (nextProps != this.props);
    }

    componentDidUpdate(prevProps, prevState) {
        this.redraw();
    }

    getGradientId() {
        return `slider-track-fill-${this.props.id}`;
    }

    getGlowFilterId() {
        return `slider-handle-glow-${this.props.id}`;
    }

    getTickId() {
        return `slider-tick-${this.props.id}`;
    }

    //this method is redefined within this.redraw
    interpolateValue(value) {
        return value;
    }

    interpolateColor(value) {
        return d3.interpolateCool(parseFloat(value) || 0);
    }

    updateView(value) {
        let percent = this.interpolateValue(value);
        let color = this.interpolateColor(percent / 100);
        this.handle.attr("cx", `${percent}%`).attr('fill', color);
        this.container.select('.track-select').attr('x2', `${percent}%`);
        if (this.props.onChange instanceof Function)
            this.props.onChange(value);
    }


    updateValue(value) {
        value = parseFloat(value);
        if (this.props.step)
            value = Math.max(this.props.min, Math.min(this.props.max, Utils.closestFraction(value - this.props.step / 10, this.props.step)));

        this.setState({value}, this.updateView(value));

    }

    redraw() {
        let _self = this;
        let height = Math.round(_self.props.size);
        let svg = _self.container.select("svg")
                       .attr('height', height);
        let gradientInterpolationDensity = 10;

        let cloneMe = function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        };

        _self.interpolateValue = d3.scaleLinear()
                                   .domain([_self.props.min, _self.props.max])
                                   .range([0, 100])
                                   .clamp(true);


        svg.selectAll('g').remove();

        let slider = svg.append("g")
                        .attr("class", "slider")
                        .attr("transform", `translate(0, ${_self.props.sliderOffset * _self.props.size})`);

        let ticks = _.uniq(_self.interpolateValue.ticks(Math.max(2, _self.props.ticks))
                                .concat(_self.interpolateValue.domain()));


        let colorStops = svg.select('defs')
                            .select(`linearGradient#${this.getGradientId()}`)
                            .selectAll('stop')
                            .data(_.range(0, gradientInterpolationDensity));
        colorStops.enter()
                  .append('stop')
                  .merge(colorStops)
                  .attr('offset', d => `${Math.round(d / gradientInterpolationDensity * 100)}%`)
                  .attr('stop-color', d => _self.interpolateColor(d / gradientInterpolationDensity));

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
                      .on("start.interrupt", function () {
                          slider.interrupt();
                      })
                      .on("start drag", function () {
                          let x = d3_live.event.x / svg.select('.slider').node().getBBox().width;
                          _self.updateValue(_self.interpolateValue.invert(x * 100));
                      }));

        slider.select('line.track-select').attr("stroke", `url(#${this.getGradientId()})`);

        let tickLines = svg.append("g")
                           .attr("class", "tickLines")
                           .attr("transform", `translate(0,${_self.props.tickOffset * _self.props.size})`)
                           .selectAll("use")
                           .data(ticks);

        tickLines.enter().append("use").attr('class', 'tick').merge(tickLines)
                 .attr('x', d => _self.interpolateValue(d) + '%')
                 .attr('href', `#${this.getTickId()}`);

        let tickCaptions = svg.append("g")
                              .attr("class", "tickCaptions")
                              .attr("transform", `translate(0,${_self.props.captionsOffset * _self.props.size})`)
                              .selectAll("text")
                              .data(ticks);
        tickCaptions.enter().append('text').merge(tickCaptions)
                    .attr("x", d => (_self.interpolateValue(d) + '%'))
                    .attr("text-anchor", "middle")
                    .text(d => `${d}${_self.props.tickSuffix}`)
                    .on('click', d => this.updateValue(d));


        _self.handle = slider.insert("circle", ".track-overlay")
                             .attr("class", "handle")
                             .attr("r", _self.props.handleRadius)
                             .style('filter', `url('#${this.getGlowFilterId()}`);

        _self.updateValue(_self.props.value);

    }

    render() {
        return (
            <div className="slider-control" id={this.props.id}>
                <svg width="100%" height={this.props.size} preserveAspectRatio="xMidYMid meet">
                    <filter id={this.getGlowFilterId()} x="-200%" y="-200%" width="400%" height="400%">
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
                            id={this.getGradientId()}/>
                        <line className="tick" x1="0" x2="0" y1="0" y2={this.props.tickSize} id={this.getTickId()}/>
                    </defs>
                </svg>
            </div>
        );
    }
}

Slider.propTypes = propTypes;
Slider.defaultProps = {
    min: 0,
    max: 100,
    value: 0,
    size: 45,
    sliderOffset: 0.25,
    tickOffset: 0.42,
    tickSize: 5,
    captionsOffset: 0.85,
    handleRadius: 7,
    ticks: 10,
    tickSuffix: '',
};

export default Slider;