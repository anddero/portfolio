class SummaryRecord {
    constructor(platformName, assetType, assetFriendlyName, currency,
                count, totalCurrentValue, currentValueDate, totalBuy, totalSell, totalIncome, totalProfit, xirr,
                assetCode) {
        this.platformName = platformName;
        this.assetType = assetType;
        this.assetFriendlyName = assetFriendlyName;
        this.currency = currency;
        this.count = count;
        this.totalCurrentValue = totalCurrentValue;
        this.currentValueDate = currentValueDate;
        this.totalBuy = totalBuy;
        this.totalSell = totalSell;
        this.totalIncome = totalIncome;
        this.totalProfit = totalProfit;
        this.xirr = xirr;
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
            return new VRes(`Date "${formatLocalDateForView(date)}" earlier than "${formatLocalDateForView(this.#latestDate)}"`);
        }
        this.#latestDate = date;
        return new VRes();
    }

    async validateAndFinalize() {
        await Promise.all(Array.from(this.#platforms.values()).map(platform => platform.validateAndFinalize()));
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
                    "",
                    cashHolding.getCurrentValue().toString(),
                    new Date(),
                    "",
                    "",
                    "",
                    "",
                    "",
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
                    stockHolding.getTotalCurrentValue().toString(),
                    stockHolding.getCurrentValueDate(),
                    stockHolding.getBuyCash().toString(),
                    stockHolding.getSellCash().toString(),
                    stockHolding.getIncomeCash().toString(),
                    stockHolding.getTotalCash().toString(),
                    stockHolding.getXirrStr(),
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
                    indexFundHolding.getTotalCurrentValue().toString(),
                    indexFundHolding.getCurrentValueDate(),
                    indexFundHolding.getBuyCash().toString(),
                    indexFundHolding.getSellCash().toString(),
                    "",
                    indexFundHolding.getTotalCash().toString(),
                    indexFundHolding.getXirrStr(),
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
                    bondHolding.getTotalCurrentValue().toString(),
                    bondHolding.getCurrentValueDate(),
                    bondHolding.getBuyCash().toString(),
                    "",
                    bondHolding.getInterestCash().toString(),
                    bondHolding.getTotalCash().toString(),
                    bondHolding.getXirrStr(),
                    bondHolding.getCode()
                ));
            }
        }
        return summary;
    }

    getSummaryTableView() {
        const summary = this.getSummary();
        return {
            type: 'portfolio-summary',
            assets: summary.map((record, index) => ({
                index: index + 1,
                platformName: record.platformName,
                assetType: record.assetType,
                assetFriendlyName: record.assetFriendlyName,
                count: record.count,
                totalCurrentValue: record.totalCurrentValue,
                currentValueDate: formatLocalDateForView(record.currentValueDate),
                totalBuy: record.totalBuy,
                totalSell: record.totalSell,
                totalIncome: record.totalIncome,
                totalProfit: record.totalProfit,
                xirr: record.xirr,
                currency: record.currency,
                assetCode: record.assetCode
            }))
        };
    }

    getAssetHistoryTablesView() {
        let tablesList = [];
        this.#platforms.values().forEach(platform => platform.getAllHoldings().forEach(holding => tablesList.push({
            title: `${holding.getFriendlyName()} (${holding.getCurrency()}, ${platform.getName()})`,
            id: `${platform.getName()}-${holding.getCode()}`,
            table: holding.getHistoryTableView()
        })));
        return { tables: tablesList };
    }
}
