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
            throw new Error(`No cash holding for currency ${currency} on platform ${this.#name}`);
        }
        return this.#cashHoldings.get(currency);
    }

    getStockHolding(code) {
        if (!this.hasStockHolding(code)) {
            throw new Error(`No stock holding for code ${code} on platform ${this.#name}`);
        }
        return this.#stockHoldings.get(code);
    }

    getIndexFundHolding(code) {
        if (!this.hasIndexFundHolding(code)) {
            throw new Error(`No index fund holding for code ${code} on platform ${this.#name}`);
        }
        return this.#indexFundHoldings.get(code);
    }

    getBondHolding(code) {
        if (!this.hasBondHolding(code)) {
            throw new Error(`No bond holding for code ${code} on platform ${this.#name}`);
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

    getAllSimpleAssetHoldings() {
        return this.getStockHoldings()
            .concat(this.getIndexFundHoldings())
            .concat(this.getBondHoldings());
    }

    // "Tulumaksuvaba jääk" - It's an Estonian thing and only applies to accounts that are officially declared tax-exempt
    // Return the tax free remainder at the end of the given year. This should match what is calculated on the
    // income tax declaration in spring of the following year.
    // Return a map of currency code to Decimal, e.g. "USD":Decimal(5).
    getTaxFreeRemainderEstonia(year) {
        let sumByCurrency = new Map();
        this.getCashHoldings().forEach(holding => {
            if (!sumByCurrency.has(holding.getCurrency())) {
                sumByCurrency.set(holding.getCurrency(), new Decimal(0));
            }
            const history = holding.getHistory()
                .filter(record => record.date.getFullYear() <= year);
            // Sum all cash deposits
            history
                .filter(record => record.type === "deposit")
                .forEach(record =>
                    sumByCurrency.set(holding.getCurrency(), sumByCurrency.get(holding.getCurrency()).plus(record.valueChange))
                );
            // Subtract all cash withdrawals
            history
                .filter(record => record.type === "withdraw")
                .forEach(record =>
                    sumByCurrency.set(holding.getCurrency(), sumByCurrency.get(holding.getCurrency()).minus(record.valueChange))
                );
        });
        // Add all incomes where income tax has already been deducted
        const simpleAssets = this.getAllSimpleAssetHoldings();
        simpleAssets.forEach(holding => {
            if (!sumByCurrency.has(holding.getCurrency())) {
                sumByCurrency.set(holding.getCurrency(), new Decimal(0));
            }
            holding.getHistory()
                .filter(record => record.date.getFullYear() <= year)
                .filter(record => record.wasIncomeTaxPaidEstonia)
                .forEach(record =>
                    sumByCurrency.set(holding.getCurrency(), sumByCurrency.get(holding.getCurrency()).plus(record.valueChange))
                );
        });
        return sumByCurrency;
    }

    getEstonianTaxFreeRemainderTableView() {
        const firstYear = this.getAllHoldings().reduce((minDate, holding) => {
            const y = holding.getHistory()[0].date.getFullYear();
            return minDate === null ? y : Math.min(minDate, y);
        }, null);
        const lastYear = (new Date()).getFullYear();
        const years = [];
        for (let y = firstYear; y <= lastYear; y++) {
            years.push(y);
        }
        const taxFreeRemainderByYear = new Map();
        years.forEach(year => taxFreeRemainderByYear.set(year, this.getTaxFreeRemainderEstonia(year)));
        let currencies = new Set();
        taxFreeRemainderByYear.forEach((remainderByCurrency, _) => remainderByCurrency.forEach((_, currency) => currencies.add(currency)));
        currencies = Array.from(currencies);
        const tableByYearAndCurrency = []; // 2D array
        years.forEach(year => {
            const row = [];
            currencies.forEach(currency => {
                let value = taxFreeRemainderByYear.get(year).get(currency);
                if (value === undefined) {
                    value = new Decimal(0);
                }
                row.push(value.toNumber())
            });
            tableByYearAndCurrency.push(row);
        });
        return {
            yearsRow: years,
            currenciesCol: currencies,
            table: tableByYearAndCurrency
        };
    }

    async validateAndFinalize() {
        await Promise.all(this.getAllHoldings().map(holding => holding.validateAndFinalize()));
    }
}

