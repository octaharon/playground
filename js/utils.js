class Utilities {
    closestFraction(largerThan, dividesBy) {
        let epsilon = 0.0001;
        let division = largerThan / dividesBy;
        let modulo = division - Math.floor(division);
        if (modulo < epsilon)
            return Math.round(Math.ceil(largerThan + dividesBy) / epsilon) * epsilon;
        return Math.round(Math.ceil(division) * dividesBy / epsilon) * epsilon;
    }
}

let Utils = new Utilities();

export default Utils;