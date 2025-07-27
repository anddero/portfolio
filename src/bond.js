class BondHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #history; // Array of BondChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
        this.#history = [];
    }

    getCode() {
        return this.#code;
    }

    getFriendlyName() {
        return this.#friendlyName;
    }

    getCurrency() {
        return this.#currency;
    }

    getCurrentShares() {
        return this.#shares;
    }

    updateShares(diff, acquiredCash, date, allowZeroDiff, type) {
        let warnings = [];
        if (typeof allowZeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!allowZeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        this.#history.push(new BondChangeRecord(date, diff, acquiredCash, type));
        if (this.#shares.lessThan(0)) {
            warnings.push(`Asset "${this.#friendlyName}" count ${this.#shares} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    validate() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#shares);
    }

    getCashChangeSum() {
        return getHistoryFieldSum(this.#history, 'valueChange');
    }

    getHistoryTableView() {
        return getSimpleAssetHistoryTableView(this.#history);
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this bond holding
     * based on its transaction history.
     */
    getXirr() {
        const finalCashFlow = new Decimal(0); // TODO kmere Implement this
        return calculateXirr(
            this.#history.map(record => ([
                record.cashChange,
                record.date
            ]))
        );
    }
}
