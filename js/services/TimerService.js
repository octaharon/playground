import _ from 'underscore';


/**
 * This class provides single-pipeline timer with simultaneous iterations. Maximum repetition frequency is 100Hz
 */
class TimerService {
    constructor() {
        this.timers = {};
        this.timerValue = 0;
        this.internalInterval = 10;
        this.maxInterval = 0;
        this.set = this.set.bind(this);
        this.clear = this.clear.bind(this);
        setInterval(this.rotate.bind(this), this.internalInterval);
    }

    setMaxInterval() {
        return this.maxInterval = _.max(_.pluck(this.timers, 'interval'));
    }

    /**
     *
     * @param interval multiple of 10
     * @param callback
     */
    set(callback, interval) {
        if (!(callback instanceof Function))
            return false;
        let uniq = 'timer_' + (new Date()).getTime();
        this.timers[uniq] = {
            callback,
            interval: Math.ceil(interval / this.internalInterval) * this.internalInterval,
            offset: this.timerValue
        };
        this.setMaxInterval();
        return uniq;
    }


    rotate() {
        this.timerValue += this.internalInterval;
        if (this.timerValue > this.maxInterval)
            this.timerValue = 0;
        _.each(this.timers, function (timer) {
            if ((this.timerValue - timer.offset) % timer.interval)
                timer.callback();
        }.bind(this));
    }

    clear(id) {
        if (this.timers[id] !== undefined)
            return false;
        delete this.timers[id];
        this.setMaxInterval();
        return true;
    }
}

let Timer = new TimerService();

export default Timer;