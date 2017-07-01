require('./Rosette.scss');

import React from 'react';
import PropTypes from '../../utilities/proptypes-extend';
import d3 from '../../d3-lib';
import _ from '../../utilities/underscore-extend';


const propTypes = {
    angleStep: PropTypes.number,
    radiusFactor: PropTypes.number,
    maxRow: PropTypes.number,
    minRow: PropTypes.number,
    color: PropTypes.string,
    thicknessFactor: PropTypes.number,
    glowFactor: PropTypes.number,
    rotateSpeed: PropTypes.number, //radians per second
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

        this.__radiusConstant = 100;

        for (let method of ['_draw', '_redraw', '_prepare', '_setTimer', '_setTransform', '_rotateMe'])
            this[method] = this[method].bind(this);

    }

    _getOuterClipPathId() {
        return `outer-clip-${this.props.id}`;
    }

    _getOuterOutlineId() {
        return `outer-outline-${this.props.id}`;
    }

    _getInnerClipPathId() {
        return `inner-clip-${this.props.id}`;
    }

    _getInnerOutlineId() {
        return `inner-outline-${this.props.id}`;
    }

    _getCirclePrototypeId() {
        return `circle-prototype-${this.props.id}`;
    }

    _getGlowFilterId() {
        return `glow-filter-${this.props.id}`;
    }

    _prepare() {
        let c = this.__container;
        let padding = 0;
        let thickness = this.props.thicknessFactor * this.__radiusConstant;
        let r = this.__maxRadius / this.state.scale + thickness;
        let clipOuterRadius = this.__radiusConstant * this.props.cropOuter;
        let clipInnerRadius = this.__radiusConstant * this.props.cropInner;
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
        c.select('g.tr').style('filter', `url('#${this._getGlowFilterId()}`);
        c.select('defs').select(`circle#${this._getCirclePrototypeId()}`)
         .attr('cx', 0)
         .attr('cy', 0)
         .attr('r', this.__radiusConstant)
         .attr("fill", "none")
         .attr("stroke-width", thickness);
        c.select('defs').select(`mask#${this._getInnerClipPathId()}`)
         .attr('width', size)
         .attr('height', size)
         .attr('x', -boundary)
         .attr('y', -boundary)
         .select('use.crop-inner-circle')
         .attr('r', clipInnerRadius)
         .attr('fill', 'black')
         .attr('xlink:href', `#${this._getInnerOutlineId()}`);
        c.select('defs').select(`clipPath#${this._getOuterClipPathId()}`).select('circle')
         .attr('r', clipOuterRadius);
        c.select(`filter#${this._getGlowFilterId()}`).select('feGaussianBlur')
         .attr('stdDeviation', thickness * this.props.glowFactor);
        c.selectAll('use.outline').remove();

        if (this.props.outlineOuter && this.props.cropOuter) {
            c.append('use')
             .attr('class', 'outline')
             .attr('x', 0)
             .attr('y', 0)
             .attr('xlink:href', `#${this._getOuterOutlineId()}`)
             .attr("fill", "none")
             .attr("stroke-width", thickness)
             .attr("stroke", color);
        }
        if (this.props.outlineInner && this.props.cropInner) {
            c.append('use')
             .attr('class', 'outline')
             .attr('x', 0)
             .attr('y', 0)
             .attr('xlink:href', `#${this._getInnerOutlineId()}`)
             .attr("fill", "none")
             .attr("stroke-width", thickness)
             .attr("stroke", color);
        }
    }

    _generateSequence() {
        let sequence = [{
            cx: 0,
            cy: 0,
            row: 0
        }];
        let precision = 2;
        let step = Math.min(360, Math.max(0, Math.round(this.props.angleStep)));
        let radius = this.props.radiusFactor * this.__radiusConstant;
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
        this.__maxRadius = (Math.max(distantItem.cx, distantItem.cy)
            + this.__radiusConstant * (1 + this.props.thicknessFactor))
            * this.state.scale;
        this._prepare();
        return _.sortBy(sequence, (item) => item.row);
    }

    _setTransform() {
        this.__container.select('g')
            .attr('transform', this._getTransform())
            .attr('clip-path', this.props.cropOuter ? `url(#${this._getOuterClipPathId()})` : "none")
            .attr('mask', this.props.cropInner ? `url(#${this._getInnerClipPathId()})` : "none");
    }

    _draw() {
        let c = this.__container;
        c = c.select('g').attr('transform', this._getTransform());
        let circles = c.selectAll('use').data(this.state.sequence);
        circles.enter().append('use')
               .merge(circles)
               .attr('x', d => d.cx)
               .attr('y', d => d.cy)
               .attr('xlink:href', `#${this._getCirclePrototypeId()}`)
               .attr('stroke', this.props.color);
        circles.exit().remove();
    }

    _setTimer() {
        if (this.props.rotateSpeed != 0) {
            this.__timer.restart(this._rotateMe)
        }
        else {
            this.__timer.stop();
        }
    }

    _redraw() {
        this._setTimer();
        this._setTransform();
        this._draw();
    }

    _rotateMe(elapsed) {
        let precision = 10e+2;
        let angle = Math.round(precision * this.props.rotateSpeed * 360 * elapsed / 1000);
        angle = (angle % (360 * precision)) / precision;
        this.setState({
            rotation: angle
        }, this._setTransform);
    }

    _getTransform() {
        return `scale(${this.state.scale}) rotate(${this.state.rotation})`;
    }


    componentDidMount() {
        this.__container = d3.select(`.rosette#${this.props.id}`).select('svg');
        this.__timer = d3.timer(this._rotateMe);
        this.setState({
            sequence: this._generateSequence()
        }, this._redraw);
    }

    componentWillUnmount() {
        this.__timer.stop();
        this.__timer = null;
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
            sequence: this._generateSequence()
        }, this._redraw);
    }


    render() {
        return (
            <div className="rosette" id={this.props.id}>
                <svg>
                    <filter id={this._getGlowFilterId()} x="-200%" y="-200%" width="400%" height="400%">
                        <feGaussianBlur result="blurOut" in="SourceGraphic"
                                        stdDeviation={this.__radiusConstant * this.props.glowFactor}/>
                        <feBlend in2="SourceGraphic" in="blurOut" mode="screen"/>
                    </filter>
                    <defs>
                        <clipPath id={this._getOuterClipPathId()}>
                            <circle id={this._getOuterOutlineId()} x="0" y="0"
                                    r={this.__radiusConstant * this.props.cropOuter}/>
                        </clipPath>
                        <circle id={this._getInnerOutlineId()} x="0" y="0"
                                r={this.__radiusConstant * this.props.cropInner}/>
                        <mask id={this._getInnerClipPathId()} maskUnits="userSpaceOnUse"
                              x="0" y="0"
                              width={this.__radiusConstant * this.props.cropInner}
                              height={this.__radiusConstant * this.props.cropInner}>
                            <rect x="-100%" y="-100%" width="200%" height="200%" fill="white"/>
                            <use xlinkHref={this._getInnerOutlineId()} className="crop-inner-circle" fill="black"/>
                        </mask>
                        <circle id={this._getCirclePrototypeId()} cx="0" cy="0" r={this.__radiusConstant}>
                        </circle>
                    </defs>
                    <g className="tr" transform={this._getTransform()}>

                    </g>
                </svg>
            </div>
        );
    }
}

const defaultProps = {
    radiusFactor: Math.sqrt(2),
    angleStep: 90,
    maxRow: 5,
    minRow: 1,
    rotateSpeed: Math.PI / 90,
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

const propSettings = {
    radiusFactor: [0.1, 5],
    angleStep: [10, 180],
    minRow: [1, 5, 1],
    maxRow: [1, 6, 1],
    color: 'color',
    rotateSpeed: [-1, 1],
    thicknessFactor: [0.01, 0.5],
    glowFactor: [0, 10],
    outlineOuter: true,
    outlineInner: true,
    cropOuter: [0, 6],
    cropInner: [0, 5],
    cropX: [-1, 1, 1],
    cropY: [-1, 1, 1]
};

Rosette.propTypes = /* remove-proptypes */ propTypes;
Rosette.defaultProps = defaultProps;

export {Rosette as default, defaultProps, propSettings};