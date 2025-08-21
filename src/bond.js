class BondHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #buyCash;
    #interestCash;
    #totalCash;
    #latestUnitValueAndDate; // {value: Decimal, date: Date}
    #latestTotalValue;
    #xirrStr;
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
        this.#xirrStr = ""; // Will be kept blank if no assets are held.
        this.#latestUnitValueAndDate = null;
        this.#latestTotalValue = null;
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

    getInterestCash() {
        return this.#interestCash;
    }

    getTotalCash() {
        return this.#totalCash;
    }

    getXirrStr() {
        return this.#xirrStr;
    }

    updateShares(diff, acquiredCash, date, zeroDiff, type, unitValue) {
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
            validateNonZeroConcreteDecimal(unitValue).getOrThrow('unitValue');
            this.#latestUnitValueAndDate = {value: unitValue, date: date};
        } else {
            if (type === "INTEREST") {
                this.#interestCash = this.#interestCash.plus(acquiredCash);
            }
            if (unitValue !== null) {
                throw new Error('Unexpected unitValue');
            }
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
        this.#history.push(new BondChangeRecord(date, diff, acquiredCash, type));
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
        if (!this.#buyCash.add(this.#interestCash).equals(this.#totalCash)) {
            throw new Error('Buy cash + interest cash != total cash');
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
        table.insertRow(0, ['XIRR', this.#xirrStr], singleValueSpans);
        table.insertRow(1, ['Total Cash', this.#totalCash.toString()], singleValueSpans);
        table.insertRow(2, ['Buy Cash', this.#buyCash.toString()], singleValueSpans);
        table.insertRow(3, ['Interest Cash', this.#interestCash.toString()], singleValueSpans);
        return table;
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this bond holding
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
