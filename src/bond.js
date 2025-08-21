class BondHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash;
    #interestCash;
    #totalCash;
    #history; // Array of BondChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
        this.#buyCash = new Decimal(0);
        this.#interestCash = new Decimal(0);
        this.#totalCash = new Decimal(0);
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

    updateShares(diff, acquiredCash, date, zeroDiff, type) {
        let warnings = [];
        if (typeof zeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!zeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        if (type === BondChangeType.BUY) {
            this.#buyCash = this.#buyCash.plus(acquiredCash);
        }
        if (type === BondChangeType.INTEREST) {
            this.#interestCash = this.#interestCash.plus(acquiredCash);
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
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
        const table = getSimpleAssetHistoryTableView(this.#history);
        const xirr = this.getXirr().extend("XIRR calculation failed");
        const tableStr = xirr.isSuccess() ? xirr.getValue().toString() : xirr.getMessage(true);
        table.insertRow(0, ['XIRR', tableStr], [1, table.getTableSpan() - 1]);
        return table;
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this bond holding
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
