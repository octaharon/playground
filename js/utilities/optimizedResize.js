/**
 * @source https://developer.mozilla.org/en-US/docs/Web/Events/resize
 * @callback {{add}}
 */
let optimizedResize = (function () {

    let callbacks = [],
        running = false;

    // fired on resize event
    function resize() {

        if (window.requestAnimationFrame) {
            if (running)
                window.cancelAnimationFrame(running);
            running = window.requestAnimationFrame(runCallbacks);
        } else {
            running = false;
            setTimeout(runCallbacks, 20);
        }

    }

    // run the actual callbacks
    function runCallbacks() {

        callbacks.forEach(function (callback) {
            callback();
        });

        running = false;
    }

    // adds callback to loop
    function addCallback(callback) {

        if (callback) {
            callbacks.push(callback);
        }

    }

    return {
        // public method to add additional callback
        add: function (callback) {
            if (!(callback instanceof Function))
                return false;
            if (!callbacks.length) {
                window.addEventListener('resize', resize);
            }
            addCallback(callback);
            return true;
        }
    }
}());


export default optimizedResize;