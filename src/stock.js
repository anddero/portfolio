class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash;
    #sellCash;
    #incomeCash;
    #totalCash;
    #xirrStr;
    #history; // Array of StockChangeRecord objects

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
        this.#incomeCash = new Decimal(0);
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

    getIncomeCash() {
        return this.#incomeCash;
    }

    getTotalCash() {
        return this.#totalCash;
    }

    getXirrStr() {
        return this.#xirrStr;
    }

    /**
     * Updates the number of shares and the history of this stock holding.
     * @param diff Difference in shares, can be negative.
     * @param acquiredCash Amount of cash spent or received for this change, can be negative.
     * @param date Date of the change, must be a Date object.
     * @param zeroDiff If true, diff must be zero, otherwise it must be non-zero.
     * @param type Type of the change, must be a valid StockChangeType.
     * @param zeroCash If true, acquiredCash must be zero, otherwise it must be non-zero.
     */
    updateShares(diff, acquiredCash, date, zeroDiff, type, zeroCash) {
        let warnings = [];
        if (typeof zeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (typeof zeroCash != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!zeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        if (!zeroCash) {
            validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        } else {
            validateZeroDecimal(acquiredCash).getOrThrow('acquiredCash');
        }
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
        if (type === "DIVIDEND" ||
            type === "PUBLIC_TO_PRIVATE_SHARE_CONVERSION" ||
            type === "UNSPECIFIC_ACCOUNTING_INCOME") {
            this.#incomeCash = this.#incomeCash.plus(acquiredCash);
        }
        if (type === "STOCK_SPLIT" && !zeroCash) {
            throw new Error('Stock split must have zero cash change');
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
        this.#history.push(new StockChangeRecord(date, diff, acquiredCash, type));
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
        if (!this.#buyCash.add(this.#sellCash).add(this.#incomeCash).equals(this.#totalCash)) {
            throw new Error('Buy cash + sell cash + income cash != total cash');
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
        table.insertRow(4, ['Income Cash', this.#incomeCash.toString()], singleValueSpans);
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
