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

function getCashHistoryTableView(history) {
    if (!Array.isArray(history)) {
        throw new Error('Not an Array');
    }
    if (history.length === 0) {
        throw new Error('History cannot be empty.');
    }
    let currentValue = new Decimal(0);
    return new TableView(
        ['Date', 'Change', 'Value'],
        history.map(record => [
            // Format date as "YYYY MM DD"
            record.date.toISOString().split('T')[0],
            record.valueChange.toString(), // Convert Decimal to string for display
            (currentValue = currentValue.plus(record.valueChange)).toString()
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
        ['Date', 'Change', 'Count', 'Cash', 'Total Cash'],
        history.map(record => [
            // Format date as "YYYY MM DD"
            record.date.toISOString().split('T')[0],
            record.valueChange.toString(), // Convert Decimal to string for display
            (currentCount = currentCount.plus(record.valueChange)).toString(),
            record.cashChange.toString(), // Convert Decimal to string for display
            (currentCash = currentCash.plus(record.valueChange)).toString()
        ])
    );
}
