class CashHolding {
    #currency;
    #value;

    constructor(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        this.#currency = currency;
        this.#value = new Decimal(0);
    }

    getCurrency() {
        return this.#currency;
    }

    getCurrentValue() {
        return this.#value;
    }

    updateValue(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.#value = this.#value.plus(diff);
        return this.#value;
    }
}

class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.#shares = this.#shares.plus(diff);
        return this.#shares;
    }
}

/**
 * Index fund shares are mapped 1:1 to the underlying currency.
 */
class IndexFundHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.#shares = this.#shares.plus(diff);
        return this.#shares;
    }
}

class BondHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    updateShares(diff) {
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        this.#shares = this.#shares.plus(diff);
        return this.#shares;
    }
}

class Platform {
    #name;
    #cashHoldings; // Map of currency code to CashHolding
    #stockHoldings; // Map of asset code to StockHolding
    #indexFundHoldings; // Map of asset code to IndexFundHolding
    #bondHoldings; // Map of asset code to BondHolding

    constructor(name) {
        validateNonBlankString(name).getOrThrow('name');
        this.#name = name;
        this.#cashHoldings = new Map();
        this.#stockHoldings = new Map();
        this.#indexFundHoldings = new Map();
        this.#bondHoldings = new Map();
    }

    getName() {
        return this.#name;
    }

    hasCashHolding(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        return this.#cashHoldings.has(currency);
    }

    hasStockHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.#stockHoldings.has(code);
    }

    hasIndexFundHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.#indexFundHoldings.has(code);
    }

    hasBondHolding(code) {
        validateNonBlankString(code).getOrThrow('code');
        return this.#bondHoldings.has(code);
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
            for (let holding of this.#stockHoldings.values()) {
                if (holding.getFriendlyName() === name) {
                    return new VRes(`Cash holding "${name}" exists`);
                }
            }
            for (let holding of this.#indexFundHoldings.values()) {
                if (holding.getFriendlyName() === name) {
                    return new VRes(`Index fund "${name}" exists`);
                }
            }
            for (let holding of this.#bondHoldings.values()) {
                if (holding.getFriendlyName() === name) {
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
        return this.#cashHoldings.get(currency);
    }

    getStockHolding(code) {
        if (!this.hasStockHolding(code)) {
            throw new Error(`No stock holding for code ${code}`);
        }
        return this.#stockHoldings.get(code);
    }

    getIndexFundHolding(code) {
        if (!this.hasIndexFundHolding(code)) {
            throw new Error(`No index fund holding for code ${code}`);
        }
        return this.#indexFundHoldings.get(code);
    }

    getBondHolding(code) {
        if (!this.hasBondHolding(code)) {
            throw new Error(`No bond holding for code ${code}`);
        }
        return this.#bondHoldings.get(code);
    }

    addCashHolding(cashHolding) {
        if (!(cashHolding instanceof CashHolding)) {
            throw new Error('Not a CashHolding');
        }
        this.validateAssetCodeUnique(cashHolding.getCurrency()).getOrThrow();
        this.#cashHoldings.set(cashHolding.getCurrency(), cashHolding);
    }

    addStockHolding(stockHolding) {
        if (!(stockHolding instanceof StockHolding)) {
            throw new Error('Not a StockHolding');
        }
        this.validateAssetCodeUnique(stockHolding.getCode()).getOrThrow();
        this.validateAssetNameUnique(stockHolding.getFriendlyName()).getOrThrow();
        this.#stockHoldings.set(stockHolding.getCode(), stockHolding);
    }

    addIndexFundHolding(indexFundHolding) {
        if (!(indexFundHolding instanceof IndexFundHolding)) {
            throw new Error('Not an IndexFundHolding');
        }
        this.validateAssetCodeUnique(indexFundHolding.getCode()).getOrThrow();
        this.validateAssetNameUnique(indexFundHolding.getFriendlyName()).getOrThrow();
        this.#indexFundHoldings.set(indexFundHolding.getCode(), indexFundHolding);
    }

    addBondHolding(bondHolding) {
        if (!(bondHolding instanceof BondHolding)) {
            throw new Error('Not a BondHolding');
        }
        this.validateAssetCodeUnique(bondHolding.getCode()).getOrThrow();
        this.validateAssetNameUnique(bondHolding.getFriendlyName()).getOrThrow();
        this.#bondHoldings.set(bondHolding.getCode(), bondHolding);
    }
}

class Portfolio {
    #platforms; // Map of platform name to Platform
    #latestDate; // Date of the latest processed record

    constructor() {
        this.#platforms = new Map();
        this.#latestDate = undefined;
    }

    hasPlatform(name) {
        validateNonBlankString(name).getOrThrow('name');
        return this.#platforms.has(name);
    }

    getPlatform(name) {
        if (!this.hasPlatform(name)) {
            throw new Error(`No platform with name ${name}`);
        }
        return this.#platforms.get(name);
    }

    addPlatform(platform) {
        if (!(platform instanceof Platform)) {
            throw new Error('Not a Platform');
        }
        if (this.hasPlatform(platform.getName())) {
            throw new Error(`Platform ${platform.getName()} exists`);
        }
        this.#platforms.set(platform.getName(), platform);
    }

    setSameOrLaterDate(date) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (this.#latestDate && date < this.#latestDate) {
            return VRes(`Date ${date.toISOString()} earlier than ${this.#latestDate.toISOString()}`);
        }
        this.#latestDate = date;
        return new VRes();
    }
}
