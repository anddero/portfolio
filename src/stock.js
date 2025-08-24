class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash; // has negated sign, positive amount of all spent cash on buys
    #sellCash;
    #incomeCash;
    #otherCash; // e.g. fee for share conversion or smth like that
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
        this.#otherCash = new Decimal(0);
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

    getOtherCash() {
        return this.#otherCash;
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

    getCurrentValueDate() {
        return this.#latestUnitValueAndDate.date;
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
                validateNegativeConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#buyCash = this.#buyCash.plus(acquiredCash.negated());
            }
            else if (type === "SELL") {
                validatePositiveConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#sellCash = this.#sellCash.plus(acquiredCash);
            }
        } else {
            if (unitValue !== null) {
                throw new Error('Unexpected unitValue');
            }
            if (type === "DIVIDEND" ||
                type === "UNSPECIFIC_ACCOUNTING_INCOME") {
                validatePositiveConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#incomeCash = this.#incomeCash.plus(acquiredCash);
            }
            if (type === "PUBLIC_TO_PRIVATE_SHARE_CONVERSION") {
                validateNegativeConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#otherCash = this.#otherCash.plus(acquiredCash);
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
        if (!this.#buyCash.negated().plus(this.#sellCash).plus(this.#incomeCash).plus(this.#otherCash).equals(this.#totalCash)) {
            throw new Error('Invalid total cash');
        }
        // Fetch the latest unit value if more than 0 shares.
        if (this.#shares.greaterThan(0)) {
            const unitValueAndDate = await getAssetPrice(this.#code);
            if (unitValueAndDate !== null) {
                if (unitValueAndDate.date > this.#latestUnitValueAndDate.date) {
                    this.#latestUnitValueAndDate = { value: new Decimal(unitValueAndDate.price), date: unitValueAndDate.date};
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
        const baseTable = getSimpleAssetHistoryTableView(this.#history);
        // Create summary rows to be added at the top
        const summaryRows = [
            ['Value', this.#latestTotalValue.toString(), formatLocalDateForView(this.#latestUnitValueAndDate.date), '', '', '', ''],
            ['XIRR', this.#xirrStr, '', '', '', '', ''],
            ['Total Cash', this.#totalCash.toString(), '', '', '', '', ''],
            ['Buy Cash', this.#buyCash.toString(), '', '', '', '', ''],
            ['Sell Cash', this.#sellCash.toString(), '', '', '', '', ''],
            ['Income Cash', this.#incomeCash.toString(), '', '', '', '', '']
        ];

        return {
            header: baseTable.header,
            body: [...summaryRows, ...baseTable.body],
            type: 'stock-history'
        };
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
