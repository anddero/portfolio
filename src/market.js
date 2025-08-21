async function getCurrentPrice(symbol, fmpApiKey, avApiKey) {
    if (!symbol) {
        throw new Error('Symbol is required');
    }

    const symbolUpper = symbol.toUpperCase();

    // List of services to try in order
    const services = [
        { name: 'Financial Modeling Prep', func: getFinancialModelingPrepPrice, 'apiKey': fmpApiKey },
        { name: 'Alpha Vantage', func: getAlphaVantagePrice, 'apiKey': avApiKey },
        { name: 'Yahoo Finance', func: getYahooFinancePrice, 'apiKey': null }
    ];

    // Try services in order
    for (const service of services) {
        try {
            const price = await service.func(symbolUpper, service.apiKey);
            console.log(`Successfully fetched price from ${service.name}: ${symbolUpper} = ${price}`);
            return price;
        } catch (error) {
            console.error(`Error fetching price from ${service.name} for symbol ${symbolUpper}: ${error.message}`);
        }
    }

    throw new Error(`All APIs failed to fetch price for symbol ${symbol}`);
}

async function getFinancialModelingPrepPrice(symbol, apiKey) {
    const baseUrl = 'https://financialmodelingprep.com/stable/quote-short';

    const response = await fetch(`${baseUrl}?symbol=${symbol}&apikey=${apiKey}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
    }

    const quote = data[0];

    if (quote.symbol !== symbol) {
        throw new Error(`Invalid symbol "${quote.symbol}" data received for symbol "${symbol}"`);
    }

    const price = quote.price;

    if (typeof price !== 'number') {
        throw new Error(`Not a number: ${price}`);
    }

    if (isNaN(price) || !isFinite(price) || price <= 0) {
        throw new Error(`Invalid price`);
    }

    return price;
}

async function getAlphaVantagePrice(symbol, apiKey) {
    const baseUrl = 'https://www.alphavantage.co/query';
    const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: apiKey
    });

    const response = await fetch(`${baseUrl}?${params}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Check for API error messages
    if (data['Error Message']) {
        throw new Error(`API Error: ${data['Error Message']}`);
    }

    if (data['Note']) {
        throw new Error(`API Limit: ${data['Note']}`);
    }

    // Extract price from Alpha Vantage response
    const quote = data['Global Quote'];
    if (!quote) {
        throw new Error(`Price data not found for symbol: ${symbol}`);
    }

    if (quote['01. symbol'] !== symbol) {
        throw new Error(`Invalid symbol "${quote['01. symbol']}" data received for symbol "${symbol}"`);
    }

    const price = parseFloat(quote['05. price']);

    if (isNaN(price) || !isFinite(price) || price <= 0) {
        throw new Error(`Invalid price`);
    }

    return price;
}

async function getYahooFinancePrice(symbol, apiKeyUnused) {
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

    const response = await fetch(`${baseUrl}/${symbol}`);

    if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
    }

    const result = data.chart.result[0];

    // Verify symbol
    if (result.meta.symbol !== symbol) {
        throw new Error(`Invalid symbol "${result.meta.symbol}" data received for symbol "${symbol}"`);
    }

    const price = result.meta.regularMarketPrice || result.meta.previousClose;

    if (!price || isNaN(price) || typeof price !== 'number' || !isFinite(price) || price <= 0) {
        throw new Error(`Invalid price data from Yahoo Finance for symbol: ${symbol}`);
    }

    return price;
}
