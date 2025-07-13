class CashHolding {
    constructor(currency) {
        validateNonBlankString(currency).orThrow('currency');
        this.currency = currency;
        this.value = new Decimal(0);
    }

    getCurrentValue() {
        return this.value;
    }

    updateValue(diff) {
        validateNonZeroConcreteDecimal(diff).orThrow('diff');
        this.value = this.value.plus(diff);
        return this.value;
    }
}

class StockHolding {
    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).orThrow('code');
        validateNonBlankString(friendlyName).orThrow('friendlyName');
        validateNonBlankString(currency).orThrow('currency');
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
        validateNonZeroConcreteDecimal(diff).orThrow('diff');
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}

class IndexFundHolding {
    constructor(code, friendlyName, currency) {
        validateNonBlankString(code).orThrow('code');
        validateNonBlankString(friendlyName).orThrow('friendlyName');
        validateNonBlankString(currency).orThrow('currency');
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
        validateNonZeroConcreteDecimal(diff).orThrow('diff');
        this.shares = this.shares.plus(diff);
        return this.shares;
    }
}
