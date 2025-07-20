const CashChangeType = Object.freeze({
    CASH_DEPOSIT: 'deposit',
    CASH_TRANSFER: 'transfer',
    CASH_CURRENCY_CONVERSION: 'currency conversion',
    STOCK_BUY: 'buy stock',
    STOCK_SELL: 'sell stock',
    STOCK_DIVIDEND: 'dividend stock',
    STOCK_PUBLIC_TO_PRIVATE_SHARE_CONVERSION: 'public to private share conversion stock',
    STOCK_UNSPECIFIC_ACCOUNTING_INCOME: 'unspecific accounting income stock',
    INDEX_FUND_BUY: 'buy index fund',
    INDEX_FUND_SELL: 'sell index fund',
    BOND_BUY: 'buy bond',
    BOND_INTEREST: 'interest bond',
});

class CashChangeRecord {
    constructor(date, valueChange, type) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!Object.getOwnPropertyNames(CashChangeType).includes(type)) {
            throw new Error(`Invalid CashChangeType: ${type}`);
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the cash changed
        this.type = CashChangeType[type]; // CashChangeType enum
    }
}

const StockChangeType = Object.freeze({
    BUY: 'buy',
    SELL: 'sell',
    DIVIDEND: 'dividend',
    PUBLIC_TO_PRIVATE_SHARE_CONVERSION: 'public to private share conversion',
    UNSPECIFIC_ACCOUNTING_INCOME: 'unspecific accounting income',
});

const IndexFundChangeType = Object.freeze({
    BUY: 'buy',
    SELL: 'sell',
});

const BondChangeType = Object.freeze({
    BUY: 'buy',
    INTEREST: 'interest',
});

class StockChangeRecord {
    constructor(date, valueChange, cashChange, type) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!(cashChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!Object.getOwnPropertyNames(StockChangeType).includes(type)) {
            throw new Error(`Invalid StockChangeType: ${type}`);
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the asset changed
        this.cashChange = cashChange; // Decimal object, amount the cash changed
        this.type = StockChangeType[type]; // StockChangeType enum
    }
}

class IndexFundChangeRecord {
    constructor(date, valueChange, cashChange, type) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!(cashChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!Object.getOwnPropertyNames(IndexFundChangeType).includes(type)) {
            throw new Error('Invalid IndexFundChangeType');
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the asset changed
        this.cashChange = cashChange; // Decimal object, amount the cash changed
        this.type = IndexFundChangeType[type]; // IndexFundChangeType enum
    }
}

class BondChangeRecord {
    constructor(date, valueChange, cashChange, type) {
        if (!(date instanceof Date)) {
            throw new Error('Not a Date');
        }
        if (!(valueChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!(cashChange instanceof Decimal)) {
            throw new Error('Not a Decimal');
        }
        if (!Object.getOwnPropertyNames(BondChangeType).includes(type)) {
            throw new Error('Invalid BondChangeType');
        }
        this.date = date; // Date object
        this.valueChange = valueChange; // Decimal object, amount the asset changed
        this.cashChange = cashChange; // Decimal object, amount the cash changed
        this.type = BondChangeType[type]; // BondChangeType enum
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

function getCashHistoryTableView(history) {
    if (!Array.isArray(history)) {
        throw new Error('Not an Array');
    }
    if (history.length === 0) {
        throw new Error('History cannot be empty.');
    }
    let currentValue = new Decimal(0);
    return new TableView(
        ['Date', 'Change', 'Value', 'Action'],
        history.map(record => [
            // Format date as "YYYY MM DD"
            record.date.toISOString().split('T')[0],
            record.valueChange.toString(), // Convert Decimal to string for display
            (currentValue = currentValue.plus(record.valueChange)).toString(),
            record.type // Use the type directly for display
        ])
    );
}

function getSimpleAssetHistoryTableView(history) {
    if (!Array.isArray(history)) {
        throw new Error('Not an Array');
    }
    if (history.length === 0) {
        throw new Error('History cannot be empty.');
    }
    let currentCount = new Decimal(0);
    let currentCash = new Decimal(0);
    return new TableView(
        ['Date', 'Change', 'Count', 'Cash', 'Total Cash', 'Action'],
        history.map(record => [
            // Format date as "YYYY MM DD"
            record.date.toISOString().split('T')[0],
            record.valueChange.toString(), // Convert Decimal to string for display
            (currentCount = currentCount.plus(record.valueChange)).toString(),
            record.cashChange.toString(), // Convert Decimal to string for display
            (currentCash = currentCash.plus(record.cashChange)).toString(),
            record.type // Use the type directly for display
        ])
    );
}
