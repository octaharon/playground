require('../../sass/MoireRoom.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import d3 from '../d3-lib';
import _ from 'underscore';
import Timer from '../services/TimerService';

const fadeInDuration = 500;

class MoireRoom extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hueOffset: 0
        };
        this.drawForeground = this.drawForeground.bind(this);
        this.drawBackground = this.drawBackground.bind(this);
        this.setDimensions = this.setDimensions.bind(this);
    }

    setDimensions() {
        let container = d3.select('#moire-room');
        let dimensions = container.node().getBoundingClientRect();
        let cx = Math.round(dimensions.width / 2);
        let cy = Math.round(dimensions.height / 2);
        this.container = container;
        this.cx = cx;
        this.cy = cy;
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
        Timer.set(this.rotateColors.bind(this), 40);
    }

    fitInBoundaries(value, min, max) {
        return (value < min) ? min : ((value > max) ? max : value);
    }

    rotateColors() {
        this.setState({hueOffset: this.state.hueOffset + 1}, this.drawBackground);
    }

    fadeIn() {
        this.container.selectAll('svg').transition().attr('opacity', 1).duration(fadeInDuration);
    }

    drawBackground() {

        let bg = this.background;
        bg.selectAll('*').remove();

        let radius = Math.sqrt(this.cx * this.cx + this.cy * this.cy);
        let sectorCount = 60;
        let angleStep = Math.PI * 2 / sectorCount;
        let sectors = _.range(0, sectorCount, 1);
        let arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius * 1.5)
                    .startAngle(d => d * angleStep)
                    .endAngle(d => (d + 1) * angleStep + Math.PI / 360);

        let hueOffset = this.state.hueOffset;

        let defs = bg.append("defs");

        for (let i of sectors) {
            let r = radius / 3;
            let startAngle = i * angleStep - Math.PI / 2;
            let endAngle = startAngle + angleStep;
            let gradient = defs.append("linearGradient")
                               .attr("id", `svgGradient${i}`)
                               .attr("gradientUnits", "userSpaceOnUse")
                               .attr("x1", this.fitInBoundaries(r * Math.cos(startAngle), -this.cx, this.cx))
                               .attr("x2", this.fitInBoundaries(r * Math.cos(endAngle), -this.cx, this.cx))
                               .attr("y1", this.fitInBoundaries(r * Math.sin(startAngle), -this.cy, this.cy))
                               .attr("y2", this.fitInBoundaries(r * Math.sin(endAngle), -this.cy, this.cy));
            gradient.append("stop")
                    .attr('class', 'start')
                    .attr("offset", "0%")
                    .attr("stop-color", d3.hsl((i * 360 / sectorCount + hueOffset) % 360, 1, 0.5).toString())
                    .attr("stop-opacity", 1);

            gradient.append("stop")
                    .attr('class', 'end')
                    .attr("offset", "100%")
                    .attr("stop-color", d3.hsl(((i + 1) * 360 / sectorCount + hueOffset) % 360, 1, 0.5).toString())
                    .attr("stop-opacity", 1);
        }

        let fill = d => `url(#svgGradient${d})`;

        bg.selectAll('path').data(sectors).enter().append('path')
          .attr('class', 'fillSector')
          .attr("d", arc)
          .attr("fill", fill)
          .attr("stroke-width", 0)
          .attr("stroke", "none");
    }

    drawForeground() {
        let fgColor = d3.rgb(0, 0, 0);
        if (this.props.fgColor)
            fgColor = d3.color(this.props.fgColor);
        let step = 2.5;
        let cx = this.cx;
        let cy = this.cy;

        // let getColor = d3.scaleLinear().domain([0, 2 * cy + 2 * cx]).range([0, 360]);

        this.foreground.selectAll('*').remove();

        for (let i = -cx; i <= cx; i += step) {
            this.foreground.append("line")
                .attr("x1", -i)
                .attr("y1", -cy)
                .attr("x2", i)
                .attr("y2", cy)
                .attr("stroke-width", 1)
                .attr("stroke", fgColor.toString());
        }

        for (let i = -cy; i <= cy; i += step) {
            this.foreground.append("line")
                .attr("x1", -cx)
                .attr("y1", -i)
                .attr("x2", cx)
                .attr("y2", i)
                .attr("stroke-width", 1)
                .attr("stroke", fgColor.toString());
        }
        return true;
    }


    render() {
        return (
            <div id="moire-room">
            </div>
        );
    }
}

export default MoireRoom;