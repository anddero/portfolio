/**
 * Fetch the current price of an asset from the cache or the API.
 * If there is no cached price and API fetch also fails, return null.
 * @param code - The code of the asset, e.g. "AAPL" for Apple Inc.
 * @param maxAgeMinutes - The maximum age of the cached price, in minutes.
 * @param fmpApiKey - The API key for Financial Modeling Prep.
 * @param avApiKey - The API key for Alpha Vantage.
 * @returns {Promise<{price: number, date: Date}|null>} - The latest available price and timestamp, if available.
 */
async function getAssetPrice(code, maxAgeMinutes, fmpApiKey, avApiKey) {
    // Check if the asset price is cached
    const cachedPrice = getAssetPriceFromCache(code);

    // Return it if still valid
    if (cachedPrice && Date.now() - cachedPrice.date.getTime() < maxAgeMinutes * 60 * 1000) {
        return cachedPrice.price;
    }

    // Fetch a new quote and cache it
    let price = null;
    let threw = false;
    try {
        price = await getCurrentPrice(code, fmpApikey, avApiKey);
    } catch (error) {
        console.warn(`Failed to fetch price for ${code}: ${error.message}`);
        threw = true;
    }

    // If fetching succeeded, cache the new price and return it
    if (!threw) {
        setAssetPriceToCache(code, price);
        return {price: price, date: new Date()};
    }

    // If fetching failed, return the cached price if available
    if (cachedPrice) {
        return cachedPrice;
    }

    // If no cached price and fetch failed, return null
    return null;
}
