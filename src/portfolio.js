class CashChangeRecord {
    constructor(date, valueChange) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the cash changed
    }
}

class SimpleAssetChangeRecord {
    constructor(date, valueChange, cashChange) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!(cashChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the asset changed
        this.cashChange = cashChange; // Decimal object, amount the cash changed
    }
}

function getHistoryFieldSum(history, field) {
    if (!Array.isArray(history)) {
        throw new Error('Not an Array');
    }
    return history.reduce((sum, record) => sum.plus(record[field]), new Decimal(0));
}

function validateHistoryChronological(history) {
    if (!Array.isArray(history)) {
        throw new Error('Not an Array');
    }
    if (history.length === 0) {
        throw new Error('History cannot be empty.');
    }
    for (let i = 1; i < history.length; i++) {
        if (history[i].date < history[i - 1].date) {
            throw new Error(`History is not in chronological order.`);
        }
    }
}

function validateHistoryFieldSum(history, field, expectedSum) {
    const total = getHistoryFieldSum(history, field);
    if (history.length === 0) {
        throw new Error('History cannot be empty.');
    }
    if (!total.equals(expectedSum)) {
        throw new Error(`History "${field}" sum ${total} does not match expected sum ${expectedSum}.`);
    }
}

class CashHolding {
    #currency;
    #value;
    #history; // Array of CashChangeRecord objects.

    constructor(currency) {
        validateNonBlankString(currency).getOrThrow('currency');
        this.#currency = currency;
        this.#value = new Decimal(0);
        this.#history = [];
    }

    getCurrency() {
        return this.#currency;
    }

    getCurrentValue() {
        return this.#value;
    }

    updateValue(diff, date) {
        let warnings = [];
        validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#value = this.#value.plus(diff);
        this.#history.push(new CashChangeRecord(date, diff));
        if (this.#value.lessThan(0)) {
            warnings.push(`Cash "${this.#currency}" value ${this.#value} has become negative.`);
        }
        return warnings;
    }

    // Run all sorts of validations on the cash holding.
    validate() {
        validateHistoryChronological(this.#history);
        validateHistoryFieldSum(this.#history, 'valueChange', this.#value);
    }

    getCashChangeSum() {
        return getHistoryFieldSum(this.#history, 'valueChange');
    }
}

class StockHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #history; // Array of SimpleAssetChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    /**
     * Updates the number of shares and the history of this stock holding.
     * @param diff Difference in shares, can be negative.
     * @param acquiredCash Amount of cash spent or received for this change, can be negative.
     * @param date Date of the change, must be a Date object.
     */
    updateShares(diff, acquiredCash, date, allowZeroDiff) {
        let warnings = [];
        if (typeof allowZeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!allowZeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        this.#history.push(new SimpleAssetChangeRecord(date, diff, acquiredCash));
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
}

/**
 * Index fund shares are mapped 1:1 to the underlying currency.
 */
class IndexFundHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #history; // Array of SimpleAssetChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    updateShares(diff, acquiredCash, date, allowZeroDiff) {
        let warnings = [];
        if (typeof allowZeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!allowZeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        this.#history.push(new SimpleAssetChangeRecord(date, diff, acquiredCash));
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
}

class BondHolding {
    #code;
    #friendlyName;
    #currency;
    #shares;
    #history; // Array of SimpleAssetChangeRecord objects

    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).getOrThrow('code');
        validateNonBlankString(friendlyName).getOrThrow('friendlyName');
        validateNonBlankString(currency).getOrThrow('currency');
        this.#code = code;
        this.#friendlyName = friendlyName;
        this.#currency = currency;
        this.#shares = new Decimal(0);
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

    updateShares(diff, acquiredCash, date, allowZeroDiff) {
        let warnings = [];
        if (typeof allowZeroDiff != 'boolean') {
            throw new Error('Not a Boolean');
        }
        if (!allowZeroDiff) {
            validateNonZeroConcreteDecimal(diff).getOrThrow('diff');
        } else {
            validateZeroDecimal(diff).getOrThrow('diff');
        }
        validateNonZeroConcreteDecimal(acquiredCash).getOrThrow('acquiredCash');
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        this.#shares = this.#shares.plus(diff);
        this.#history.push(new SimpleAssetChangeRecord(date, diff, acquiredCash));
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

    getCashHoldings() {
        return Array.from(this.#cashHoldings.values());
    }

    getStockHoldings() {
        return Array.from(this.#stockHoldings.values());
    }

    getIndexFundHoldings() {
        return Array.from(this.#indexFundHoldings.values());
    }

    getBondHoldings() {
        return Array.from(this.#bondHoldings.values());
    }

    getAllHoldings() {
        return this.getCashHoldings()
            .concat(this.getStockHoldings())
            .concat(this.getIndexFundHoldings())
            .concat(this.getBondHoldings());
    }

    validate() {
        this.getAllHoldings().forEach(holding => holding.validate());
    }
}

class SummaryRecord {
    constructor(platformName, assetType, assetFriendlyName, currency, count, assetCode) {
        this.platformName = platformName;
        this.assetType = assetType;
        this.assetFriendlyName = assetFriendlyName;
        this.currency = currency;
        this.count = count;
        this.assetCode = assetCode;
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

    validate() {
        this.#platforms.values().forEach(platform => platform.validate());
    }

    getSummary() {
        const summary = []; // Array of SummaryRecord objects
        for (const platform of this.#platforms.values()) {
            for (const cashHolding of platform.getCashHoldings()) {
                summary.push(new SummaryRecord(
                    platform.getName(),
                    'Cash',
                    cashHolding.getCurrency(),
                    cashHolding.getCurrency(),
                    cashHolding.getCurrentValue().toString(),
                    cashHolding.getCurrency()
                ));
            }
            for (const stockHolding of platform.getStockHoldings()) {
                summary.push(new SummaryRecord(
                    platform.getName(),
                    'Stock',
                    stockHolding.getFriendlyName(),
                    stockHolding.getCurrency(),
                    stockHolding.getCurrentShares().toString(),
                    stockHolding.getCode()
                ));
            }
            for (const indexFundHolding of platform.getIndexFundHoldings()) {
                summary.push(new SummaryRecord(
                    platform.getName(),
                    'Index Fund',
                    indexFundHolding.getFriendlyName(),
                    indexFundHolding.getCurrency(),
                    indexFundHolding.getCurrentShares().toString(),
                    indexFundHolding.getCode()
                ));
            }
            for (const bondHolding of platform.getBondHoldings()) {
                summary.push(new SummaryRecord(
                    platform.getName(),
                    'Bond',
                    bondHolding.getFriendlyName(),
                    bondHolding.getCurrency(),
                    bondHolding.getCurrentShares().toString(),
                    bondHolding.getCode()
                ));
            }
        }
        return summary;
    }
}
