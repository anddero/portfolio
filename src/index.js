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
    #latestUnitValueAndDate; // {value: Decimal, date: Date}
    #latestTotalValue;
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
        if (type === "BUY" || type === "SELL") {
            validateNonZeroConcreteDecimal(unitValue).getOrThrow('unitValue');
            this.#latestUnitValueAndDate = {value: unitValue, date: date};
            if (type === "BUY") {
                validateNegativeConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#buyCash = this.#buyCash.plus(acquiredCash.negated());
            }
            if (type === "SELL") {
                validatePositiveConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#sellCash = this.#sellCash.plus(acquiredCash);
            }
        } else {
            if (unitValue !== null) {
                throw new Error('Unexpected unitValue');
            }
        }
        this.#totalCash = this.#totalCash.plus(acquiredCash);
        this.#history.push(new IndexFundChangeRecord(date, diff, acquiredCash, type));
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
        if (!this.#buyCash.negated().plus(this.#sellCash).equals(this.#totalCash)) {
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

        return {
            type: 'index-history',
            value: this.#latestTotalValue.toString(),
            valueDate: formatLocalDateForView(this.#latestUnitValueAndDate.date),
            xirr: this.#xirrStr,
            totalCash: this.#totalCash.toString(),
            buyCash: this.#buyCash.toString(),
            sellCash: this.#sellCash.toString(),
            history: baseTable.history
        };
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this index fund holding
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
