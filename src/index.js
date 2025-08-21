/**
 * Index fund shares are mapped 1:1 to the underlying currency.
 */
class IndexFundHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash;
    #sellCash;
    #totalCash;
    #xirrStr;
    #history; // Array of IndexFundChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
        this.#buyCash = new Decimal(0);
        this.#sellCash = new Decimal(0);
        this.#totalCash = new Decimal(0);
        this.#xirrStr = null;
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

    getBuyCash() {
        return this.#buyCash;
    }

    getSellCash() {
        return this.#sellCash;
    }

    getTotalCash() {
        return this.#totalCash;
    }

    getXirrStr() {
        return this.#xirrStr;
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
        if (type === "BUY") {
            this.#buyCash = this.#buyCash.plus(acquiredCash);
        }
        if (type === "SELL") {
            this.#sellCash = this.#sellCash.plus(acquiredCash);
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
        this.#history.push(new IndexFundChangeRecord(date, diff, acquiredCash, type));
        if (this.#shares.lessThan(0)) {
            warnings.push(`Asset "${this.#friendlyName}" count ${this.#shares} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    validateAndFinalize() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#shares);
        validateHistoryFieldSum(this.#history, 'cashChange', this.#totalCash);
        if (!this.#buyCash.add(this.#sellCash).equals(this.#totalCash)) {
            throw new Error('Buy cash + sell cash != total cash');
        }
        const xirr = this.getXirr().extend("XIRR calculation failed");
        this.#xirrStr = xirr.isSuccess() ? xirr.getValue().toString() : xirr.getMessage(true);
    }

    getHistoryTableView() {
        const table = getSimpleAssetHistoryTableView(this.#history);
        const singleValueSpans = [1, table.getTableSpan() - 1];
        table.insertRow(0, ['XIRR', this.#xirrStr], singleValueSpans);
        table.insertRow(1, ['Total Cash', this.#totalCash.toString()], singleValueSpans);
        table.insertRow(2, ['Buy Cash', this.#buyCash.toString()], singleValueSpans);
        table.insertRow(3, ['Sell Cash', this.#sellCash.toString()], singleValueSpans);
        return table;
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this index fund holding
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
