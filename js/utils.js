

require('./utilities/requestAnimationFrame-polyfill');
require('./utilities/objectValues-polyfill');
require('custom-event-polyfill');

import Wheel from 'wheel';

import _ from './utilities/underscore-extend';
import optimizedResize from './utilities/optimizedResize';

const transitionEvents = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'MSTransition': 'msTransitionEnd',
    'OTransition': 'oTransitionEnd',
};


class Utilities {
    constructor() {
        this._resizeHandler = optimizedResize;
    }

    /**
     * crop the value to given range
     * @param value float|int
     * @param from float|int
     * @param to float|int
     * @returns {Number|*}
     */
    fitInRange(value, from, to) {
        value = parseFloat(value);
        from = parseFloat(from);
        to = parseFloat(to);
        if (from > to) {
            from -= to;
            to += from;
            from = to - from;
        }
        return (value < from) ? from : ((value > to) ? to : value);
    }

    closestFraction(largerThan, dividesBy) {
        let epsilon = 0.0001;
        let division = largerThan / dividesBy;
        let modulo = division - Math.floor(division);
        if (modulo < epsilon)
            return Math.round(Math.ceil(largerThan + dividesBy) / epsilon) * epsilon;
        return Math.round(Math.ceil(division) * dividesBy / epsilon) * epsilon;
    }

    addResizeListener(cbFunction) {
        if (cbFunction instanceof Function)
            return this._resizeHandler.add(cbFunction);
        return false;
    }

    /**
     *
     * @param element
     * @param cbFunction (event)
     * @returns boolean
     */
    addWheelListener(element = window, cbFunction) {
        if (cbFunction instanceof Function) {
            Wheel.addWheelListener(element, cbFunction, true);
            return true;
        }
        return false;
    }

    removeWheelListener(element = window, cbFunction) {
        Wheel.removeWheelListener(element, cbFunction)
    }

    getActualStyle(el, styleProp) {
        let x = (typeof el == 'string') ? document.getElementById(el) : el;
        if (x.currentStyle)
            return x.currentStyle[styleProp];
        else if (window.getComputedStyle)
            return document.defaultView.getComputedStyle(x, null).getPropertyValue(styleProp);
        return null;
    }

    getMouseEventOffset(e) {
        e = e || window.event;

        let target = e.target || e.srcElement,
            borderLeftWidth = parseInt(this.getActualStyle(target, 'border-left-Width'), 10),
            borderTopWidth = parseInt(this.getActualStyle(target, 'border-top-Width'), 10),
            rect = target.getBoundingClientRect(),
            offsetX = e.clientX - borderLeftWidth - rect.left,
            offsetY = e.clientY - borderTopWidth - rect.top;
        return {
            offsetX,
            offsetY
        };
    }

    getInnerSize(element) {
        return {
            width: parseFloat(this.getActualStyle(element, 'width')),
            height: parseFloat(this.getActualStyle(element, 'height'))
        };
    }

    getViewportSize() {
        let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        return {width, height};
    }

    whichTransitionEvent() {
        let t;
        let el = document.createElement('fakeelement');

        for (t in transitionEvents) {
            if (el.style[t] !== undefined) {
                return transitionEvents[t];
            }
        }
    }

    toComparable(v) {
        if (_.isNull(v) || _.isUndefined(v))
            return v;
        if (_.isFunction(v) || _.isArray(v))
            return v.toString();
        if (_.isObject(v))
            if (_.isUndefined(v['$$typeof']))
                return JSON.stringify(v);
            else
                return v.key;
        return v.toString();
    }

    compareObjectProps(oldProps, newProps, withChildren = false) {
        let k = Object.keys(newProps),
            l = k.length,
            i = 0,
            mapChildren = v => _.isArray(v) ? v.map(mapChildren) : v.key;
        for (i = 0; i < l; i++) {
            if (k[i] == 'children') {
                if (!withChildren)
                    continue;
                if (_.isArray(oldProps.children) && _.isArray(newProps.children)) {
                    if (!_.isEqual(oldProps.children.map(mapChildren), newProps.children.map(mapChildren)))
                        return false;
                    else
                        continue;
                }
                else if (_.isArray(oldProps.children) ^ _.isArray(newProps.children))
                    return false;
            }
            if (this.toComparable(oldProps[k[i]]) !== this.toComparable(newProps[k[i]])
            )
                return false;

        }
        return true;
    }

    getAllTransitionEvents() {
        return Object.values(transitionEvents).join(' ');
    }


}

let
    Utils = new Utilities();

export
default
Utils;