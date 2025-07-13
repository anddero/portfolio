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
