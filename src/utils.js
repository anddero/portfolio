/**
 * VRes stands for Validation Result. Used for extending failure messages with useful context and reducing stack trace noise.
 * Can also hold a return value.
 **/
class VRes {
    /**
     * If no parameters are given, or if the value is anything other than a string, the VRes is always considered
     * a success, regardless of isFailure flag.
     * If the value is a string, it is considered a failure by default, so set the isFailure flag to false explicitly
     * to indicate a success.
     * @param value Any value.
     * @param isFailure If true, the VRes is considered a failure (value must be string), otherwise a success.
     * @param warnings Optional array of warning messages.
     */
    constructor(value = undefined, isFailure = true, warnings = []) {
        // Check if isFailure is a defined boolean.
        if (typeof isFailure !== 'boolean') {
            throw new Error('isFailure must be a boolean');
        }
        // Check if warnings is an array of strings.
        if (!Array.isArray(warnings) || !warnings.every(w => typeof w === 'string')) {
            throw new Error('Warnings must be an array of strings');
        }
        this.warnings = warnings;
        // Success case.
        if (typeof value !== 'string' || !isFailure) {
            this.message = undefined;
            this.value = value;
            this.isFailure = false;
            return;
        }
        // Failure case, where the value is guaranteed to be a string.
        this.message = value;
        this.value = undefined;
        this.isFailure = true;
    }

    /**
     * Throw with an optional message prefix if the VRes is a failure.
     * Otherwise, return the underlying success value.
     */
    getOrThrow(prefix = undefined, getWithWarnings = false) {
        if (this.isFailure) {
            if (prefix) {
                if (typeof prefix !== 'string') {
                    throw new Error('Prefix must be a string');
                }
                throw new Error(`${prefix}: ${this.message}`);
            }
            throw new Error(this.message);
        }
        if (getWithWarnings) {
            return [this.value, this.warnings];
        }
        if (this.warnings.length > 0) {
            throw new Error("VRes has warnings, but getWithWarnings is false. Use getWithWarnings to retrieve them.");
        }
        return this.value;
    }

    /**
     * Run another validation if the current VRes is a success.
     * @param callback {() => VRes} A validation function that returns a VRes.
     * @returns {VRes} Either current instance or a new instance from the callback.
     */
    and(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        if (this.isFailure) {
            return this;
        }
        const res = callback();
        if (!(res instanceof VRes)) {
            throw new Error('Callback must return a VRes');
        }
        res.warnings = this.warnings.concat(res.warnings);
        return res;
    }

    /**
     * Do something with the value in the VRes if it's a success.
     */
    apply(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        if (this.isFailure) {
            return this;
        }
        callback(this.value);
        return this;
    }

    /**
     * Extend the current failure message with a prefix if it's a failure.
     */
    extend(prefix) {
        validateNonBlankString(prefix).getOrThrow('prefix');
        if (this.isFailure) {
            this.message = `${prefix}: ${this.message}`;
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

function validateMaxStringLength(value, maxLength) {
    validateIntInRange(maxLength, 1, 9999).getOrThrow('maxLength');
    if (typeof value !== 'string') {
        return new VRes('Not a string');
    }
    if (value.length > maxLength) {
        return new VRes(`Length over ${maxLength}`);
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

function validateZeroDecimal(value) {
    if (!(value instanceof Decimal)) {
        return new VRes('Not a Decimal');
    }
    if (!value.isZero()) {
        return new VRes('Not a Zero');
    }
    return new VRes();
}

/**
 * Parse a decimal amount string into a Decimal object.
 * The string should be in format "1234.56", "-0.09", "0,00", "1,2", "49", etc.
 * @param {string} decimalStr The decimal amount string to parse.
 * @param {number} maxDecimals The maximum number of decimal places allowed (between 2 and 10).
 * @param {boolean} isOptional If true, the decimalStr can be undefined, and will return 0.
 */
function parseDecimalInput(decimalStr, maxDecimals, isOptional = false) {
    let parseRegex = () => {
        const regex = new RegExp(`^-?\\d+([.,]\\d{1,${maxDecimals}})?$`);
        if (!regex.test(decimalStr)) {
            return new VRes(`No regex match`);
        }
        return new VRes(new Decimal(decimalStr.replace(',', '.')));
    };
    validateIntInRange(maxDecimals, 2, 10).getOrThrow('maxDecimals');
    if (isOptional && decimalStr === undefined) {
        return new VRes(new Decimal(0));
    }
    return validateNonBlankString(decimalStr).and(parseRegex);
}

function validateAssetCodeInput(assetCode) {
    let validateRegex = () => {
        const assetCodeRegex = /^[a-zA-Z0-9-]+$/;
        if (!assetCodeRegex.test(assetCode)) {
            return new VRes(`Allowed symbols are (a-z A-Z 0-9 -)`);
        }
        return new VRes();
    };
    return validateNonBlankString(assetCode)
        .and(() => validateMaxStringLength(assetCode, 50))
        .and(validateRegex);
}

function validateAssetNameInput(assetName) {
    let validateRegex = () => {
        const assetNameRegex = /^[a-zA-Z0-9 .%]+$/;
        if (!assetNameRegex.test(assetName)) {
            return new VRes(`Allowed symbols are (a-z A-Z 0-9 space . %)`);
        }
        return new VRes();
    };
    return validateNonBlankString(assetName)
        .and(() => validateMaxStringLength(assetName, 50))
        .and(validateRegex);
}

function validatePlatformNameInput(platformName) {
    let validateRegex = () => {
        const platformNameRegex = /^[a-zA-Z]+$/;
        if (!platformNameRegex.test(platformName)) {
            return new VRes(`Allowed symbols are (a-z A-Z)`);
        }
        return new VRes();
    };
    return validateNonBlankString(platformName)
        .and(() => validateMaxStringLength(platformName, 50))
        .and(validateRegex);
}

function validateCurrencyInput(currency) {
    let validateRegex = () => {
        const currencyRegex = /^[A-Z]+$/;
        if (!currencyRegex.test(currency)) {
            return new VRes(`Allowed symbols are (A-Z)`);
        }
        return new VRes();
    };
    return validateNonBlankString(currency)
        .and(() => validateMaxStringLength(currency, 50))
        .and(validateRegex);
}

// Validate that the date string in format "DD.MM.YYYY" has correct format and is a valid date.
// Return a VRes with a Date object if valid.
function parseDateInput(dateStr) {
    let validateRegex = () => {
        // Check date format DD.MM.YYYY
        const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const dateMatch = dateStr.match(dateRegex);
        if (!dateMatch) {
            return new VRes(`Expected format DD.MM.YYYY`);
        }

        // Validate that the date is a valid date
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const year = parseInt(dateMatch[3], 10);
        if (day < 1 || day > 31) {
            return new VRes(`Invalid day`);
        }
        if (month < 1 || month > 12) {
            return new VRes(`Invalid month`);
        }
        const dateObj = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript Date

        // Check if the date is valid (e.g., not 31.02.2023)
        if (dateObj.getDate() !== day ||
            dateObj.getMonth() + 1 !== month ||
            dateObj.getFullYear() !== year) {
            return new VRes(`Date does not exist in calendar`);
        }
        return new VRes(dateObj);
    };
    return validateNonBlankString(dateStr).and(validateRegex);
}

function validateActionInput(inputValue) {
    let validate = () => {
        if (!Object.getOwnPropertyNames(ACTIONS).includes(inputValue)) {
            return new VRes(`Action "${inputValue}" is unknown`);
        }
        return new VRes();
    };
    return validateNonBlankString(inputValue).and(validate);
}

function validateAssetTypeInput(inputValue) {
    let validate = () => {
        if (!ASSET_TYPES.includes(inputValue)) {
            return new VRes(`Asset type "${inputValue}" is unknown`);
        }
        return new VRes();
    };
    return validateNonBlankString(inputValue).and(validate);
}

function validateNotesInput(inputValue) {
    if (typeof inputValue !== "string" && inputValue !== undefined) {
        return new VRes(`Not a string`);
    }
    return new VRes();
}
