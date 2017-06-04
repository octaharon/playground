require('./MoireRoom.scss');

import React from 'react';
import d3 from '../../d3-lib';
import _ from 'underscore';
import Timer from '../../services/TimerService';
import PropTypes from 'prop-types';


const propTypes = {
    fgColor: PropTypes.string,
    step: PropTypes.number,
    thickness: PropTypes.number,
    delay: PropTypes.number,
    rotateSpeed: PropTypes.number,
    hueOffset: PropTypes.number
};


class MoireRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hueOffset: props.hueOffset,
            sectorCount: 45
        };
        this.drawForeground = this.drawForeground.bind(this);
        this.drawBackground = this.drawBackground.bind(this);
        this.setDimensions = this.setDimensions.bind(this);
        this.rotatePalette = this.rotatePalette.bind(this);
    }

    setDimensions() {
        let container = d3.select('#moire-room');
        let dimensions = container.node().getBoundingClientRect();
        let cx = Math.ceil(dimensions.width / 2);
        let cy = Math.ceil(dimensions.height / 2);
        this.container = container;
        this.cx = cx;
        this.cy = cy;
    }

    closestFraction(largerThan, dividesBy) {
        let epsilon = 0.0001;
        let division = largerThan / dividesBy;
        let modulo = division - Math.floor(division);
        if (modulo < epsilon)
            return Math.round(Math.ceil(largerThan + dividesBy) / epsilon) * epsilon;
        return Math.round(Math.ceil(division) * dividesBy / epsilon) * epsilon;
    }


    componentDidMount() {
        this.setDimensions();
        let cx = this.cx;
        let cy = this.cy;
        let boundingBox = `${-cx} ${-cy} ${cx * 2} ${cy * 2}`;

        let initSvg = svg => svg.attr('opacity', 0)
                                .attr('width', 2 * cx)
                                .attr('height', 2 * cy)
                                .attr('viewBox', boundingBox)
                                .attr('preserveAspectRatio', 'xMidYMid slice');

        let foreground = this.container.select('svg.fg');
        if (!foreground.node())
            foreground = initSvg(this.container.append('svg').attr('class', 'fg'));

        this.foreground = foreground;

        let background = this.container.select('svg.bg');
        if (!background.node())
            background = initSvg(this.container.append('svg').attr('class', 'bg'));

        this.background = background;

        this.drawBackground();
        this.drawForeground();
        this.fadeIn();
        this.timer = Timer.set(this.rotateColors.bind(this), 50);
        //d3.select('body').on('click', (event) => Timer.clear(this.timer));

    }

    fitInBoundaries(value, min, max) {
        return (value < min) ? min : ((value > max) ? max : value);
    }

    rotateColors() {
        this.setState({hueOffset: this.state.hueOffset - this.props.rotateSpeed}, this.rotatePalette);
    }

    fadeIn() {
        this.container.select('svg.fg').transition().attr('opacity', 1).duration(this.props.delay / 2);
        this.container.select('svg.bg').transition().attr('opacity', 1).duration(this.props.delay);
    }

    drawPalette(radius = this.cy) {
        let sectorCount = this.state.sectorCount;
        let angleStep = Math.PI * 2 / sectorCount;
        let r = this.cx / 2;

        let startAngle = (i) => i * angleStep - Math.PI / 2;
        let endAngle = (i) => i * angleStep - Math.PI / 2 + angleStep;

        let defs = this.background.select('defs');
        defs.selectAll('*').remove();
        defs.selectAll('linearGradient').data(_.range(0, sectorCount)).enter().append("linearGradient")
            .attr("id", (i) => `svgGradient${i}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", (i) => this.fitInBoundaries(r * Math.cos(startAngle(i)), -this.cx, this.cx))
            .attr("x2", (i) => this.fitInBoundaries(r * Math.cos(endAngle(i)), -this.cx, this.cx))
            .attr("y1", (i) => this.fitInBoundaries(r * Math.sin(startAngle(i)), -this.cy, this.cy))
            .attr("y2", (i) => this.fitInBoundaries(r * Math.sin(endAngle(i)), -this.cy, this.cy))
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

        this.setPalette();
    }


    setPalette() {

        let hueOffset = this.state.hueOffset;
        let defs = this.background.select('defs');
        let setColor = (el, index) => el.attr(
            'stop-color',
            d3.hsl((index * 360 / this.state.sectorCount + Math.floor(hueOffset)) % 360 + hueOffset - Math.floor(hueOffset), 1, 0.5)
              .toString()
        );
        defs.selectAll('stop.start')
            .each(function (datum, i) {
                setColor(d3.select(this), i);
            });
        defs.selectAll('stop.end')
            .each(function (datum, i) {
                setColor(d3.select(this), i + 1);
            });
    }

    rotatePalette() {
        this.background.select('g.rotate').attr('transform', `rotate(${this.state.hueOffset})`);
    }

    drawBackground() {

        let bg = this.background;

        bg.selectAll('*').remove();

        let radius = Math.sqrt(this.cx * this.cx + this.cy * this.cy);
        let sectorCount = this.state.sectorCount;
        let angleStep = Math.PI * 2 / sectorCount;
        let sectors = _.range(0, sectorCount, 1);
        let arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 1.5)
                    .startAngle(d => d * angleStep)
                    .endAngle(d => (d + 1) * angleStep + Math.PI / 360);

        bg.append("defs");

        this.drawPalette(radius);

        let fill = d => `url(#svgGradient${d})`;
        bg = bg.append("g")
               .attr('transform', `scale(1, ${Math.round(this.cy / this.cx * 100) / 100})`)
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

    drawForeground() {
        let fgColor = d3.rgb(0, 0, 0);
        if (this.props.fgColor)
            fgColor = d3.color(this.props.fgColor);
        let step = this.props.step;
        let thickness = this.props.thickness;
        let cx = this.closestFraction(this.cx, step);
        let cy = this.closestFraction(this.cy, step);

        this.foreground.selectAll('*').remove();

        for (let i = -cx; i <= cx; i += step) {
            this.foreground.append("line")
                .attr("x1", -i)
                .attr("y1", -cy)
                .attr("x2", i)
                .attr("y2", cy)
                .attr("stroke-width", thickness)
                .attr("stroke", fgColor.toString());
        }

        for (let i = -cy; i <= cy; i += step) {
            this.foreground.append("line")
                .attr("x1", -cx)
                .attr("y1", -i)
                .attr("x2", cx)
                .attr("y2", i)
                .attr("stroke-width", thickness)
                .attr("stroke", fgColor.toString());
        }

        //this.foreground.remove();
        return true;
    }


    render() {
        return (
            <div id="moire-room">
            </div>
        );
    }
}

MoireRoom.propTypes = propTypes;
MoireRoom.defaultProps = {
    thickness: 1,
    step: 3,
    fgColor: '#000000',
    delay: 2000,
    rotateSpeed: 0.1,
    hueOffset: 0
};

export default MoireRoom;