import optimizedResize from './utilities/optimizedResize';
import Wheel from 'wheel';

require('./utilities/requestAnimationFrame-polyfill');
require('./utilities/objectValues-polyfill');
require('custom-event-polyfill');


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

        let target = e.currentTarget || e.srcElement,
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

    whichTransitionEvent() {
        let t;
        let el = document.createElement('fakeelement');

        for (t in transitionEvents) {
            if (el.style[t] !== undefined) {
                return transitionEvents[t];
            }
        }
    }

    getAllTransitionEvents() {
        return Object.values(transitionEvents).join(' ');
    }


}

let Utils = new Utilities();

export default Utils;