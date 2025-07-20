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
