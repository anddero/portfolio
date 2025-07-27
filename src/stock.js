class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #history; // Array of StockChangeRecord objects

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

    /**
     * Updates the number of shares and the history of this stock holding.
     * @param diff Difference in shares, can be negative.
     * @param acquiredCash Amount of cash spent or received for this change, can be negative.
     * @param date Date of the change, must be a Date object.
     * @param allowZeroDiff If true, diff must be zero, otherwise it must be non-zero.
     * @param type Type of the change, must be a valid StockChangeType.
     * @param allowZeroCash If true, acquiredCash must be zero, otherwise it must be non-zero.
     */
    updateShares(diff, acquiredCash, date, allowZeroDiff, type, allowZeroCash) {
        let warnings = [];
        if (typeof allowZeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (typeof allowZeroCash != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!allowZeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        if (!allowZeroCash) {
            validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        } else {
            validateZeroDecimal(acquiredCash).getOrThrow('acquiredCash');
        }
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        this.#history.push(new StockChangeRecord(date, diff, acquiredCash, type));
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
        const table = getSimpleAssetHistoryTableView(this.#history);
        const xirr = this.getXirr().extend("XIRR calculation failed");
        const tableStr = xirr.isSuccess() ? xirr.getValue().toString() : xirr.getMessage(true);
        table.insertRow(0, ['XIRR', tableStr], [1, table.getTableSpan() - 1]);
        return table;
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this stock holding
     * based on its transaction history.
     */
    getXirr() {
        const finalPotentialInflow = new Decimal(0); // TODO kmere Implement this - the current value of all the shares
        return calculateXirr(
            this.#history.map(record => ([
                record.date,
                record.cashChange,
            ])).concat([[new Date(), finalPotentialInflow]])
        );
    }
}
