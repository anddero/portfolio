class CashHolding {
    constructor(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        this.currency = currency;
        this.value = new Decimal(0);
    }

    getCurrentValue() {
        return this.value;
    }

    updateValue(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.value = this.value.plus(diff);
        return this.value;
    }
}

class StockHolding {
    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.code = code;
        this.friendlyName = friendlyName;
        this.currency = currency;
        this.shares = new Decimal(0);
    }

    getCurrency() {
        return this.currency;
    }

    getCurrentShares() {
        return this.shares;
    }

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}

/**
 * Index fund shares are mapped 1:1 to the underlying currency.
 */
class IndexFundHolding {
    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.code = code;
        this.friendlyName = friendlyName;
        this.currency = currency;
        this.shares = new Decimal(0);
    }

    getCurrency() {
        return this.currency;
    }

    getCurrentShares() {
        return this.shares;
    }

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}

class BondHolding {
    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.code = code;
        this.friendlyName = friendlyName;
        this.currency = currency;
        this.shares = new Decimal(0);
    }

    getCurrency() {
        return this.currency;
    }

    getCurrentShares() {
        return this.shares;
    }

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}

class Platform {
    constructor(name) {
        validateNonBlankString(name).getOrThrow('name');
        this.name = name;
        this.cashHoldings = new Map(); // CashHolding objects by currency code
        this.stockHoldings = new Map(); // StockHolding objects by asset code
        this.indexFundHoldings = new Map(); // IndexFundHolding objects by asset code
        this.bondHoldings = new Map(); // BondHolding objects by asset code
    }

    hasCashHolding(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        return this.cashHoldings.has(currency);
    }

    hasStockHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.stockHoldings.has(code);
    }

    hasIndexFundHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.indexFundHoldings.has(code);
    }

    hasBondHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.bondHoldings.has(code);
    }

    validateAssetCodeUnique(code) {
        if (this.hasCashHolding(code)) {
            return new VRes(`Cash holding "${code}" exists`);
        }
        if (this.hasStockHolding(code)) {
            return new VRes(`Stock holding "${code}" exists`);
        }
        if (this.hasIndexFundHolding(code)) {
            return new VRes(`Index fund "${code}" exists`);
        }
        if (this.hasBondHolding(code)) {
            return new VRes(`Bond holding "${code}" exists`);
        }
        return new VRes();
    }

    validateAssetNameUnique(name) {
        let validateUnique = () => {
            for (let holding of this.stockHoldings.values()) {
                if (holding.friendlyName === name) {
                    return new VRes(`Cash holding "${name}" exists`);
                }
            }
            for (let holding of this.indexFundHoldings.values()) {
                if (holding.friendlyName === name) {
                    return new VRes(`Index fund "${name}" exists`);
                }
            }
            for (let holding of this.bondHoldings.values()) {
                if (holding.friendlyName === name) {
                    return new VRes(`Bond holding "${name}" exists`);
                }
            }
            return new VRes();
        };
        return validateNonBlankString(name).extend('name').and(validateUnique);
    }

    getCashHolding(currency) {
        if (!this.hasCashHolding(currency)) {
            throw new Error(`No cash holding for currency ${currency}`);
        }
        return this.cashHoldings.get(currency);
    }

    getStockHolding(code) {
        if (!this.hasStockHolding(code)) {
            throw new Error(`No stock holding for code ${code}`);
        }
        return this.stockHoldings.get(code);
    }

    getIndexFundHolding(code) {
        if (!this.hasIndexFundHolding(code)) {
            throw new Error(`No index fund holding for code ${code}`);
        }
        return this.indexFundHoldings.get(code);
    }

    getBondHolding(code) {
        if (!this.hasBondHolding(code)) {
            throw new Error(`No bond holding for code ${code}`);
        }
        return this.bondHoldings.get(code);
    }

    addCashHolding(cashHolding) {
        if (!(cashHolding instanceof CashHolding)) {
            throw new Error('Not a CashHolding');
        }
        this.validateAssetCodeUnique(cashHolding.currency).getOrThrow();
        this.cashHoldings.set(cashHolding.currency, cashHolding);
    }

    addStockHolding(stockHolding) {
        if (!(stockHolding instanceof StockHolding)) {
            throw new Error('Not a StockHolding');
        }
        this.validateAssetCodeUnique(stockHolding.code).getOrThrow();
        this.validateAssetNameUnique(stockHolding.friendlyName).getOrThrow();
        this.stockHoldings.set(stockHolding.code, stockHolding);
    }

    addIndexFundHolding(indexFundHolding) {
        if (!(indexFundHolding instanceof IndexFundHolding)) {
            throw new Error('Not an IndexFundHolding');
        }
        this.validateAssetCodeUnique(indexFundHolding.code).getOrThrow();
        this.validateAssetNameUnique(indexFundHolding.friendlyName).getOrThrow();
        this.indexFundHoldings.set(indexFundHolding.code, indexFundHolding);
    }

    addBondHolding(bondHolding) {
        if (!(bondHolding instanceof BondHolding)) {
            throw new Error('Not a BondHolding');
        }
        this.validateAssetCodeUnique(bondHolding.code).getOrThrow();
        this.validateAssetNameUnique(bondHolding.friendlyName).getOrThrow();
        this.bondHoldings.set(bondHolding.code, bondHolding);
    }
}
