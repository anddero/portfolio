class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash;
    #sellCash;
    #incomeCash;
    #totalCash;
    #latestUnitValueAndDate; // {value: Decimal, date: Date}
    #latestTotalValue;
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
        this.#latestUnitValueAndDate = null;
        this.#latestTotalValue = null;
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

    getTotalCurrentValue() {
        return this.#latestTotalValue;
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
    updateShares(diff, acquiredCash, date, zeroDiff, type, zeroCash, unitValue) {
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
        if (type === "BUY" || type === "SELL") {
            validateNonZeroConcreteDecimal(unitValue).getOrThrow('unitValue');
            this.#latestUnitValueAndDate = {value: unitValue, date: date};
            if (type === "BUY") {
                this.#buyCash = this.#buyCash.plus(acquiredCash);
            }
            else if (type === "SELL") {
                this.#sellCash = this.#sellCash.plus(acquiredCash);
            }
        } else {
            if (unitValue !== null) {
                throw new Error('Unexpected unitValue');
            }
            if (type === "DIVIDEND" ||
                type === "PUBLIC_TO_PRIVATE_SHARE_CONVERSION" ||
                type === "UNSPECIFIC_ACCOUNTING_INCOME") {
                this.#incomeCash = this.#incomeCash.plus(acquiredCash);
            }
            if (type === "STOCK_SPLIT" && !zeroCash) {
                throw new Error('Stock split must have zero cash change');
            }
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
        this.#history.push(new StockChangeRecord(date, diff, acquiredCash, type));
        if (this.#shares.lessThan(0)) {
            warnings.push(`Asset "${this.#friendlyName}" count ${this.#shares} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    async validateAndFinalize() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#shares);
        validateHistoryFieldSum(this.#history, 'cashChange', this.#totalCash);
        if (!this.#buyCash.add(this.#sellCash).add(this.#incomeCash).equals(this.#totalCash)) {
            throw new Error('Buy cash + sell cash + income cash != total cash');
        }
        // Fetch the latest unit value if more than 0 shares.
        if (this.#shares.greaterThan(0)) {
            const unitValueAndDate = await getAssetPrice(this.#code);
            if (unitValueAndDate !== null) {
                if (unitValueAndDate.date > this.#latestUnitValueAndDate.date) {
                    this.#latestUnitValueAndDate = unitValueAndDate;
                }
            }
        }
        // Calculate XIRR if any activity in history.
        if (this.#history.length > 0) {
            // If there's any activity, the latest unit value should be present as well.
            if (!this.#latestUnitValueAndDate) {
                throw new Error(`Latest unit value not set despite having history: ${this.#history}`);
            }
            // Validate that the latest unit value is a Decimal.
            validateNonZeroConcreteDecimal(this.#latestUnitValueAndDate.value).getOrThrow('latestUnitValue');
            validateDate(this.#latestUnitValueAndDate.date).getOrThrow('latestUnitValueDate');
            // Calculate the total value of all shares.
            this.#latestTotalValue = this.#shares.times(this.#latestUnitValueAndDate.value);
            // Calculate XIRR.
            const xirr = this.getXirr().extend("XIRR calculation failed");
            this.#xirrStr = xirr.isSuccess() ? xirr.getValue().toString() : xirr.getMessage(true);
        }
    }

    getHistoryTableView() {
        const table = getSimpleAssetHistoryTableView(this.#history);
        const singleValueSpans = [1, table.getTableSpan() - 1];
        table.insertRow(0, ['Value', this.#latestTotalValue.toString()], singleValueSpans);
        table.insertRow(1, ['XIRR', this.#xirrStr], singleValueSpans);
        table.insertRow(2, ['Total Cash', this.#totalCash.toString()], singleValueSpans);
        table.insertRow(3, ['Buy Cash', this.#buyCash.toString()], singleValueSpans);
        table.insertRow(4, ['Sell Cash', this.#sellCash.toString()], singleValueSpans);
        table.insertRow(5, ['Income Cash', this.#incomeCash.toString()], singleValueSpans);
        return table;
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this stock holding
     * based on its transaction history.
     */
    getXirr() {
        validateConcreteDecimal(this.#latestTotalValue).getOrThrow('latestTotalValue');
        const finalPotentialInflow = this.#latestTotalValue;
        return calculateXirr(
            this.#history.map(record => ([
                record.date,
                record.cashChange,
            ])).concat([[new Date(), finalPotentialInflow]])
        );
    }
}
