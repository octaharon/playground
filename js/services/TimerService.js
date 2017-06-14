import _ from 'underscore';
import Utils from '../utils';

/**
 * This class provides single-pipeline self-adjusting timer bound to animation frames. Maximum repetition frequency is 100Hz
 * This timer is not ticking while the browser tab is inactive
 * All bound callbacks are happening simultaneously, as well as page updates
 */
class TimerService {
    constructor() {
        let fps = 100;
        this._timers = {};
        this._timerValue = 0;
        this._internalInterval = 1000 / fps;
        this._maxInterval = 0;
        this._timerStart = Date.now();
        for (let method of ['set', 'clear', '_rotate', '_callbacks'])
            this[method] = this[method].bind(this);
        setTimeout(this._rotate, Math.round(this._internalInterval));
    }

    _setMaxInterval() {
        return this._maxInterval = _.max(_.pluck(this._timers, 'interval'));
    }

    _rotate() {
        requestAnimationFrame(function () {
            this._timerValue += this._internalInterval;
            let diff = (Date.now() - this._timerStart) - this._timerValue;
            this._callbacks();
            setTimeout(this._rotate, Math.max(Math.round(this._internalInterval - diff), 0));

            if (this._timerValue > this._maxInterval) {
                this._timerValue -= this._maxInterval;
                this._timerStart = Date.now() - this._timerValue;
            }
        }.bind(this));
    }

    _callbacks() {
        let toCall = [];
        let epsilon = 0.01;
        _.each(this._timers, function (timer) {
            if (Utils.closestFraction(this._timerValue - timer.interval / 10, timer.interval) - this._timerValue < epsilon)
                toCall.push(timer.callback);
        }.bind(this));
        if (toCall.length)
            toCall.forEach(f => f.call());
    }


    /**
     * Public methods
     */
    /**
     * @param interval multiple of 10
     * @param callback
     * @return timer_id|false
     */
    set(callback, interval) {
        if (!(callback instanceof Function))
            return false;
        let uniq = 'timer_' + (new Date()).getTime();
        this._timers[uniq] = {
            callback,
            interval: Utils.closestFraction(interval - this._internalInterval / 10, this._internalInterval),
            offset: this._timerValue
        };
        this._setMaxInterval();
        return uniq;
    }


    /**
     * @param timer_id|true for all timers clearance
     * @returns {boolean} true if timer has been cleared
     */
    clear(timer_id) {
        if (timer_id === true) {
            Object.keys(this._timers).forEach((id) => (delete this._timers[id]));
            return true;
        }
        if (this._timers[timer_id] === undefined)
            return false;
        delete this._timers[timer_id];
        this._setMaxInterval();
        return true;
    }
}

let Timer = new TimerService();

export default Timer;