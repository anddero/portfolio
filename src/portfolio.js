class CashHolding {
    constructor(currency) {
        this.currency = currency;
        this.value = new Decimal(0);
    }

    getCurrentValue() {
        return this.value;
    }

    updateValue(diff) {
        this.value = this.value.plus(diff);
        return this.value;
    }
}

class StockHolding {
    constructor(code, friendlyName, currency) {
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
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}
