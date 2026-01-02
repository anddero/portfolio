class SummaryRecord {
    constructor(platformName, assetType, assetFriendlyName, currency,
                count, totalCurrentValue, currentValueDate, totalBuy, totalSell, totalIncome, totalProfit, xirrCustom,
                xirrLib, assetCode) {
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
        this.xirrCustom = xirrCustom;
        this.xirrLib = xirrLib;
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

    getAssetsOverview() {
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
                    stockHolding.getXirrCustom().toString(),
                    stockHolding.getXirrLib().toString(),
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
                    indexFundHolding.getXirrCustom().toString(),
                    indexFundHolding.getXirrLib().toString(),
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
                    bondHolding.getXirrCustom().toString(),
                    bondHolding.getXirrLib().toString(),
                    bondHolding.getCode()
                ));
            }
        }
        return summary;
    }

    getAssetsOverviewTableView() {
        const overview = this.getAssetsOverview();

        // Check if asset value is old (at least 5 days behind)
        const isOld = (date) => date.getTime() < Date.now() - window.APP_CONFIG.assetValueShelfLifeHours * 60 * 60 * 1000;

        return {
            assets: overview.map((record, index) => ({
                index: index + 1,
                platformName: record.platformName,
                assetType: record.assetType,
                assetFriendlyName: record.assetFriendlyName,
                count: record.count,
                totalCurrentValue: record.totalCurrentValue,
                currentValueDate: formatLocalDateForView(record.currentValueDate) + (isOld(record.currentValueDate) ? '⚠️' : ''),
                totalBuy: record.totalBuy,
                totalSell: record.totalSell,
                totalIncome: record.totalIncome,
                totalProfit: record.totalProfit,
                xirrCustom: record.xirrCustom,
                xirrLib: record.xirrLib,
                currency: record.currency,
                assetCode: record.assetCode
            }))
        };
    }

    getAssetHistoryTablesView() {
        const cashList = [];
        const stockList = [];
        const indexFundList = [];
        const bondList = [];

        this.#platforms.values().forEach(platform => {
            platform.getCashHoldings().forEach(holding => cashList.push({
                title: `${holding.getFriendlyName()} (${holding.getCurrency()}, ${platform.getName()})`,
                id: `${platform.getName()}-${holding.getCode()}`,
                table: holding.getHistoryTableView()
            }));

            platform.getStockHoldings().forEach(holding => stockList.push({
                title: `${holding.getFriendlyName()} (${holding.getCurrency()}, ${platform.getName()})`,
                id: `${platform.getName()}-${holding.getCode()}`,
                table: holding.getHistoryTableView()
            }));

            platform.getIndexFundHoldings().forEach(holding => indexFundList.push({
                title: `${holding.getFriendlyName()} (${holding.getCurrency()}, ${platform.getName()})`,
                id: `${platform.getName()}-${holding.getCode()}`,
                table: holding.getHistoryTableView()
            }));

            platform.getBondHoldings().forEach(holding => bondList.push({
                title: `${holding.getFriendlyName()} (${holding.getCurrency()}, ${platform.getName()})`,
                id: `${platform.getName()}-${holding.getCode()}`,
                table: holding.getHistoryTableView()
            }));
        });

        return {
            cashList,
            stockList,
            indexFundList,
            bondList
        };
    }

    getPortfolioSummaryTablesView() {
        // Total value of all assets, grouped by currency.
        const totalValueByCurrency = new Map();
        this.#platforms.values().forEach(platform => {
            platform.getAllHoldings().forEach(holding => {
                if (totalValueByCurrency.has(holding.getCurrency())) {
                    totalValueByCurrency.set(holding.getCurrency(), totalValueByCurrency.get(holding.getCurrency()).plus(holding.getTotalCurrentValue()));
                } else {
                    totalValueByCurrency.set(holding.getCurrency(), holding.getTotalCurrentValue());
                }
            });
        });
        return {
            totalValueByCurrency
        };
    }

    getEstonianTaxFreeRemainderTableView() {
        return Array.from(this.#platforms.entries())
            .map(([platformName, platform]) => ({
                platformName,
                sumTable: platform.getEstonianTaxFreeRemainderTableView()
            }));
    }
}
