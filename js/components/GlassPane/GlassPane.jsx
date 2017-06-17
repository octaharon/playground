require('./GlassPane.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import _ from 'underscore';
import d3 from '../../d3-lib';
import * as d3_live from 'd3-selection';
import Utils from '../../utils';

let propTypes =
    {
        id: PropTypes.string.isRequired,
        bgColor: PropTypes.string,
        bgBlurSource: PropTypes.string,
        minOpacity: PropTypes.number,
        maxOpacity: PropTypes.number,
        shadowOpacity: PropTypes.number,
        shadowBlur: PropTypes.number,
        shadowOffsetX: PropTypes.number,
        shadowOffsetY: PropTypes.number,
        borderRadius: PropTypes.number,
        borderColor: PropTypes.string,
        borderOpacity: PropTypes.number,
        outlineOpacity: PropTypes.number,
        outlineColor: PropTypes.string,
        outlineWidth: PropTypes.number,
        fadeTop: PropTypes.number,
        fadeBottom: PropTypes.number,
        hasTransition: PropTypes.bool,
        scroll: PropTypes.bool,
        scrollDecay: PropTypes.number
    };

class GlassPane extends React.Component {
    constructor(props) {
        super(props);
        let {width, height} = Utils.getViewportSize();
        this.state = {
            scrollOffset: 0,
            scrollOffsetTarget: null,
            init: true
        };
        this.__internalResolution = {width, height, size: Math.max(width, height)};
        this.__specularMaskOffset = {x: 65, y: 45};
        [
            '_redraw',
            '_setBlurSource',
            '_setFade',
            '_setScroll',
            '_getScrollPosition',
            '_getScrollHandlePosition',
            '_updateScroll',
            '_tweenScroll',
            '_scrollAnimate',
            '_measureDragSpeed',
            '_onScroll',
            '_setDOMCache'
        ].forEach((method) => this[method] = this[method].bind(this));
    }

    _getBodyShapeId() {
        return `body-shape-${this.props.id}`;
    }

    _getBodyGradientId() {
        return `body-gradient-${this.props.id}`;
    }

    _getBodyShadowId() {
        return `body-shadow-${this.props.id}`;
    }

    _getBodyShadowFilterId() {
        return `body-shadow-filter-${this.props.id}`;
    }

    _getBodyShadowMaskId() {
        return `body-shadow-mask-${this.props.id}`;
    }

    _getGlossFilterId() {
        return `filter-gloss-${this.props.id}`;
    }

    _getGlossGradientMaskId() {
        return `gloss-filter-mask-${this.props.id}`;
    }

    _getGlossMaskId() {
        return `gloss-mask-${this.props.id}`;
    }

    _getSpecularGradientId() {
        return `specular-gradient-${this.props.id}`;
    }

    _getSpecularMaskId() {
        return `specular-mask-${this.props.id}`;
    }

    _getOutlineGradientId() {
        return `outline-gradient-${this.props.id}`;
    }

    _getOutlineHorizontalGradientId() {
        return `outline-gradient-horizontal-${this.props.id}`;
    }

    _getOutlineVerticalGradientId() {
        return `outline-gradient-vertical-${this.props.id}`;
    }

    _getBorderShadeGradientId() {
        return `shade-gradient-${this.props.id}`;
    }

    _getBorderShadeFilterId() {
        return `shade-filter-${this.props.id}`;
    }

    _getNoiseFilterId() {
        return `noise-texture-${this.props.id}`;
    }

    _getFadeGradientId() {
        return `fade-gradient-${this.props.id}`;
    }

    _getFadeMaskId() {
        return `fade-mask-${this.props.id}`;
    }

    _getBorderTransform() {
        let precision = 10e-4;
        let scaleX = Math.round((this.__internalResolution.width - 2 * this.props.outlineWidth) / this.__internalResolution.width / precision) * precision;
        let scaleY = Math.round((this.__internalResolution.height - 2 * this.props.outlineWidth) / this.__internalResolution.height / precision) * precision;
        let scale = Math.min(scaleX, scaleY);
        return `scale(${scaleX}, ${scaleY})`;
    }

    _getScrollPosition() {
        if (!this.__scrollInterpolate)
            return 0;
        return this.__scrollInterpolate(Math.max(0, Math.min(1, this.state.scrollOffset)));
    }

    _getScrollHandlePosition() {
        if (!this.__scrollHandleOffset)
            return 0;
        return this.__scrollHandleOffset(Math.max(0, Math.min(1, this.state.scrollOffset)));
    }

    _redraw() {
        if (this.state.init) {
            this.setState({init: false}, function () {
                d3.select(this.__container)
                  .selectAll('.glass-pane__border, .glass-pane__noise')
                  .style('transform-origin', '50% 50% 0');
                if (this.props.hasTransition)
                    d3.select(this.__container.parentNode).on(Utils.getAllTransitionEvents(), null);
                this._redraw();
            }.bind(this));
            return false;
        }
        requestAnimationFrame(function () {
            this._setBlurSource();
            this._setBlurredContent();
            this._setFade();
            this._setScroll();
        }.bind(this))

    }

    _setFade() {
        if (this.props.fadeTop || this.props.fadeBottom) {
            this.__contentContainer
                .style('-webkit-mask-image',
                    `-webkit-gradient(linear, left top, left bottom, 
            from(rgba(0,0,0,0)),
            color-stop(${this.props.fadeTop / 2}, rgba(0,0,0,0)), 
            color-stop(${this.props.fadeTop}, rgba(0,0,0,1)), 
            color-stop(${1 - this.props.fadeBottom}, rgba(0,0,0,1)), 
            color-stop(${1 - this.props.fadeBottom / 2}, rgba(0,0,0,0)), 
            to(rgba(0,0,0,0)))`)
                .style('mask', `url(#${this._getFadeMaskId()})`);
        }
        else
            this.__contentContainer
                .style('-webkit-mask-image', 'none')
                .style('mask', 'none');
    }

    _onScroll(evt) {
        if (!this.__scrollTimer)
            return false;
        evt.preventDefault();
        let offset = evt.deltaY;
        let contentNode = this.__contentBox.select('.glass-pane__content').node();
        if (evt.deltaMode == 1)
            offset *= parseFloat(Utils.getActualStyle(contentNode, 'line-height'));
        let contentHeight = contentNode.getBoundingClientRect().height -
                this.__contentBox.node().getBoundingClientRect().height,
            delta = offset / contentHeight,
            targetOffset = Utils.fitInRange((this.state.scrollOffsetTarget || this.state.scrollOffset) + delta, 0, 1);
        this._scrollAnimate(targetOffset);
    }

    _scrollAnimate(offset) {
        this.setState({
            scrollOffsetTarget: offset
        }, function () {
            this.__scrollTimer.restart(this._tweenScroll);
        }.bind(this));
    }


    _tweenScroll(elapsed) {
        if (!this.__scrollTimer || this.state.scrollOffsetTarget === null)
            return false;
        let error = this.state.scrollOffsetTarget - this.state.scrollOffset,
            offset = 0;
        if (Math.abs(error) < 10e-4) {
            this.__scrollTimer.stop();
            offset = this.state.scrollOffsetTarget;
            this.setState({
                scrollOffsetTarget: null
            });
        }
        else {
            let exp = Math.exp(-elapsed / this.props.scrollDecay);
            offset = Utils.fitInRange(this.state.scrollOffsetTarget - error * exp, 0, 1);
        }
        this.setState({
            scrollOffset: offset
        }, this._updateScroll);
    }

    _setScroll() {
        if (!this.__scrollContainer || !this.props.scroll)
            return false;
        let _self = this, dragStartY = null;
        let contentBody = this.__contentContainer.select('.glass-pane__content'),
            contentBox = contentBody.node().getBoundingClientRect(),
            wrapperBox = Utils.getInnerSize(this.__contentBox.node()),
            contentRange = Math.max(0, contentBox.height - wrapperBox.height),
            scrollBar = this.__scrollContainer.select('.glass-pane__content-scroll-bar'),
            scrollBox = Utils.getInnerSize(scrollBar.node()),
            scrollNeeded = this.props.scroll && (contentBox.height > wrapperBox.height),
            scrollerSize = Math.round(10 * scrollBox.height * wrapperBox.height / contentBox.height) / 10;
        this.__scrollHandle.style('height', scrollerSize + 'px').on(".drag", null);
        scrollBar.on('click', null);
        this.__scrollDragSpeed = 0;
        this.__scrollDragDistance = 0;
        this.__scrollDragMeasureMark = null;
        Utils.removeWheelListener(this.__contentContainer.classed('has-scroll', scrollNeeded).node(), this._onScroll);
        if (scrollNeeded) {
            this.__scrollInterpolate = d3.scaleLinear()
                                         .domain([0, 1])
                                         .range([0, -contentRange]);
            this.__scrollHandleOffset = d3.scaleLinear()
                                          .domain([0, 1])
                                          .range([0, scrollBox.height - scrollerSize]);

            scrollBar.on('click', function (ev) {
                ev = ev || d3_live.event;
                if (ev.target != scrollBar.node())
                    return false;
                _self._scrollAnimate(_self.__scrollHandleOffset.invert(Utils.getMouseEventOffset(ev).offsetY - scrollerSize / 2));
            }).on('touchend', function (ev) {
                ev = ev || d3_live.event;
                scrollBar.classed('dragging', false);
            });
            this.__contentBox.call(d3.drag()
                                     //start measuring of drag speed
                                     .on('start', function () {
                                         if (d3_live.event.identifier == 'mouse')
                                             return true;
                                         _self.__scrollDragDistance = 0;
                                         _self.__scrollDragSpeed = 0;
                                         this.__scrollDragMeasureMark = d3.now();
                                         _self.__dragTimer.restart(_self._measureDragSpeed);
                                     })
                                     .on('drag', function () {
                                         let ev = d3_live.event;
                                         ev.sourceEvent.stopPropagation();
                                         ev.sourceEvent.stopImmediatePropagation();
                                         if (!ev.dy || ev.identifier == 'mouse')
                                             return true;
                                         let dy = ev.dy;
                                         //if user changes the direction of drag, start measuring all over again
                                         if (_self.__scrollDragDistance * dy <= 0) {
                                             _self.__scrollDragDistance = dy;
                                         }
                                         else
                                             _self.__scrollDragDistance += dy;
                                         let offset = Utils.fitInRange(_self.state.scrollOffset - (dy / contentRange), 0, 1);
                                         _self.setState({
                                             scrollOffset: offset
                                         }, _self._updateScroll);
                                     })
                                     //make kinetic inertia
                                     .on('end', function () {
                                         if (!_self.__scrollDragMeasureMark)
                                             return false;
                                         _self._measureDragSpeed(d3.now() - _self.__scrollDragMeasureMark, true);
                                         _self.__dragTimer.stop();
                                         let dragSpeed = _self.__scrollDragSpeed,
                                             distance = dragSpeed * _self.props.scrollDecay / 1000;
                                         if (Math.abs(dragSpeed) > contentRange / 10)
                                             _self._scrollAnimate(Utils.fitInRange(_self.state.scrollOffset - (distance / contentRange), 0, 1));
                                         _self.__scrollDragSpeed = 0;
                                         _self.__scrollDragDistance = 0;
                                         _self.__scrollDragMeasureMark = null;
                                     }))
                .on('mousedown.drag', null);
            this.__scrollHandle.call(d3.drag()
                                       .on("start", function () {
                                           let ev = d3_live.event;
                                           dragStartY = Utils.getMouseEventOffset(ev.sourceEvent).offsetY;
                                           d3.select(this.parentNode).classed('dragging', true);
                                       })
                                       .on('drag', function () {
                                           let ev = d3_live.event;
                                           ev.sourceEvent.stopPropagation();
                                           let offset = _self.__scrollHandleOffset.invert(ev.y - (dragStartY || scrollerSize / 2));
                                           _self._scrollAnimate(offset);
                                       })
                                       .on('end', function () {
                                           d3.select(this.parentNode).classed('dragging', false);
                                           dragStartY = null;
                                       }));
            Utils.addWheelListener(this.__contentContainer.node(), this._onScroll);
        }
        else
            this.__scrollInterpolate = this.__scrollHandleOffset = null;
        return scrollNeeded && this._updateScroll();
    }

    _measureDragSpeed(elapsed, force = false) {
        let measureLength = 1000 / 60 * 7,
            temporalSmoothCoefficient = 0.2;
        elapsed = Math.max(elapsed, d3.now() - this.__scrollDragMeasureMark);
        if (force || elapsed > measureLength) {
            let v = 1000 * this.__scrollDragDistance / (1 + elapsed);
            this.__scrollDragDistance = 0;
            this.__scrollDragMeasureMark = d3.now();
            this.__scrollDragSpeed = temporalSmoothCoefficient * this.__scrollDragSpeed + 0.8 * v;
            this.__dragTimer.restart(this._measureDragSpeed);
        }
    }

    _updateScroll() {
        if (!this.__scrollContainer)
            return false;
        requestAnimationFrame(function () {
            this.__contentBox
                .select('.glass-pane__content')
                .style('transform', `translate(0, ${this._getScrollPosition()}px)`);

            this.__scrollHandle.style('top', this._getScrollHandlePosition() + 'px');
        }.bind(this));
    }

    _setBlurSource() {
        let blurSource = null;
        this.__blurSource = blurSource;
        if (this.props.bgBlurSource && (blurSource = d3.select(this.props.bgBlurSource))) {
            this.__blurSource = blurSource;
        }
        else {
            this.__blurContainer.html('').classed('fade-in', false);
        }

    }


    _updateBlur() {
        if (!this.__blurSource)
            return false;
        let sourceFrame = this.__blurSource.node().getBoundingClientRect();
        let targetFrame = this.__blurContainer.node().parentNode.getBoundingClientRect();
        this.__blurContainer
            .style('width', sourceFrame.width + 'px')
            .style('height', sourceFrame.height + 'px')
            .style('left', -targetFrame.left + 'px')
            .style('top', -targetFrame.top + 'px')
            .classed('fade-in', true);
    }

    _setBlurredContent() {
        this.__blurContainer.html('');
        if (!this.__blurSource) {
            return false;
        }
        let content = this.__blurSource.html();
        this.__blurContainer.html(content);
        this._updateBlur();
    }

    _setDOMCache() {
        this.__container = ReactDOM.findDOMNode(this);
        this.__blurContainer = d3.select(this.__container)
                                 .select('.glass-pane__blur-content');
        this.__contentContainer = d3.select(this.__container).select('.glass-pane__content-holder');
        this.__contentBox = this.__contentContainer.select('.glass-pane__content-wrapper');
        this.__scrollContainer = this.props.scroll ? d3.select(this.__container)
                                                       .select('.glass-pane__content-scroll') : null;
        this.__scrollHandle = this.__scrollContainer ? this.__scrollContainer
                                                           .select('.glass-pane__content-scroll-handle') : null;
    }


    shouldComponentUpdate(nextProps, nextState) {
        return !!(nextState.init);
    }

    componentWillReceiveProps(nextProps) {
        if ((this.props == nextProps) || (_.isMatch(this.props, nextProps)))
            return false;
        this.setState({init: true});
        return true;
    }

    componentDidMount() {
        this._setDOMCache();
        Utils.addResizeListener(function () {
            this._setScroll();
            this._updateBlur();
        }.bind(this));
        this.__scrollTimer = d3.timer(this._tweenScroll);
        this.__dragTimer = d3.timer(this._measureDragSpeed);
        this._setFade();
        if (this.props.hasTransition === true)
            d3.select(this.__container.parentNode).on(Utils.getAllTransitionEvents(), this._redraw);
        else
            this._redraw();
    }

    componentWillUnmount() {
        this.__scrollTimer.stop();
        this.__dragTimer.stop();
        this.__scrollTimer = this.__dragTimer = null;
    }


    componendDidUpdate() {
        console.log('Oops I did it again');
        this._setDOMCache();
        if (this.props.hasTransition === true)
            d3.select(this.__container.parentNode).on(Utils.getAllTransitionEvents(), this._redraw);
        else
            this._redraw();
    }


    render() {
        let scrollbarContent = '';
        if (this.props.scroll) {
            scrollbarContent =
                <div className="glass-pane__content-scroll">
                    <div className="glass-pane__content-scroll-bar">
                        <div className="glass-pane__content-scroll-handle"/>
                    </div>
                </div>
        }

        return (
            <div className="glass-pane" id={this.props.id}>
                <div className="glass-pane__blur" style={{
                    borderRadius: this.props.borderRadius,
                }}>
                    <div className="glass-pane__blur-content"/>
                </div>
                <svg className="glass-pane__background"
                     preserveAspectRatio="none"
                     width='100%'
                     height='100%'
                     viewBox={`0 0 ${this.__internalResolution.size} ${this.__internalResolution.size}`}>
                    <defs>

                        <rect width="100%" height="100%" x="0" y="0"
                              id={this._getBodyShapeId()}
                              rx={this.props.borderRadius}
                              ry={this.props.borderRadius}
                        />

                        <rect
                            id={this._getBodyShadowId()}
                            width="100%" height="100%" x={this.props.shadowOffsetX} y={this.props.shadowOffsetY}
                            rx={this.props.borderRadius}
                            ry={this.props.borderRadius}
                            stroke="none"
                            fill="#000"
                        />

                        <mask id={this._getBodyShadowMaskId()}>
                            <rect x="-50%" y="-50%" width="200%" height="200%" fill="#FFFFFF"/>
                            <rect x="0" y="0" width="100%" height="100%"
                                  rx={this.props.borderRadius}
                                  ry={this.props.borderRadius}
                                  fill="#000000"/>
                        </mask>

                        <mask id={this._getFadeMaskId()}
                              maskUnits="objectBoundingBox"
                              maskContentUnits="objectBoundingBox">
                            <linearGradient id={this._getFadeGradientId()}
                                            gradientUnits="objectBoundingBox"
                                            x1="0" x2="0"
                                            y1="0" y2="1">
                                <stop stopColor="white" stopOpacity="0" offset="0"/>
                                <stop stopColor="white" stopOpacity="0" offset={this.props.fadeTop / 2}/>
                                <stop stopColor="white" stopOpacity="1" offset={this.props.fadeTop}/>
                                <stop stopColor="white" stopOpacity="1" offset={1 - this.props.fadeBottom}/>
                                <stop stopColor="white" stopOpacity="0" offset={1 - this.props.fadeBottom / 2}/>
                                <stop stopColor="white" stopOpacity="0" offset="1"/>
                            </linearGradient>
                            <rect x="0" y="0" width="1" height="1" fill={`url(#${this._getFadeGradientId()})`}/>
                        </mask>

                        <linearGradient id={this._getGlossGradientMaskId()} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="white" stopOpacity="0"/>
                            <stop offset="0.5" stopColor="white" stopOpacity="1"/>
                            <stop offset="1" stopColor="white" stopOpacity="0"/>
                        </linearGradient>

                        <mask id={this._getGlossMaskId()}>
                            <rect x="0" y={-this.props.outlineWidth * 1.5}
                                  width="100%" height={this.props.outlineWidth * 3}
                                  fill={`url(#${this._getGlossGradientMaskId()}`}/>
                        </mask>

                        <mask id={this._getSpecularMaskId()}>
                            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
                            <ellipse
                                cx={this.__specularMaskOffset.x + '%'}
                                cy={this.__specularMaskOffset.y + '%'}
                                rx={this.__specularMaskOffset.x + 1 + '%'}
                                ry={this.__specularMaskOffset.y + 1 + '%'}
                                fill="black"
                                style={
                                    {
                                        filter: `url(#${this._getBodyShadowFilterId()})`
                                    }
                                }
                            />
                            <rect x={this.__specularMaskOffset.x + '%'}
                                  y="0" width="100%" height="100%" fill="black"/>
                            <rect y={this.__specularMaskOffset.y + '%'}
                                  x="0" width="100%" height="100%" fill="black"/>
                        </mask>


                        <filter id={this._getBodyShadowFilterId()}>
                            <feGaussianBlur stdDeviation={this.props.shadowBlur}/>
                        </filter>

                        <filter id={this._getNoiseFilterId()}>
                            <feTurbulence type="fractalNoise" baseFrequency="0.75" result="noise"/>
                            <feComposite in="SourceAlpha" in2="noise" operator="in"/>
                            <feComponentTransfer>
                                <feFuncR type="linear" slope="2" intercept="-.5"/>
                                <feFuncG type="linear" slope="2" intercept="-.5"/>
                                <feFuncB type="linear" slope="2" intercept="-.5"/>
                            </feComponentTransfer>
                            <feColorMatrix type="saturate" values="0"/>
                        </filter>

                        <filter id={this._getGlossFilterId()}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blurred"/>
                            <feGaussianBlur in="SourceAlpha" stdDeviation={this.props.outlineWidth * 2}
                                            result="glowed"/>
                            <feBlend in="blurred" in2="glowed" mode="screen"/>
                        </filter>

                        <filter id={this._getBorderShadeFilterId()} height="130%">
                            <feGaussianBlur in="sourceAlpha" stdDeviation={this.props.outlineWidth * 1.5}/>
                            <feOffset dx={this.props.outlineWidth * 1.5}
                                      dy={this.props.outlineWidth}
                                      result="offsetBlur"
                            />
                            <feFlood floodColor={this.props.borderColor} floodOpacity="1"
                                     result="offsetColor"/>
                            <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetShadow"/>
                            <feComponentTransfer in="offsetShadow" result="shadow">
                                <feFuncA type="linear" slope={this.props.borderOpacity * 1.2}/>
                            </feComponentTransfer>
                            <feBlend in="shadow" in2="SourceGraphic" mode="soft-light"/>
                        </filter>

                        <linearGradient id={this._getBodyGradientId()}
                                        gradientUnits="objectBoundingBox" gradientTransform="rotate(15)"
                                        x1="0" y1="0"
                                        x2="100%" y2="0">
                            <stop offset="0%" stopColor={this.props.bgColor} stopOpacity={this.props.maxOpacity}/>
                            <stop offset="50%" stopColor={this.props.bgColor}
                                  stopOpacity={this.props.minOpacity}/>
                            <stop offset="60%" stopColor={this.props.bgColor}
                                  stopOpacity={this.props.minOpacity}/>
                            <stop offset="100%" stopColor={this.props.bgColor}
                                  stopOpacity={this.props.maxOpacity}/>
                        </linearGradient >

                        <linearGradient id={`${this._getBodyGradientId()}-2`}
                                        gradientUnits="objectBoundingBox"
                                        x1="0" y1="0"
                                        x2="100%" y2="0"
                                        gradientTransform="rotate(120)">
                            <stop offset="0%" stopColor={this.props.bgColor} stopOpacity="0"/>
                            <stop offset="50%" stopColor={this.props.bgColor} stopOpacity="1"/>
                            <stop offset="100%" stopColor={this.props.bgColor} stopOpacity="0"/>
                        </linearGradient >

                        <linearGradient id={this._getOutlineGradientId()}>
                            <stop offset="0%" stopColor={this.props.bgColor} stopOpacity="0.0"/>
                            <stop offset="25%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity / 2}/>
                            <stop offset="55%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity}/>
                            <stop offset="75%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity / 2}/>
                            <stop offset="100%" stopColor={this.props.bgColor} stopOpacity="0.0"/>
                        </linearGradient>

                        <radialGradient id={this._getSpecularGradientId()} fx="0%" fy="10%" cx="40%" cy="20%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0"/>
                            <stop offset="100%" stopColor="#fff" stopOpacity="0.75"/>
                        </radialGradient>

                        <linearGradient id={this._getOutlineHorizontalGradientId()}
                                        xlinkHref={`#${this._getOutlineGradientId()}`}
                                        gradientUnits="userSpaceOnUse" x1="0" x2="100%" y1="0" y2="0"/>
                        <linearGradient id={this._getOutlineVerticalGradientId()}
                                        xlinkHref={`#${this._getOutlineGradientId()}`}
                                        gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="100%"/>
                        <linearGradient id={this._getBorderShadeGradientId()}
                                        gradientUnits="userSpaceOnUse"
                                        x1="0" y1="0"
                                        x2="100%" y2="0"
                                        gradientTransform="rotate(240)">
                            <stop offset="0%" stopColor="#4a4a4a" stopOpacity={this.props.borderOpacity}/>
                            <stop offset="21%" stopColor={this.props.borderColor}
                                  stopOpacity={this.props.minOpacity}/>
                            <stop offset="50%" stopColor="#505050" stopOpacity={this.props.borderOpacity}/>
                            <stop offset="70%" stopColor={this.props.borderColor}
                                  stopOpacity={this.props.borderOpacity}/>
                            <stop offset="100%" stopColor={this.props.borderColor}
                                  stopOpacity={this.props.maxOpacity}/>
                        </linearGradient>
                    </defs>
                    <use xlinkHref={'#' + this._getBodyShadowId()}
                         opacity={this.props.shadowOpacity}
                         className="glass-pane__body-shadow"
                         mask={`url(#${this._getBodyShadowMaskId()})`}
                         style={
                             {

                                 filter: `url(#${this._getBodyShadowFilterId()})`
                             }
                         }
                    />
                    <g className="glass-pane__body">
                        <use xlinkHref={'#' + this._getBodyShapeId()}
                             className="glass-pane__body-main"
                             stroke="none" fill={`url(#${this._getBodyGradientId()})`}
                        />
                        <use xlinkHref={'#' + this._getBodyShapeId()}
                             className="glass-pane__body-darker"
                             stroke="none" fill={`url(#${this._getBodyGradientId()}-2)`}

                        />
                    </g>
                    <use xlinkHref={'#' + this._getBodyShapeId()}
                         className="glass-pane__body-specular"
                         stroke="none" fill={`url(#${this._getSpecularGradientId()})`}
                         mask={`url(#${this._getSpecularMaskId()})`}
                    />
                    <g className="glass-pane__gloss"
                       mask={`url(#${this._getGlossMaskId()})`}
                       style={
                           {

                               filter: `url(#${this._getGlossFilterId()})`
                           }
                       }>
                        <ellipse cx="25%" cy="0" rx="20%" ry={this.props.outlineWidth * 2} fill="#FFF"/>
                    </g>

                    <use xlinkHref={'#' + this._getBodyShapeId()}
                         className="glass-pane__border"
                         transform={this._getBorderTransform()}
                         stroke={`url(#${this._getBorderShadeGradientId()})`}
                         fill="none"
                         strokeWidth={this.props.outlineWidth}
                         style={
                             {
                                 filter: `url(#${this._getBorderShadeFilterId()})`
                             }
                         }
                    />
                    <use xlinkHref={'#' + this._getBodyShapeId()}
                         className="glass-pane__noise"
                         transform={this._getBorderTransform()}
                         stroke="none"
                         strokeWidth="0"
                         fill="#000"
                         style={
                             {
                                 filter: `url(#${this._getNoiseFilterId()})`
                             }
                         }
                    />
                    <g className="glass-pane__outline">
                        <line stroke={`url(#${this._getOutlineHorizontalGradientId()})`}
                              y1={this.props.outlineWidth / 2}
                              y2={this.props.outlineWidth / 2}
                              x1="100%" x2="0"
                              strokeWidth={this.props.outlineWidth}/>
                        <line stroke={`url(#${this._getOutlineHorizontalGradientId()})`}
                              y1="100%" y2="100%" x1="0" x2="100%" strokeWidth={this.props.outlineWidth}/>
                        <line stroke={`url(#${this._getOutlineVerticalGradientId()})`}
                              y1="100%" y2="0"
                              x1={this.props.outlineWidth / 2}
                              x2={this.props.outlineWidth / 2}
                              strokeWidth={this.props.outlineWidth}/>
                        <line stroke={`url(#${this._getOutlineVerticalGradientId()})`}
                              y1="0" y2="100%" x1="100%" x2="100%" strokeWidth={this.props.outlineWidth}/>
                    </g>

                </svg>
                <div className='glass-pane__content-holder'>
                    {scrollbarContent}
                    <div className="glass-pane__content-wrapper">
                        <div className="glass-pane__content">
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const defaultProps = {
    borderRadius: 15,
    bgColor: '#000',
    borderColor: '#fff',
    outlineWidth: 1.5,
    minOpacity: 0.9,
    borderOpacity: 0.5,
    outlineOpacity: 0.9,
    maxOpacity: 0.75,
    outlineColor: '#c7d8dc',
    shadowBlur: 12,
    shadowOffsetX: 6,
    shadowOffsetY: 14,
    shadowOpacity: 0.5,
    fadeTop: 0.05,
    fadeBottom: 0.05,
    hasTransition: false,
    scroll: false,
    scrollDecay: 350
};

const propSettings =
    {
        bgColor: 'color',
        minOpacity: [0, 1],
        maxOpacity: [0, 1],
        shadowOpacity: [0, 1],
        shadowBlur: [0, 30],
        shadowOffsetX: [-20, 20],
        shadowOffsetY: [-20, 20],
        borderRadius: [0, 20],
        borderColor: 'color',
        borderOpacity: [0, 1],
        outlineOpacity: [0, 1],
        outlineColor: 'color',
        outlineWidth: [0, 20],
        fadeTop: [0, 1],
        fadeBottom: [0, 1],
        hasTransition: true,
        scroll: true,
        scrollDecay: [0, 2000]
    };

GlassPane.propTypes = propTypes;
GlassPane.defaultProps = defaultProps;

export {GlassPane as default, propSettings, defaultProps};