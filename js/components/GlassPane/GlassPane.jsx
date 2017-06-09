require('./GlassPane.scss');

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

let propTypes =
    {
        id: PropTypes.string.isRequired,
        bgColor: PropTypes.string,
        minOpacity: PropTypes.number,
        maxOpacity: PropTypes.number,
        borderRadius: PropTypes.number,
        borderWidth: PropTypes.number,
        borderColor: PropTypes.string,
        borderOpacity: PropTypes.number,
        outlineOpacity: PropTypes.number,
        outlineColor: PropTypes.string
    };

class GlassPane extends React.Component {
    constructor(props) {
        super(props);
        let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        this.internalResolution = {width, height, size: Math.min(width, height)};
    }

    getBodyGradientId() {
        return `body-gradient-${this.props.id}`;
    }

    getGlossFilterId() {
        return `filter-gloss-${this.props.id}`;
    }

    getGlossGradientMaskId() {
        return `filter-gloss-mask-${this.props.id}`;
    }

    getGlossMaskId() {
        return `mask-gloss-${this.props.id}`;
    }

    getBorderGradientId() {
        return `border-gradient-${this.props.id}`;
    }

    getSpecularGradientId() {
        return `specular-gradient-${this.props.id}`;
    }

    getBorderHorizontalGradientId() {
        return `border-gradient-horizontal-${this.props.id}`;
    }

    getBorderVerticalGradientId() {
        return `border-gradient-vertical-${this.props.id}`;
    }

    getBorderShadeGradientId() {
        return `shade-gradient-${this.props.id}`;
    }

    getBorderShadeFilterId() {
        return `shade-filter-${this.props.id}`;
    }

    getNoiseFilterId() {
        return `noise-texture-${this.props.id}`;
    }

    getLightFilterId() {
        return `light-filter-${this.props.id}`;
    }

    getLightMaskId() {
        return `light-mask-${this.props.id}`;
    }

    getBorderTransform() {
        let precision = 10e-4;
        let scaleX = Math.round((this.internalResolution.width - 2 * this.props.borderWidth) / this.internalResolution.width / precision) * precision;
        let scaleY = Math.round((this.internalResolution.height - 2 * this.props.borderWidth) / this.internalResolution.height / precision) * precision;
        let scale = Math.min(scaleX, scaleY);
        return `scale(${Math.max(scaleX, scaleY)})`;
    }


    shouldComponentUpdate(nextProps, nextState) {
        if (this.props == nextProps)
            return false;
        return !(_.isMatch(this.props, nextProps));
    }


    render() {
        return (
            <div className="glass-pane">
                <svg className="glass-pane__background"
                     preserveAspectRatio="none"
                     width='100%'
                     height='100%'
                     viewBox={`0 0 ${this.internalResolution.size} ${this.internalResolution.size}`}>
                    <defs>
                        <linearGradient id={this.getGlossGradientMaskId()} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="white" stopOpacity="0"/>
                            <stop offset="0.5" stopColor="white" stopOpacity="1"/>
                            <stop offset="1" stopColor="white" stopOpacity="0"/>
                        </linearGradient>

                        <mask id={this.getLightMaskId()}>
                            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
                            <circle cx="50%" cy="55%" r="56%" fill="black"/>
                            <rect x="50%" y="0" width="50%" height="100%" fill="black"/>
                            <rect x="0" y="50%" width="50%" height="50%" fill="black"/>
                        </mask>

                        <mask id={this.getGlossMaskId()}>
                            <rect x="0" y="0"
                                  width="100%" height={this.props.borderWidth * 2.5}
                                  fill={`url(#${this.getGlossGradientMaskId()}`}/>
                        </mask>

                        <filter id={this.getNoiseFilterId()}>
                            <feTurbulence type="fractalNoise" baseFrequency="0.75" result="noise"/>
                            <feComposite in="SourceAlpha" in2="noise" operator="in"/>
                            <feComponentTransfer>
                                <feFuncR type="linear" slope="2" intercept="-.5"/>
                                <feFuncG type="linear" slope="2" intercept="-.5"/>
                                <feFuncB type="linear" slope="2" intercept="-.5"/>
                            </feComponentTransfer>
                            <feColorMatrix type="saturate" values="0"/>
                        </filter>

                        <filter id={this.getGlossFilterId()}>
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blurred"/>
                            <feGaussianBlur in="SourceAlpha" stdDeviation={this.props.borderWidth * 2} result="glowed"/>
                            <feBlend in="blurred" in2="glowed" mode="screen"/>
                        </filter>

                        <filter id={this.getBorderShadeFilterId()} height="130%">
                            <feGaussianBlur in="sourceAlpha" stdDeviation={this.props.borderWidth * 1.5}/>
                            <feOffset dx={this.props.borderWidth * 1.5}
                                      dy={this.props.borderWidth}
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

                        <filter id={this.getLightFilterId()}>
                            <feGaussianBlur in="SourceAlpha" stdDeviation={this.props.borderRadius * 3} result="blur1"/>
                            <feSpecularLighting result="specOut" in="blur2"
                                                specularConstant="3" specularExponent="15"
                                                surfaceScale="2"
                                                lightingColor={this.props.borderColor}>
                                {/*<feDistantLight lightingColor={this.props.borderColor} azimuth="45" elevation="15"/>*/}
                                <fePointLight
                                    x={this.internalResolution.size * 1.2}
                                    y={this.internalResolution.size * 1.2}
                                    z={this.internalResolution.size / 5}/>
                            </feSpecularLighting>
                            <feComposite in2="SourceAlpha" in="blur2" operator="in"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope={Math.max(0, 1 - this.props.minOpacity) / 2}/>
                            </feComponentTransfer>
                            <feGaussianBlur result="final" stdDeviation={2 * this.props.borderWidth}/>
                            <feBlend in2="SourceGraphic" in="final" mode="screen"/>

                        </filter>
                        <linearGradient id={this.getBodyGradientId()}
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

                        <linearGradient id={`${this.getBodyGradientId()}-2`}
                                        gradientUnits="objectBoundingBox"
                                        x1="0" y1="0"
                                        x2="100%" y2="0"
                                        gradientTransform="rotate(-60)">
                            <stop offset="0%" stopColor={this.props.bgColor} stopOpacity="0"/>
                            <stop offset="50%" stopColor={this.props.bgColor} stopOpacity="1"/>
                            <stop offset="100%" stopColor={this.props.bgColor} stopOpacity="0"/>
                        </linearGradient >

                        <linearGradient id={this.getBorderGradientId()}>
                            <stop offset="0%" stopColor={this.props.bgColor} stopOpacity="0.0"/>
                            <stop offset="25%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity / 2}/>
                            <stop offset="55%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity}/>
                            <stop offset="75%" stopColor={this.props.outlineColor}
                                  stopOpacity={this.props.outlineOpacity / 2}/>
                            <stop offset="100%" stopColor={this.props.bgColor} stopOpacity="0.0"/>
                        </linearGradient>

                        <radialGradient id={this.getSpecularGradientId()} fx="0%" fy="10%" cx="40%" cy="20%">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0"/>
                            <stop offset="100%" stopColor="#fff" stopOpacity="0.75"/>
                        </radialGradient>

                        <linearGradient id={this.getBorderHorizontalGradientId()}
                                        xlinkHref={`#${this.getBorderGradientId()}`}
                                        gradientUnits="userSpaceOnUse" x1="0" x2="100%" y1="0" y2="0"/>
                        <linearGradient id={this.getBorderVerticalGradientId()}
                                        xlinkHref={`#${this.getBorderGradientId()}`}
                                        gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="100%"/>
                        <linearGradient id={this.getBorderShadeGradientId()}
                                        gradientUnits="userSpaceOnUse"
                                        x1="0" y1="0"
                                        x2="100%" y2="0"
                                        gradientTransform="rotate(240)">
                            <stop offset="0%" stopColor="#4a4a4a" stopOpacity={this.props.borderOpacity}/>
                            <stop offset="21%" stopColor={this.props.borderColor} stopOpacity={this.props.minOpacity}/>
                            <stop offset="50%" stopColor="#505050" stopOpacity={this.props.borderOpacity}/>
                            <stop offset="70%" stopColor={this.props.borderColor}
                                  stopOpacity={this.props.borderOpacity}/>
                            <stop offset="100%" stopColor={this.props.borderColor} stopOpacity={this.props.maxOpacity}/>
                        </linearGradient>
                    </defs>
                    <g className="glass-pane__body" style={
                        {

                            filter: `url(#${this.getLightFilterId()})`
                        }
                    }>
                        <rect width="100%" height="100%" x="0" y="0"
                              rx={this.props.borderRadius}
                              ry={this.props.borderRadius}
                              stroke="none" fill={`url(#${this.getBodyGradientId()})`}

                        />
                        <rect width="100%" height="100%" x="0" y="0"
                              className="glass-pane__body-darker"
                              rx={this.props.borderRadius}
                              ry={this.props.borderRadius}
                              stroke="none" fill={`url(#${this.getBodyGradientId()}-2)`}

                        />
                    </g>
                    <line stroke={`url(#${this.getBorderHorizontalGradientId()})`}
                          y1="0" y2="0" x1="100%" x2="0" strokeWidth={this.props.borderWidth}/>
                    <line stroke={`url(#${this.getBorderHorizontalGradientId()})`}
                          y1="100%" y2="100%" x1="0" x2="100%" strokeWidth={this.props.borderWidth}/>
                    <line stroke={`url(#${this.getBorderVerticalGradientId()})`}
                          y1="100%" y2="0" x1="0" x2="0" strokeWidth={this.props.borderWidth}/>
                    <line stroke={`url(#${this.getBorderVerticalGradientId()})`}
                          y1="0" y2="100%" x1="100%" x2="100%" strokeWidth={this.props.borderWidth}/>
                    <rect className="glass-pane__body-specular" width="100%" height="100%" x="0" y="0"
                          rx={this.props.borderRadius}
                          ry={this.props.borderRadius}
                          stroke="none" fill={`url(#${this.getSpecularGradientId()})`}
                          mask={`url(#${this.getLightMaskId()})`}
                    />
                    <g className="glass-pane__gloss"
                       mask={`url(#${this.getGlossMaskId()})`}
                       transform={`translate(0,${-this.props.borderWidth / 2})`}
                       style={
                           {

                               filter: `url(#${this.getGlossFilterId()})`
                           }
                       }>
                        <circle cx="25%" cy="0" r="20%" fill="#FFF"
                                transform={`scale(1, ${this.props.borderWidth * 12 / this.internalResolution.size})`}/>
                    </g>

                    <rect className="glass-pane__border" transform={this.getBorderTransform()}
                          width="100%" height="100%" x="0" y="0" rx={this.props.borderRadius}
                          ry={this.props.borderRadius}
                          stroke={`url(#${this.getBorderShadeGradientId()})`}
                          fill="none"
                          strokeWidth={this.props.borderWidth}
                          style={
                              {

                                  filter: `url(#${this.getBorderShadeFilterId()})`
                              }
                          }
                    />
                    <rect className="glass-pane__noise"
                          transform={this.getBorderTransform()}
                          width="100%" height="100%" x="0" y="0"
                          rx={this.props.borderRadius}
                          ry={this.props.borderRadius}
                          stroke="none"
                          strokeWidth="0"
                          fill="#000"
                          style={
                              {
                                  transformOrigin: '50% 50%',
                                  filter: `url(#${this.getNoiseFilterId()})`
                              }
                          }
                    />

                </svg>
                <div className="glass-pane__content-holder">
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

GlassPane.propTypes = propTypes;
GlassPane.defaultProps = {
    borderRadius: 15,
    bgColor: '#000',
    borderColor: '#fff',
    borderWidth: 2,
    minOpacity: 0.95,
    borderOpacity: 0.4,
    outlineOpacity: 0.95,
    maxOpacity: 0.75,
    outlineColor: '#c7d8dc'
};

export default GlassPane;