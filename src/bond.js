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
    #xirr;
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
        this.#xirr = null;
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

    getXirr() {
        return this.#xirr;
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
        if (type === "BUY") {
            validateNegativeConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
            validateNonZeroConcreteDecimal(unitValue).getOrThrow('unitValue');
            this.#buyCash = this.#buyCash.plus(acquiredCash.negated());
            this.#latestUnitValueAndDate = {value: unitValue, date: date};
        } else {
            if (unitValue !== null) {
                throw new Error('Unexpected unitValue');
            }
            if (type === "INTEREST") {
                validatePositiveConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
                this.#interestCash = this.#interestCash.plus(acquiredCash);
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
        if (!this.#buyCash.negated().add(this.#interestCash).equals(this.#totalCash)) {
            throw new Error('Total cash invalid');
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
            this.#xirr = new Decimal(this.calculateXirr());
        }
    }

    getHistoryTableView() {
        const baseHistory = getSimpleAssetHistoryTableView(this.#history);

        return {
            value: this.#latestTotalValue.toNumber(),
            valueDate: formatLocalDateForView(this.#latestUnitValueAndDate.date),
            xirr: this.#xirr.toNumber(),
            totalCash: this.#totalCash.toNumber(),
            buyCash: this.#buyCash.toNumber(),
            interestCash: this.#interestCash.toNumber(),
            history: baseHistory
        };
    }

    /**
     * Calculates the XIRR (Extended Internal Rate of Return) for this bond holding
     * based on its transaction history.
     */
    calculateXirr() {
        validateConcreteDecimal(this.#latestTotalValue).getOrThrow('latestTotalValue');
        const finalPotentialInflow = this.#latestTotalValue;
        return xirr(
            this.#history.map(record => ({
                time: record.date,
                cashFlow: record.cashChange.toNumber(),
            })).concat([{time: this.#latestUnitValueAndDate.date, cashFlow: finalPotentialInflow.toNumber()}])
        );
    }
}
