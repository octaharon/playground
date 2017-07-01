import * as _PropTypes from 'prop-types';

function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location) {
        componentName = componentName || ANONYMOUS;
        if (props[propName] == null) {
            let locationName = ReactPropTypeLocationNames[location];
            if (isRequired) {
                return new Error(
                    ("Required " + locationName + " `" + propName + "` was not specified in ") +
                    ("`" + componentName + "`.")
                );
            }
            return null;
        } else {
            return validate(props, propName, componentName, location);
        }
    }

    let chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

function isChar(props, propName, ...rest) {
    let componentName = rest.componentName || 'ANONYMOUS';

    if (props[propName]) {
        let value = props[propName];
        if (value.toString && value.toString().length === 1)
            return null;
        else
            return new Error(propName + ' in ' + componentName + " is not a character");
    }

    return null;
}


let PropTypes = Object.assign(_PropTypes, {
    char: createChainableTypeChecker(isChar),
    literal: _PropTypes.oneOfType([_PropTypes.number, _PropTypes.string])
});

export default PropTypes;