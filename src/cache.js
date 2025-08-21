function getAssetPriceFromCache(code) {
    // Fetch asset price from local storage
    const cachedPrice = localStorage.getItem(code);
    // Validate
    if (cachedPrice === null) {
        throw new Error(`Not cached`);
    }
    if (typeof cachedPrice !== 'object') {
        throw new Error(`Not an object`);
    }
    // Expect two fields - float price and Date date
    if (!cachedPrice.hasOwnProperty('price')) {
        throw new Error(`Missing price field`);
    }
    if (!cachedPrice.hasOwnProperty('date')) {
        throw new Error(`Missing date field`);
    }
    if (typeof cachedPrice.price !== 'number') {
        throw new Error(`Price is not a number`);
    }
    if (!(cachedPrice.date instanceof Date)) {
        throw new Error(`Date is not a Date`);
    }
    // Return the object
    return cachedPrice;
}

function setAssetPriceToCache(code, price, date) {
    // Validate
    if (typeof code !== 'string') {
        throw new Error(`Code is not a string`);
    }
    if (typeof price !== 'number') {
        throw new Error(`Price is not a number`);
    }
    if (!(date instanceof Date)) {
        throw new Error(`Date is not a Date`);
    }
    // Store the object
    localStorage.setItem(code, { price: price, date: date });
}
