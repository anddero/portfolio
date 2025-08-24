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
     * Do something with the value if the VRes if it's a success.
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

    isFail() {
        return this.isFailure;
    }

    isSuccess() {
        return !this.isFailure;
    }

    getValue() {
        if (this.isFailure) {
            throw new Error('VRes is a failure, cannot get value');
        }
        return this.value;
    }

    getMessage(log = false) {
        if (!this.isFailure) {
            throw new Error('VRes is a success, cannot get message');
        }
        if (log) {
            console.error(this.message);
        }
        return this.message;
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

function validateIndexInRange(value, min, maxExclusive) {
    // Validate that the value is a JS integer.
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return new VRes('Not a JS integer');
    }
    // Validate that the value is in the range [min, max].
    if (value < min) {
        return new VRes(`Less than ${min}`);
    }
    if (value >= maxExclusive) {
        return new VRes(`Greater or equal to ${maxExclusive}`);
    }
    return new VRes();
}

function validateConcreteDecimal(value) {
    if (!(value instanceof Decimal)) {
        return new VRes('Not a Decimal');
    }
    if (value.isNaN()) {
        return new VRes('NaN');
    }
    if (!value.isFinite()) {
        return new VRes('Not finite');
    }
    return new VRes(value);
}

function validateNonZeroConcreteDecimal(value) {
    return validateConcreteDecimal(value)
        .and(() => {
            if (value.isZero()) {
                return new VRes('Zero');
            }
            return new VRes();
        });
}

function validatePositiveConcreteDecimal(value) {
    return validateNonZeroConcreteDecimal(value)
        .and(() => {
            if (!value.isPositive()) {
                return new VRes('Not positive');
            }
            return new VRes();
        });
}

function validateNegativeConcreteDecimal(value) {
    return validateNonZeroConcreteDecimal(value)
        .and(() => {
            if (!value.isNegative()) {
                return new VRes('Not negative');
            }
            return new VRes();
        });
}

function validateDate(value) {
    if (!(value instanceof Date)) {
        return new VRes('Not a Date');
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
        const assetNameRegex = /^[a-zA-Z0-9 .%-]+$/;
        if (!assetNameRegex.test(assetName)) {
            return new VRes(`Allowed symbols are (a-z A-Z 0-9 space . % -)`);
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

/**
 * Convert a year-month-day combination into a Date object.
 * @param year {number} The year.
 * @param month {number} The month (1-12).
 * @param day {number} The day (1-31).
 * @returns {VRes} A VRes holding a Date object if valid, or an error message if invalid.
 */
function makeDate(year, month, day) {
    validateConcreteInt(year).getOrThrow('year');
    validateIntInRange(month, 1, 12).getOrThrow('month');
    validateIntInRange(day, 1, 31).getOrThrow('day');
    const dateObj = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript Date

    // Check if the date is valid (e.g., not 2023.02.31)
    if (dateObj.getDate() !== day ||
        dateObj.getMonth() + 1 !== month ||
        dateObj.getFullYear() !== year) {
        return new VRes(`Date does not exist in calendar`);
    }
    return new VRes(dateObj);
}

// Validate that the date string in format "YYYY.MM.DD" has correct format and is a valid date.
// Return a VRes with a Date object if valid.
function parseDateInput(dateStr) {
    let validateRegex = () => {
        // Check date format YYYY.MM.DD
        const dateRegex = /^(\d{4})\.(\d{2})\.(\d{2})$/;
        const dateMatch = dateStr.match(dateRegex);
        if (!dateMatch) {
            return new VRes(`Expected format YYYY.MM.DD`);
        }

        // Validate that the date is a valid date
        const year = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10);
        const day = parseInt(dateMatch[3], 10);
        return makeDate(year, month, day);
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

function formatLocalDateForView(date) {
    if (!(date instanceof Date)) {
        throw new Error('Not a Date');
    }
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${date.getFullYear()} ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Get the date part of a Date object (year, month, day) as an object.
 * @param date {Date} The Date object to get the date part from.
 * @returns {{year: number, month: number, day: number}} An object containing the year, month, and day.
 */
function getLocalDate(date) {
    if (!(date instanceof Date)) {
        throw new Error('Not a Date');
    }
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // Months are 0-indexed in JavaScript Date
        day: date.getDate()
    };
}

/**
 * Count the days from a to b. Both a and b will be converted to local time first and then compared, considering only
 * the date and not the exact time.
 * @param a {Date} A timestamp.
 * @param b {Date} A timestamp.
 * @returns {number} The number of days between a and b as an integer.
 */
function countDays(a, b) {
    if (!(a instanceof Date) || !(b instanceof Date)) {
        throw new Error('Not a Date');
    }
    if (b < a) {
        throw new Error('b must be greater than a');
    }
    if (b === a) {
        return 0;
    }
    const aLocalDatePart = getLocalDate(a);
    const bLocalDatePart = getLocalDate(b);
    const aDate = makeDate(aLocalDatePart.year, aLocalDatePart.month, aLocalDatePart.day).getOrThrow('aLocalDatePart');
    const bDate = makeDate(bLocalDatePart.year, bLocalDatePart.month, bLocalDatePart.day).getOrThrow('bLocalDatePart');
    // Get the difference between the dates in whatever unit JS gives us
    const diff = bDate - aDate;
    // JS unit is milliseconds, so convert to days and round to the nearest integer
    return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the XIRR (Extended Internal Rate of Return) based on the given cash flow.
 * @param {Array} dateAndCashFlowPairs An array of arrays, where each inner array contains two elements:
 *                                     the date (as a Date object) and the cash flow amount (as a Decimal).
 *                                     The ordering of the pairs is irrelevant.
 *                                     The cash flow amount should be negative for cash outflows (investments)
 *                                     and positive for cash inflows (returns).
 * @throws {Error} On input type errors.
 * @returns {VRes} The VRes holding a XIRR as a Decimal (e.g., 0.1 for 10%), or an error if XIRR could not be calculated.
 */
function calculateXirr(dateAndCashFlowPairs) {
    // Internal API usage validation
    if (!Array.isArray(dateAndCashFlowPairs)) {
        throw new Error('dateAndCashFlowPairs must be an array');
    }
    dateAndCashFlowPairs.forEach(pair => {
        if (!Array.isArray(pair) || pair.length !== 2) {
            throw new Error('Each pair must be an array with exactly two elements');
        }
        if (!(pair[0] instanceof Date)) {
            throw new Error('First element of each pair must be a Date object');
        }
        if (!(pair[1] instanceof Decimal)) {
            throw new Error('Second element of each pair must be a Decimal object');
        }
    });

    // Sort pairs by date
    dateAndCashFlowPairs = dateAndCashFlowPairs.toSorted((pair1, pair2) => pair1[0] - pair2[0]);

    // Data validation (expected failures)
    if (dateAndCashFlowPairs.length < 2) {
        return new VRes('At least two values are required for XIRR calculation');
    }

    // Workaround for a bug where XIRR breaks if the last value is 0 (which shouldn't affect the actual outcome)
    if (dateAndCashFlowPairs[dateAndCashFlowPairs.length - 1][1].isZero()) {
        dateAndCashFlowPairs.pop();
    }

    // Prepare cash flows for XIRR calculation as array
    const cashFlows = dateAndCashFlowPairs.map(pair => pair[1].toNumber());
    const dates = dateAndCashFlowPairs.map(pair => pair[0]);

    let result = null;
    try {
        result = formulajs.XIRR(cashFlows, dates);
    } catch (error) {
        return new VRes(`XIRR calculation failed: ${error.message}`);
    }

    if (result === null) {
        return new VRes('XIRR result null');
    }
    if (typeof result !== 'number') {
        return new VRes('XIRR result not a number');
    }
    if (Number.isNaN(result)) {
        return new VRes('XIRR result NaN');
    }
    if (!Number.isFinite(result)) {
        return new VRes('XIRR result not finite');
    }
    return new VRes(new Decimal(result));
}

/**
 * Run a binary search to find a root of a continuous mathematical function in range [lowerBound, upperBound].
 * It's not guaranteed that a root is found even if it exists.
 * @param lowerBound {number} The lower bound of the search range.
 * @param upperBound {number} The upper bound of the search range.
 * @param budget {number} The maximum number of y=fn(x) evaluations to perform before giving up. It is more of a
 *                        guideline to limit segmentation of the search range. If a segment with a root has already
 *                        been found, then the binary search will be finished even if it exceeds the budget.
 * @param delta {number} The maximum absolute error to determine when to stop the convergence.
 * @param fn {number} A potentially heavy function y=fn(x) to check the y value at a given x.
 * @returns {number} The numeric value (x: |fn(x)| <= delta) found in the search range or NaN if out of budget.
 */
function findAnyRoot(lowerBound, upperBound, budget, delta, fn) {
    let segments = 2;
    for (let i = 0; i < 100; ++i) {
        if (segments > budget) {
            return NaN;
        }
        const crossing = findZeroCrossing(lowerBound, upperBound, segments, fn);
        budget -= segments;
        if (crossing === null) {
            segments *= 2;
            continue;
        }
        const binarySearch = new BinarySearch(crossing.a, crossing.b);
        for (let j = 0; j < 1000; ++j) {
            const m = binarySearch.getMid();
            const y_a = fn(binarySearch.getLowerBound());
            const y_m = fn(m);
            const y_b = fn(binarySearch.getUpperBound());
            if (Math.abs(y_a) <= delta) {
                return binarySearch.getLowerBound();
            }
            if (Math.abs(y_m) <= delta) {
                return m;
            }
            if (Math.abs(y_b) <= delta) {
                return binarySearch.getUpperBound();
            }
            if (y_a * y_m < 0) {
                binarySearch.shrink(false);
            } else if (y_m * y_b < 0) {
                binarySearch.shrink(true);
            }
        }
        throw new Error('Binary search did not complete in 1000 iterations');
    }
    return NaN;
}

/**
 * Divide a function into linear segments and find the left-most segment that crosses 0. The segments are linear
 * approximations, thus any segment might not contain a root, or might contain fewer roots, than the actual function.
 * @param lowerBound {number} The lower bound of the search range.
 * @param upperBound {number} The upper bound of the search range.
 * @param nSegments {number} The number of segments to divide the search range into.
 * @param fn {number} A potentially heavy function y=fn(x) to check the y value at a given x. The function makes
 *                    at most (nSegments + 1) evaluations.
 * @returns {{a: number, b: number} | null} A segment [a, b] that crosses fn value 0. May be null.
 */
function findZeroCrossing(lowerBound, upperBound, nSegments, fn) {
    const segmentLength = (upperBound - lowerBound) / nSegments;
    let x = lowerBound;
    let y = fn(x);
    for (let i = 0; i < nSegments; ++i) {
        const x2 = x + segmentLength;
        const y2 = fn(x2);
        if (y * y2 < 0) {
            return { a: x, b: x2 };
        }
        x = x2;
        y = y2;
    }
    return null;
}

/**
 * Run a binary search to find a numeric value in range [lowerBound, infinity).
 * @param lowerBound The absolute lower bound of the search range.
 * @param upperBound The initial upper bound of the search range which can be expanded.
 * @param fnTransform A potentially heavy function to transform the guessed number from the binary search range into a
 *                    comparable number for evaluation. The target of the search is to converge this number towards 0.
 *                    A higher absolute value of the transformed number signals wandering away from the target.
 *                    A lower absolute value of the transformed number signals convergence towards the target.
 *                    The transform function should be weakly monotonic, but the direction is irrelevant.
 *                    The search is started at the lower bound, which should have a discrete transform value.
 * @param fnDone A function to check the transformed number and decide whether to stop the search.
 * @returns {number} The numeric value found in the search range. Or NaN if the search doesn't converge.
 */
function runPositiveExponentialBinarySearch(lowerBound, upperBound, fnTransform, fnDone) {
    const binarySearch = new BinarySearch(lowerBound, upperBound);
    let prevV = lowerBound;
    let prevT = fnTransform(lowerBound);
    let expanding = true; // Start by expanding the search range
    for (let i = 0; i < 10000; ++i) {
        // Check for done condition
        if (fnDone(prevT)) {
            return prevV;
        }
        // Get the next guess and transform
        const nextV = binarySearch.getMid();
        const nextT = fnTransform(nextV);
        let directionUp = nextV > prevV;
        // Check if the transform sign changed, which signals stepping over target
        if (prevT * nextT < 0.0) {
            // If we step over target, start shrinking and look back in the opposite direction
            directionUp = !directionUp;
            expanding = false;
        }
        // Check if the transform increased, which signals wandering away from the target
        else if (Math.abs(nextT) > Math.abs(prevT)) {
            return NaN; // Wandering away means no convergence possible, because we always know the direction.
        }
        // Update state
        if (expanding) {
            binarySearch.expand(directionUp);
        } else {
            binarySearch.shrink(directionUp);
        }
        prevV = nextV;
        prevT = nextT;
    }
}

class BinarySearch {
    #lowerBound;
    #upperBound;

    constructor(lowerBound, upperBound) {
        this.#lowerBound = lowerBound;
        this.#upperBound = upperBound;
    }

    length() {
        return this.#upperBound - this.#lowerBound;
    }

    getMid() {
        return this.#lowerBound + this.length() / 2.0;
    }

    getLowerBound() {
        return this.#lowerBound;
    }

    getUpperBound() {
        return this.#upperBound;
    }

    shrink(up) {
        if (up) {
            this.#lowerBound = this.getMid();
        } else {
            this.#upperBound = this.getMid();
        }
    }

    expand(up) {
        const newLength = this.length() * 2.0;
        if (up) {
            this.#lowerBound = this.getMid();
            this.#upperBound = this.#lowerBound + newLength;
        } else {
            this.#upperBound = this.getMid();
            this.#lowerBound = this.#upperBound - newLength;
        }
    }
}

const doOnceMap = new Set();

function doOnce(key, callback) {
    if (doOnceMap.has(key)) {
        return;
    }
    doOnceMap.add(key);
    callback();
}
