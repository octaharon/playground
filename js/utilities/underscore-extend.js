import _ from 'underscore';

_.mixin({
    keysWhere: function (object, predicate) {
        let comparator = predicate;
        if (!_.isFunction(predicate)) {
            if (_.isObject(predicate))
                comparator = val => _.isMatch(val, predicate);
            else
                comparator = val => val === predicate;
        }
        if (!_.isObject(object))
            return object;
        let ret = [];
        Object.keys(object).forEach(key => {
            if (comparator(object[key]) !== false)
                ret.push(key);
        });
        return ret;
    }
});

export default _;