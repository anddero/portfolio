/**
 * Fetch the current price of an asset from the cache if it exists.
 * @param code {string} Globally unique code and key of the asset in cache.
 * @returns {{price: number, date: Date}|null} - The price and its timestamp, if available.
 */
function getAssetPriceFromCache(code) {
    // Fetch asset price from local storage
    const cachedPriceStr = localStorage.getItem(code);
    // Check if not stored
    if (cachedPriceStr === null) {
        return null;
    }
    /**
     * Parse the string into an object
     * @type {{price: number, date: string}}
     */
    const cachedPrice = JSON.parse(cachedPriceStr);
    // Check if the object is valid
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
    if (typeof cachedPrice.date !== 'string') {
        throw new Error(`Date is not a string`);
    }
    const date = new Date(cachedPrice.date);
    // Return the object
    return { price: cachedPrice.price, date: date };
}

function setAssetPriceToCache(code, price) {
    // Validate
    if (typeof code !== 'string') {
        throw new Error(`Code is not a string`);
    }
    if (typeof price !== 'number') {
        throw new Error(`Price is not a number`);
    }
    // Store the object as string, where the date is the current ISO timestamp
    localStorage.setItem(code, JSON.stringify({ price: price, date: new Date().toISOString() }));
}
