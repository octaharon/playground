require('./CarouselSelector.scss');

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from '../../utilities/proptypes-extend';
import _ from '../../utilities/underscore-extend';
import d3 from '../../d3-lib';
import * as d3_live from 'd3-selection';

import Utils from '../../utils';

let propTypes =
    {
        options: PropTypes.arrayOf(PropTypes.literal).isRequired,
        value: PropTypes.literal,
        onChange: PropTypes.func.isRequired
    };

class CarouselSelector extends React.Component {

    constructor(props) {
        super(props);
        if (!props.options.length)
            throw 'Empty values array';
        this.state = {
            options: [],
            selectedIndex: 0,
            itemWidth: 0,
            consecutiveClickCount: 0
        };
        [
            '_scrollLeft',
            '_scrollRight',
            '_scrollTo',
            '_redraw',
            '_prepare',
            '_updateValue',
            '_getScrollPosition',
            '_getScrollValue',
            '_getScrollStyle',
            '_interpolateScroll'
        ].forEach(method => this[method] = this[method].bind(this));
    }

    componentDidUpdate() {
        this._redraw();
    }


    componentWillMount() {
        this.setState(this._prepare());
    }

    componentWillReceiveProps(nextProps) {
        if (
            !Utils.compareObjectProps(
                _.omit(this.props, 'value'),
                _.omit(nextProps, 'value'))
            ||
            (nextProps.value != this.state.options[this.state.selectedIndex])
        )
            this.setState(this._prepare(nextProps.value, nextProps.options));
    }


    shouldComponentUpdate(nextProps, nextState) {
        let excludeStateKeys = ['selectedIndex', 'consecutiveClickCount'];
        return !Utils.compareObjectProps(
            _.omit(this.state, excludeStateKeys),
            _.omit(nextState, excludeStateKeys));
    }


    componentDidMount() {
        this.__container = ReactDOM.findDOMNode(this);
        this.__itemsList = d3.select(this.__container).select('.switch-selector__body');
        this._redraw();
    }

    componentWillUnmount() {
        this.__itemsList.on('.drag', null);
        delete this['__itemList'];
        delete this['__container'];
    }

    _prepare(currentValue = this.props.value, options = this.props.options) {
        let optionArray = options.slice(0);
        let l = optionArray.length, r = 0;
        while (optionArray[0] != currentValue && r++ <= l) {
            let firstValue = optionArray[0];
            optionArray = optionArray.slice(1);
            optionArray.push(firstValue);
        }
        optionArray.unshift(optionArray[l - 1]);
        return {
            options: optionArray,
            itemWidth: parseFloat((100 / optionArray.length).toPrecision(4)),
            selectedIndex: 1,
            consecutiveClickCount: 0
        };
        //debugger;
    }

    _redraw() {
        let _self = this,
            dragX,
            dragWidth = parseInt(Utils.getActualStyle(_self.__itemsList.node(), 'width')),
            dragCoefficient = dragWidth / _self.state.options.length;
        _self.__itemsList.on('.drag', null);
        _self.__itemsList.style('opacity', 1).style('transform', _self._getScrollPosition());
        _self.__itemsList.call(d3.drag()
                                 .on("start", function () {
                                     let ev = d3_live.event;
                                     ev.sourceEvent.stopPropagation();
                                     ev.sourceEvent.preventDefault();
                                     dragX = 0;
                                 })
                                 .on('drag', function () {
                                     let ev = d3_live.event;
                                     if (!_self.__container.contains(ev.sourceEvent.target)) {
                                         ev.on('end')();
                                         ev.on('drag end', null);
                                         return false;
                                     }
                                     dragX += ev.dx;
                                     let offset = dragX / dragCoefficient * _self.state.itemWidth;
                                     requestAnimationFrame(function () {
                                         _self.__itemsList.style(
                                             'transform',
                                             _self._getScrollStyle(_self._getScrollValue(_self.state.selectedIndex) - offset));
                                     });
                                 })
                                 .on('end', function () {
                                     if (dragX == 0)
                                         return true;
                                     let offset = dragX / dragCoefficient,
                                         startPos = Utils.fitInRange(_self.state.selectedIndex - offset, 0, _self.state.options.length - 1);
                                     if (offset < 0) {
                                         _self._scrollRight(startPos);
                                     }
                                     else {
                                         _self._scrollLeft(startPos)
                                     }
                                     dragX = 0;
                                 }));
    }

    _interpolateScroll(a, b, t) {
        let pos = this._getScrollValue(a) * (1 - t) + this._getScrollValue(b) * t;
        return this._getScrollStyle(pos);
    }

    _getScrollStyle(pos) {
        pos = Math.round(pos * 10e+3) / 10e+3;
        return `translateX(-${pos}%)`;
    }

    _getScrollValue(index) {
        return this.state.itemWidth * index;
    }

    _getScrollPosition(index = this.state.selectedIndex) {
        return this._getScrollStyle(this._getScrollValue(index));
    }

    _scrollLeft(from = null) {
        let _self = this;
        _self.setState({
            consecutiveClickCount: _self.state.consecutiveClickCount + 1
        }, function () {
            let l = _self.state.options.length - 1;
            let selectedIndex = (_self.state.selectedIndex - _self.state.consecutiveClickCount + 1) % l;
            if (selectedIndex < 0)
                selectedIndex += l;
            let index = selectedIndex <= 0 ? l : selectedIndex - 1;
            _self._scrollTo(index, _.isNumber(from) ? from : selectedIndex);
        });

    }

    _scrollRight(from = null) {
        let _self = this;
        _self.setState({
            consecutiveClickCount: _self.state.consecutiveClickCount + 1
        }, function () {
            let l = _self.state.options.length - 1;
            let selectedIndex = (_self.state.selectedIndex + _self.state.consecutiveClickCount - 1) % l;
            if (selectedIndex < 0)
                selectedIndex += l;
            let index = selectedIndex >= l ? 0 : selectedIndex + 1;
            _self._scrollTo(index, _.isNumber(from) ? from : selectedIndex);
        });
    }

    _updateValue(value) {
        let l = this.state.options.length;
        let val = this.state.options[Utils.fitInRange(value, 0, l - 1)];
        let self = this;
        this.setState(
            self._prepare(val), function () {
                if (self.props.onChange instanceof Function)
                    self.props.onChange(val);
            });

    }


    _scrollTo(index, oldIndex = null) {
        let l = this.state.options.length - 1;
        if (l <= 2)
            return false;
        switch (true) {
            case index === 0 && oldIndex === l:
                return this._scrollTo(1, 0);
            case index === l && oldIndex === 0:
                return this._scrollTo(l - 1, l);
        }
        this.__itemsList.interrupt().transition()
            .duration(200)
            .ease(d3.easeSin)
            .styleTween('transform', dummy => this._interpolateScroll.bind(this, oldIndex, index))
            .on('end', dummy => this._updateValue(index));
    }

    render() {
        if (this.__itemsList)
            this.__itemsList.interrupt();
        let options = this.state.options.map((option, index) => (
            <div className="switch-selector__body-item" key={`${index}-${option}`} style={{
                width: this.state.itemWidth + '%'
            }}>
                {option}
            </div>
        ));
        return (
            <div className="switch-selector">
                <div className="switch-selector__left" onClick={this._scrollLeft}><i className="fa fa-angle-left"/>
                </div>
                <div className="switch-selector__container">
                    <div className="switch-selector__body" style={{
                        opacity: 0,
                        width: this.state.options.length * 100 + '%',
                        transform: this._getScrollPosition(this.state.selectedIndex)
                    }}>
                        {options}
                    </div>
                </div>
                <div className="switch-selector__right" onClick={this._scrollRight}><i className="fa fa-angle-right"/>
                </div>
            </div>
        )
    }

}

CarouselSelector.propTypes = /* remove-proptypes */ propTypes;

export default CarouselSelector;