require('../../sass/Rosette.scss');

import React from 'react';
import d3 from '../d3-lib';
import _ from 'underscore';
import Timer from '../services/TimerService';
import PropTypes from 'prop-types';


const propTypes = {
    angleStep: PropTypes.number,
    radius: PropTypes.number,
    rows: PropTypes.number,
    color: PropTypes.string,
    thickness: PropTypes.number,
    id: PropTypes.string.isRequired
};

const τ = Math.PI * 2;

class Rosette extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scale: 1,
            rotation: 0,
            sequence: []
        };

        this.draw = this.draw.bind(this);

    }

    prepare() {
        let c = this.container;
        let padding = 10;
        let r = this.maxRadius;
        let thickness = this.props.thickness;
        let color = this.props.color;
        c.attr('width', 2 * r)
         .attr('height', 2 * r)
         .attr('viewBox', `${-r - padding} ${-r - padding} ${2 * (r + padding)} ${2 * (r + padding)}`)
         .attr('preserveAspectRatio', 'xMidYMid');
        c.select('defs').select('circle')
         .attr('id', 'circle-element')
         .attr('cx', 0)
         .attr('cy', 0)
         .attr('r', this.props.radius)
         .attr("fill", "none")
         .attr("stroke-width", thickness)
         .attr("stroke", color)
         .attr('class', 'circle');
    }

    generateSequence() {
        let sequence = [{
            cx: 0,
            cy: 0,
            row: 0
        }];
        let precision = 2;
        let step = Math.min(360, Math.max(0, Math.round(this.props.angleStep)));
        let radius = this.props.radius;
        let round = (v) => Math.round(Math.pow(10, precision) * v) / Math.pow(10, precision);
        let distance = (c) => Math.sqrt(c.cx * c.cx + c.cy * c.cy);
        for (let i = 0; i < this.props.rows; i++) {
            let circles = _.where(sequence, {
                row: i
            });
            _.each(circles, (circle) => {
                let angle = 0;
                while (angle === 0 || angle % 360 != 0) {
                    let c = {
                        row: i + 1,
                        cx: round(circle.cx + radius * Math.cos(angle / 360 * τ)),
                        cy: round(circle.cy + radius * Math.sin(angle / 360 * τ))
                    };
                    if (distance(c) >= distance(circle))
                        sequence.push(c);
                    angle += step;
                }
            });
        }
        sequence = sequence.map(item => {
            item.cx = Math.round(item.cx);
            item.cy = Math.round(item.cy);
            return item;
        });
        let distantItem = _.max(sequence, (item) => Math.max(item.cx, item.cy));
        this.maxRadius = (Math.max(distantItem.cx, distantItem.cy) + radius + this.props.thickness) * this.state.scale;
        this.prepare();
        return _.sortBy(sequence, (item) => item.row);
    }

    setTransform() {
        this.container.select('g').attr('transform', this.getTransform());
    }

    draw() {
        let c = this.container;
        c = c.select('g').attr('transform', this.getTransform());
        let circles = c.selectAll('use').data(this.state.sequence);
        circles.enter().append('use')
               .merge(circles)
               .attr('x', d => d.cx)
               .attr('y', d => d.cy)
               .attr('xlink:href', '#circle-element');
        circles.exit().remove();
    }


    componentDidMount() {
        this.container = d3.select(`.rosette#${this.props.id}`).select('svg');
        this.setState({
            sequence: this.generateSequence()
        }, this.draw);
        this.timer = Timer.set(this.rotateMe.bind(this), 20);
    }

    rotateMe() {
        this.setState({
            rotation: this.state.rotation + 0.1
        }, this.setTransform.bind(this));
    }

    getTransform() {
        return `scale(${this.state.scale}) rotate(${this.state.rotation})`;
    }

    render() {
        return (
            <div className="rosette" id={this.props.id}>
                <svg>
                    <filter id="glow" x="0" y="0" width="100%" height="100%">
                        <feGaussianBlur result="blurOut" in="SourceGraphic" stdDeviation="5"/>
                        <feBlend in="SourceGraphic" in2="blurOut" mode="screen"/>
                    </filter>
                    <defs>
                        <circle cx="0" cy="0" r={this.props.radius}>
                        </circle>
                    </defs>
                    <g className="tr" transform={this.getTransform()}>

                    </g>
                </svg>
            </div>
        );
    }
}

Rosette.propTypes = propTypes;
Rosette.defaultProps = {
    radius: 120,
    angleStep: 60,
    rows: 3,
    color: '#FFFFFF',
    thickness: 2.5
};

export default Rosette;