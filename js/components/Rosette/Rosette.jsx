require('./Rosette.scss');

import React from 'react';
import PropTypes from 'prop-types';
import d3 from '../../d3-lib';
import _ from 'underscore';
import Timer from '../../services/TimerService';


const propTypes = {
    angleStep: PropTypes.number,
    radiusFactor: PropTypes.number,
    maxRow: PropTypes.number,
    minRow: PropTypes.number,
    color: PropTypes.string,
    thicknessFactor: PropTypes.number,
    glowFactor: PropTypes.number,
    rotateSpeed: PropTypes.number,
    outlineOuter: PropTypes.bool,
    outlineInner: PropTypes.bool,
    cropOuter: PropTypes.number,
    cropInner: PropTypes.number,
    cropX: PropTypes.oneOf([-1, 0, 1]),
    cropY: PropTypes.oneOf([-1, 0, 1]),
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

        this.radiusConstant = 100;

        for (let method of ['draw', 'redraw', 'prepare', 'setTimer', 'setTransform'])
            this[method] = this[method].bind(this);

    }

    getOuterClipPathId() {
        return `outer-clip-${this.props.id}`;
    }

    getOuterOutlineId() {
        return `outer-outline-${this.props.id}`;
    }

    getInnerClipPathId() {
        return `inner-clip-${this.props.id}`;
    }

    getInnerOutlineId() {
        return `inner-outline-${this.props.id}`;
    }

    getCirclePrototypeId() {
        return `circle-prototype-${this.props.id}`;
    }

    getGlowFilterId() {
        return `glow-filter-${this.props.id}`;
    }

    prepare() {
        let c = this.container;
        let padding = 0;
        let thickness = this.props.thicknessFactor * this.radiusConstant;
        let r = this.maxRadius / this.state.scale + thickness;
        let clipOuterRadius = this.radiusConstant * this.props.cropOuter;
        let clipInnerRadius = this.radiusConstant * this.props.cropInner;
        let color = this.props.color;
        let boundary = Math.round((this.props.cropOuter ? Math.min(r, clipOuterRadius) : r) + padding);
        if (this.props.outlineOuter)
            boundary += thickness / 2;
        let left = this.props.cropX == 1 ? 0 : -boundary;
        let top = this.props.cropY == 1 ? 0 : -boundary;
        let right = this.props.cropX == -1 ? 0 : boundary;
        let bottom = this.props.cropY == -1 ? 0 : boundary;
        let boundaryBox = `${left} ${top} ${right - left} ${bottom - top}`;
        let alignment = ['Max', 'Mid', 'Min'];
        let alignmentString = `x${alignment[this.props.cropX + 1]}Y${alignment[this.props.cropY + 1]}`;

        let size = Math.round(2 * boundary);
        c.attr('width', size)
         .attr('height', size)
         .attr('viewBox', boundaryBox)
         .attr('preserveAspectRatio', alignmentString);
        c.select('g.tr').style('filter', `url('#${this.getGlowFilterId()}`);
        c.select('defs').select(`circle#${this.getCirclePrototypeId()}`)
         .attr('cx', 0)
         .attr('cy', 0)
         .attr('r', this.radiusConstant)
         .attr("fill", "none")
         .attr("stroke-width", thickness);
        c.select('defs').select(`mask#${this.getInnerClipPathId()}`)
         .attr('width', size)
         .attr('height', size)
         .attr('x', -boundary)
         .attr('y', -boundary)
         .select('use.crop-inner-circle')
         .attr('r', clipInnerRadius)
         .attr('fill', 'black')
         .attr('xlink:href', `#${this.getInnerOutlineId()}`);
        c.select('defs').select(`clipPath#${this.getOuterClipPathId()}`).select('circle')
         .attr('r', clipOuterRadius);
        c.select(`filter#${this.getGlowFilterId()}`).select('feGaussianBlur')
         .attr('stdDeviation', thickness * this.props.glowFactor);
        c.selectAll('use.outline').remove();

        if (this.props.outlineOuter && this.props.cropOuter) {
            c.append('use')
             .attr('class', 'outline')
             .attr('x', 0)
             .attr('y', 0)
             .attr('xlink:href', `#${this.getOuterOutlineId()}`)
             .attr("fill", "none")
             .attr("stroke-width", thickness)
             .attr("stroke", color);
        }
        if (this.props.outlineInner && this.props.cropInner) {
            c.append('use')
             .attr('class', 'outline')
             .attr('x', 0)
             .attr('y', 0)
             .attr('xlink:href', `#${this.getInnerOutlineId()}`)
             .attr("fill", "none")
             .attr("stroke-width", thickness)
             .attr("stroke", color);
        }
    }

    generateSequence() {
        let sequence = [{
            cx: 0,
            cy: 0,
            row: 0
        }];
        let precision = 2;
        let step = Math.min(360, Math.max(0, Math.round(this.props.angleStep)));
        let radius = this.props.radiusFactor * this.radiusConstant;
        let round = (v) => Math.round(Math.pow(10, precision) * v) / Math.pow(10, precision);
        let distance = (c) => Math.sqrt(c.cx * c.cx + c.cy * c.cy);
        for (let i = 0; i < this.props.maxRow; i++) {
            let circles = _.where(sequence, {
                row: i
            });
            _.each(circles, (circle) => {
                let angle = 0;
                while (angle === 0 || angle % 360 != 0) {
                    let c = {
                        cx: round(circle.cx + radius * Math.cos(angle / 360 * τ)),
                        cy: round(circle.cy + radius * Math.sin(angle / 360 * τ))
                    };
                    angle += step;
                    if (distance(c) < distance(circle) || _.findWhere(sequence, c))
                        continue;
                    c.row = i + 1;
                    sequence.push(c);
                }
            });
        }
        if (this.props.minRow)
            sequence = _.reject(sequence, (item) => item.row < this.props.minRow);
        sequence = sequence.map(item => {
            item.cx = Math.round(item.cx);
            item.cy = Math.round(item.cy);
            return item;
        });
        let distantItem = _.max(sequence, (item) => Math.max(item.cx, item.cy));
        this.maxRadius = (Math.max(distantItem.cx, distantItem.cy)
            + this.radiusConstant * (1 + this.props.thicknessFactor))
            * this.state.scale;
        this.prepare();
        return _.sortBy(sequence, (item) => item.row);
    }

    setTransform() {
        this.container.select('g')
            .attr('transform', this.getTransform())
            .attr('clip-path', this.props.cropOuter ? `url(#${this.getOuterClipPathId()})` : "none")
            .attr('mask', this.props.cropInner ? `url(#${this.getInnerClipPathId()})` : "none");
    }

    draw() {
        let c = this.container;
        c = c.select('g').attr('transform', this.getTransform());
        let circles = c.selectAll('use').data(this.state.sequence);
        circles.enter().append('use')
               .merge(circles)
               .attr('x', d => d.cx)
               .attr('y', d => d.cy)
               .attr('xlink:href', `#${this.getCirclePrototypeId()}`)
               .attr('stroke', this.props.color);
        circles.exit().remove();
    }

    setTimer() {
        if (this.props.rotateSpeed != 0) {
            if (!this.timer)
                this.timer = Timer.set(this.rotateMe.bind(this), 20);
        }
        else if (this.timer) {
            Timer.clear(this.timer);
            this.timer = null;
        }
    }

    redraw() {
        this.setTimer();
        this.setTransform();
        this.draw();
    }

    rotateMe() {
        let angle = this.state.rotation + this.props.rotateSpeed;
        if (angle > 360)
            angle -= 360;
        this.setState({
            rotation: angle
        }, this.setTransform);
    }

    getTransform() {
        return `scale(${this.state.scale}) rotate(${this.state.rotation})`;
    }


    componentDidMount() {
        this.container = d3.select(`.rosette#${this.props.id}`).select('svg');
        this.setState({
            sequence: this.generateSequence()
        }, this.redraw);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.props == nextProps)
            return false;
        return !(_.isMatch(this.props, nextProps));
    }

    componentDidUpdate(prevProps, prevState) {
        if (_.isMatch(this.props, prevProps))
            return true;
        this.setState({
            sequence: this.generateSequence()
        }, this.redraw);
    }


    render() {
        return (
            <div className="rosette" id={this.props.id}>
                <svg>
                    <filter id={this.getGlowFilterId()} x="-200%" y="-200%" width="400%" height="400%">
                        <feGaussianBlur result="blurOut" in="SourceGraphic"
                                        stdDeviation={this.radiusConstant * this.props.glowFactor}/>
                        <feBlend in2="SourceGraphic" in="blurOut" mode="screen"/>
                    </filter>
                    <defs>
                        <clipPath id={this.getOuterClipPathId()}>
                            <circle id={this.getOuterOutlineId()} x="0" y="0"
                                    r={this.radiusConstant * this.props.cropOuter}/>
                        </clipPath>
                        <circle id={this.getInnerOutlineId()} x="0" y="0"
                                r={this.radiusConstant * this.props.cropInner}/>
                        <mask id={this.getInnerClipPathId()} maskUnits="userSpaceOnUse"
                              x="0" y="0"
                              width={this.radiusConstant * this.props.cropInner}
                              height={this.radiusConstant * this.props.cropInner}>
                            <rect x="-100%" y="-100%" width="200%" height="200%" fill="white"/>
                            <use xlinkHref={this.getInnerOutlineId()} className="crop-inner-circle" fill="black"/>
                        </mask>
                        <circle id={this.getCirclePrototypeId()} cx="0" cy="0" r={this.radiusConstant}>
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
    radiusFactor: Math.sqrt(2),
    angleStep: 90,
    maxRow: 5,
    minRow: 1,
    rotateSpeed: 0.75,
    color: '#FFFFFF',
    thicknessFactor: 0.025,
    glowFactor: 0.5,
    outlineOuter: true,
    outlineInner: true,
    cropOuter: 5,
    cropInner: 1.5,
    cropX: 0,
    cropY: 0
};

export default Rosette;