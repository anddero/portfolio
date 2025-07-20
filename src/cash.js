class CashHolding {
    #currency;
    #value;
    #history; // Array of CashChangeRecord objects.

    constructor(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        this.#currency = currency;
        this.#value = new Decimal(0);
        this.#history = [];
    }

    getCurrency() {
        return this.#currency;
    }

    getCurrentValue() {
        return this.#value;
    }

    getCode() {
        return this.getCurrency();
    }

    getFriendlyName() {
        return this.getCurrency();
    }

    updateValue(diff, date) {
        let warnings = [];
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#value = this.#value.plus(diff);
        this.#history.push(new CashChangeRecord(date, diff));
        if (this.#value.lessThan(0)) {
            warnings.push(`Cash "${this.#currency}" value ${this.#value} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    validate() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#value);
    }

    getCashChangeSum() {
        return getHistoryFieldSum(this.#history, 'valueChange');
    }

    getHistoryTableView() {
        return getCashHistoryTableView(this.#history);
    }
}

