class CashHolding {
    #currency;
    #value;
    #cashInterestSum;
    #history; // Array of CashChangeRecord objects.

    constructor(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        this.#currency = currency;
        this.#value = new Decimal(0);
        this.#cashInterestSum = new Decimal(0);
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

    updateValue(diff, date, type) {
        let warnings = [];
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#value = this.#value.plus(diff);
        if (type === "CASH_INTEREST") {
            validatePositiveConcreteDecimal(diff).getOrThrow('diff');
            this.#cashInterestSum = this.#cashInterestSum.plus(diff);
        }
        this.#history.push(new CashChangeRecord(date, diff, type));
        if (this.#value.lessThan(0)) {
            warnings.push(`Cash "${this.#currency}" value ${this.#value} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    async validateAndFinalize() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#value);
    }

    getHistoryTableView() {
        const baseTable = getCashHistoryTableView(this.#history);
        // Create summary row to be added at the top
        const summaryRows = [
            ['Interest Cash', this.#cashInterestSum.toString(), '', '', '']
        ];

        return {
            header: baseTable.header,
            body: [...summaryRows, ...baseTable.body],
            type: 'cash-history'
        };
    }
}
