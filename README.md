# portfolio
Simple single-file web app for personal investment portfolio tracking.

## Live Financial Data API

In order for the app to fetch live financial data APIs such as Financial Modeling Prep, Alpha Vantage, etc., you must provide the API keys for them.

Copy `secrets_example.js` as `secrets.js` and add your API key(s) there for the services you wish to enable.

Any service without an API key will not be used.

If all the services are disabled, the app will still work normally, but with a few downsides (e.g. latest market price for an asset may be old/missing, and XIRR or other calculated metrics may be invalid). The UI will display a warning sign next to any outdated values, so no need to worry about it.
