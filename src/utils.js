// VRes stands for Validation Result. Used for extending failure messages with useful context and reducing stack trace noise.
class VRes {
    constructor(message = undefined) {
        this.message = message;
    }
    orThrow(message = undefined) {
        if (this.message) {
            if (message) {
                throw new Error(`${message}: ${this.message}`);
            }
            throw new Error(this.message);
        }
        return this;
    }
    and(callback) {
        if (this.message) {
            return this;
        }
        return callback();
    }
    extend(message) {
        if (this.message) {
            this.message = `${message}: ${this.message}`;
        }
        return this;
    }
}

function validateNonBlankString(value) {
    if (typeof value !== 'string') {
        return new VRes('Not a string');
    }
    if (value.trim() === '') {
        return new VRes('Blank string');
    }
    return new VRes();
}

function validateConcreteInt(value) {
    if (typeof value !== 'number') {
        return new VRes('Not a number');
    }
    if (Number.isNaN(value)) {
        return new VRes('NaN');
    }
    if (!Number.isFinite(value)) {
        return new VRes('Not finite');
    }
    if (!Number.isInteger(value)) {
        return new VRes('Not an integer');
    }
    return new VRes();
}

function validateIntInRange(value, min, max) {
    let validateRange = () => {
        if (value < min) {
            return new VRes(`Less than ${min}`);
        }
        if (value > max) {
            return new VRes(`Greater than ${max}`);
        }
        return new VRes();
    };
    return validateConcreteInt(value).and(validateRange);
}

function validateNonZeroConcreteDecimal(value) {
    if (!(value instanceof Decimal)) {
        return new VRes('Not a Decimal');
    }
    if (value.isNaN()) {
        return new VRes('NaN');
    }
    if (!value.isFinite()) {
        return new VRes('Not finite');
    }
    if (value.isZero()) {
        return new VRes('Zero');
    }
    return new VRes();
}
