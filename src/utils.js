// VRes stands for Validation Result. Used for extending failure messages with useful context and reducing stack trace noise.
class VRes {
    constructor(message = undefined) {
        this.message = message;
    }
    thenThrow(message) {
        if (this.message) {
            throw new Error(`${message}: ${this.message}`);
        }
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
