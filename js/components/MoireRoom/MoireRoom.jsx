require('./MoireRoom.scss');

import React from 'react';
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types';
import d3 from '../../d3-lib';
import _ from 'underscore';
import Utils from '../../utils';


const propTypes = {
    fgColor: PropTypes.string,
    step: PropTypes.number,
    thickness: PropTypes.number,
    delay: PropTypes.number,
    rotateSpeed: PropTypes.number, //radians per second
    hueOffset: PropTypes.number //degrees
};

const τ = Math.PI * 2;

class MoireRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rotation: -this.props.hueOffset * τ / 360,
            sectorCount: 45
        };
        for (let method of [
            '_drawForeground',
            '_drawBackground',
            '_setDimensions',
            '_rotatePalette',
            '_rotateColors',
            '_calculateAngleColor'
        ])
            this[method] = this[method].bind(this);
    }

    _getGradientId(suffix = '') {
        return `rainbowPartialGradient${suffix}`
    }

    _setDimensions() {
        let container = d3.select(ReactDOM.findDOMNode(this));
        let dimensions = container.node().getBoundingClientRect();
        let cx = Math.ceil(dimensions.width / 2);
        let cy = Math.ceil(dimensions.height / 2);
        this.__container = container;
        if (cx * cy == 0) {
            let dimensions = Utils.getMouseEventOffset();
            cx = dimensions.width / 2;
            cy = dimension.height / 2;
        }
        this.__cx = cx;
        this.__cy = cy;
    }


    _rotateColors(elapsed) {
        this.setState({
            rotation: this.props.rotateSpeed * elapsed / 1000 + this.props.hueOffset * τ / 360
        }, this._rotatePalette);
    }

    _fadeIn() {
        this.__container.select('svg.fg').transition().attr('opacity', 1).duration(this.props.delay / 2);
        this.__container.select('svg.bg').transition().attr('opacity', 1).duration(this.props.delay);
    }

    _drawPalette() {
        let sectorCount = this.state.sectorCount;
        let angleStep = τ / sectorCount;
        let r = Math.max(this.__cx, this.__cy) / 2;

        let startAngle = (i) => i * angleStep - τ / 4;
        let endAngle = (i) => i * angleStep - τ / 4 + angleStep;

        let defs = this.__background.select('defs');
        defs.selectAll('*').remove();
        defs.selectAll('linearGradient').data(_.range(0, sectorCount)).enter().append("linearGradient")
            .attr("id", (i) => this._getGradientId(i))
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", (i) => Utils.fitInRange(r * Math.cos(startAngle(i)), -this.__cx, this.__cx))
            .attr("x2", (i) => Utils.fitInRange(r * Math.cos(endAngle(i)), -this.__cx, this.__cx))
            .attr("y1", (i) => Utils.fitInRange(r * Math.sin(startAngle(i)), -this.__cy, this.__cy))
            .attr("y2", (i) => Utils.fitInRange(r * Math.sin(endAngle(i)), -this.__cy, this.__cy))
            .each(function () {
                let node = d3.select(this);
                node.append("stop")
                    .attr('class', 'start')
                    .attr("offset", "0%")
                    .attr("stop-opacity", 1);
                node.append("stop")
                    .attr('class', 'end')
                    .attr("offset", "100%")
                    .attr("stop-opacity", 1);
            });

        this._setPalette();
    }

    _calculateAngleColor(el, index) {
        let angle = index / this.state.sectorCount + this.state.rotation / τ;
        angle -= Math.floor(angle);
        el.attr(
            'stop-color',
            d3.interpolateRainbow(angle)
        );
    }


    _setPalette() {

        let _self = this;
        let defs = this.__background.select('defs');
        defs.selectAll('stop.start')
            .each(function (datum, i) {
                    _self._calculateAngleColor(d3.select(this), i);
                }
            );
        defs.selectAll('stop.end')
            .each(function (datum, i) {
                    _self._calculateAngleColor(d3.select(this), i + 1);
                }
            );
    }

    _rotatePalette() {
        let precision = 10e+2;
        let rotation = Math.round(precision * this.state.rotation / τ * 360) % (360 * precision) / precision;
        this.__background.select('g.rotate').attr('transform', `rotate(${rotation})`);
    }

    _drawBackground() {

        let bg = this.__background;

        bg.selectAll('*').remove();

        let radius = Math.sqrt(this.__cx * this.__cx + this.__cy * this.__cy);
        let sectorCount = this.state.sectorCount;
        let angleStep = τ / sectorCount;
        let sectors = _.range(0, sectorCount, 1);
        let arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 1.5)
                    .startAngle(d => d * angleStep)
                    .endAngle(d => (d + 1) * angleStep + Math.PI / 360);

        bg.append("defs");

        this._drawPalette(radius);

        let fill = d => `url(#${this._getGradientId(d)})`;
        bg = bg.append("g")
               .attr('transform', `scale(1, ${Math.round(this.__cy / this.__cx * 100) / 100})`)
               .append('g')
               .attr('class', 'rotate');
        bg.selectAll('path').data(sectors).enter().append('path')
          .attr('class', 'fillSector')
          .attr("d", arc)
          .attr("fill", fill)
          .attr("stroke-width", 0)
          .attr("stroke", "none")
          .attr('color-interpolation', 'linearRGB');
    }

    _drawForeground() {
        let fgColor = d3.rgb(0, 0, 0);
        if (this.props.fgColor)
            fgColor = d3.color(this.props.fgColor);
        let step = this.props.step;
        let thickness = this.props.thickness;
        let cx = Utils.closestFraction(this.__cx + step / 2, step);
        let cy = Utils.closestFraction(this.__cy + step / 2, step);

        this.__foreground.selectAll('*').remove();

        for (let i = -cx; i <= cx; i += step) {
            this.__foreground.append("line")
                .attr("x1", -i)
                .attr("y1", -cy)
                .attr("x2", i)
                .attr("y2", cy)
                .attr("stroke-width", thickness)
                .attr("stroke", fgColor.toString());
        }

        for (let i = -cy; i <= cy; i += step) {
            this.__foreground.append("line")
                .attr("x1", -cx)
                .attr("y1", -i)
                .attr("x2", cx)
                .attr("y2", i)
                .attr("stroke-width", thickness)
                .attr("stroke", fgColor.toString());
        }

        //this.__foreground.remove();
        return true;
    }

    componentDidMount() {
        this._setDimensions();
        let cx = this.__cx;
        let cy = this.__cy;
        let boundingBox = `${-cx} ${-cy} ${cx * 2} ${cy * 2}`;

        let initSvg = svg => svg.attr('opacity', 0)
                                .attr('width', 2 * cx)
                                .attr('height', 2 * cy)
                                .attr('viewBox', boundingBox)
                                .attr('preserveAspectRatio', 'xMidYMid slice');

        let foreground = this.__container.select('svg.fg');
        if (!foreground.node())
            foreground = initSvg(this.__container.append('svg').attr('class', 'fg'));

        this.__foreground = foreground;

        let background = this.__container.select('svg.bg');
        if (!background.node())
            background = initSvg(this.__container.append('svg').attr('class', 'bg'));

        this.__background = background;

        this._drawBackground();
        this._drawForeground();
        this._fadeIn();
        this.__timer = d3.timer(this._rotateColors);
        //d3.select('body').on('click', (event) => Timer.clear(this.timer));

    }

    render() {
        return (
            <div className="moire-room">
            </div>
        );
    }
}

const propSettings = {
    thickness: [0.1, 5],
    step: [0.5, 10],
    rotateSpeed: [-2, 2],
    hueOffset: [0, 360]
};

const defaultProps = {
    thickness: 1,
    step: 3,
    fgColor: '#000000',
    delay: 2000,
    rotateSpeed: -0.13,
    hueOffset: 0
};
MoireRoom.propTypes = propTypes;
MoireRoom.defaultProps = defaultProps;

export {MoireRoom as default, propSettings, defaultProps};
