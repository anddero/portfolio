// DOM building functions for different table types

function buildSummaryTable(tableData, tableElementId) {
    if (!tableElementId || typeof tableElementId !== 'string') {
        throw new Error('tableElementId must be a non-empty string');
    }

    const tableElement = document.getElementById(tableElementId);
    if (!(tableElement instanceof HTMLTableElement)) {
        throw new Error('Not a valid HTMLTableElement');
    }

    tableElement.innerHTML = `
        <thead>
        <tr>
            <th>Index</th>
            <th>Platform</th>
            <th>Type</th>
            <th>Name</th>
            <th>Count</th>
            <th>Value</th>
            <th>As Of Date</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Income</th>
            <th>Profit</th>
            <th>XIRR</th>
            <th>Currency</th>
            <th>Code</th>
        </tr>
        </thead>
        <tbody>
            ${tableData.assets.map(asset => `
                <tr>
                    <td>${asset.index}</td>
                    <td>${asset.platformName}</td>
                    <td>${asset.assetType}</td>
                    <td>${asset.assetFriendlyName}</td>
                    <td>${asset.count}</td>
                    <td>${asset.totalCurrentValue}</td>
                    <td>${asset.currentValueDate}</td>
                    <td>${asset.totalBuy}</td>
                    <td>${asset.totalSell}</td>
                    <td>${asset.totalIncome}</td>
                    <td>${asset.totalProfit}</td>
                    <td>${asset.xirr}</td>
                    <td>${asset.currency}</td>
                    <td>${asset.assetCode}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildStockHistoryTable(tableData, tableElementId) {
    if (!tableElementId || typeof tableElementId !== 'string') {
        throw new Error('tableElementId must be a non-empty string');
    }

    const tableElement = document.getElementById(tableElementId);
    if (!(tableElement instanceof HTMLTableElement)) {
        throw new Error('Not a valid HTMLTableElement');
    }

    tableElement.innerHTML = `
        <thead>
        <tr>
            <th>#</th>
            <th>Date</th>
            <th>Change</th>
            <th>Count</th>
            <th>Cash</th>
            <th>Profit</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
            <tr class="summary-row">
                <td colspan="2">Value</td>
                <td>${tableData.value}</td>
                <td colspan="4">${tableData.valueDate}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${tableData.xirr}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Total Cash</td>
                <td colspan="5">${tableData.totalCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Buy Cash</td>
                <td colspan="5">${tableData.buyCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Sell Cash</td>
                <td colspan="5">${tableData.sellCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Income Cash</td>
                <td colspan="5">${tableData.incomeCash}</td>
            </tr>
            ${tableData.history.map(record => `
                <tr>
                    <td>${record.index}</td>
                    <td>${record.date}</td>
                    <td>${record.change}</td>
                    <td>${record.count}</td>
                    <td>${record.cash}</td>
                    <td>${record.profit}</td>
                    <td>${record.action}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildCashHistoryTable(tableData, tableElementId) {
    if (!tableElementId || typeof tableElementId !== 'string') {
        throw new Error('tableElementId must be a non-empty string');
    }

    const tableElement = document.getElementById(tableElementId);
    if (!(tableElement instanceof HTMLTableElement)) {
        throw new Error('Not a valid HTMLTableElement');
    }

    tableElement.innerHTML = `
        <thead>
        <tr>
            <th>#</th>
            <th>Date</th>
            <th>Change</th>
            <th>Balance</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
            <tr class="summary-row">
                <td colspan="2">Interest Cash</td>
                <td colspan="3">${tableData.interestCash}</td>
            </tr>
            ${tableData.history.map(record => `
                <tr>
                    <td>${record.index}</td>
                    <td>${record.date}</td>
                    <td>${record.change}</td>
                    <td>${record.balance}</td>
                    <td>${record.action}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildBondHistoryTable(tableData, tableElementId) {
    if (!tableElementId || typeof tableElementId !== 'string') {
        throw new Error('tableElementId must be a non-empty string');
    }

    const tableElement = document.getElementById(tableElementId);
    if (!(tableElement instanceof HTMLTableElement)) {
        throw new Error('Not a valid HTMLTableElement');
    }

    tableElement.innerHTML = `
        <thead>
        <tr>
            <th>#</th>
            <th>Date</th>
            <th>Change</th>
            <th>Count</th>
            <th>Cash</th>
            <th>Profit</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
            <tr class="summary-row">
                <td colspan="2">Value</td>
                <td>${tableData.value}</td>
                <td colspan="4">${tableData.valueDate}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${tableData.xirr}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Total Cash</td>
                <td colspan="5">${tableData.totalCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Buy Cash</td>
                <td colspan="5">${tableData.buyCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Interest Cash</td>
                <td colspan="5">${tableData.interestCash}</td>
            </tr>
            ${tableData.history.map(record => `
                <tr>
                    <td>${record.index}</td>
                    <td>${record.date}</td>
                    <td>${record.change}</td>
                    <td>${record.count}</td>
                    <td>${record.cash}</td>
                    <td>${record.profit}</td>
                    <td>${record.action}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildIndexHistoryTable(tableData, tableElementId) {
    if (!tableElementId || typeof tableElementId !== 'string') {
        throw new Error('tableElementId must be a non-empty string');
    }

    const tableElement = document.getElementById(tableElementId);
    if (!(tableElement instanceof HTMLTableElement)) {
        throw new Error('Not a valid HTMLTableElement');
    }

    tableElement.innerHTML = `
        <thead>
        <tr>
            <th>#</th>
            <th>Date</th>
            <th>Change</th>
            <th>Count</th>
            <th>Cash</th>
            <th>Profit</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
            <tr class="summary-row">
                <td colspan="2">Value</td>
                <td>${tableData.value}</td>
                <td colspan="4">${tableData.valueDate}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${tableData.xirr}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Total Cash</td>
                <td colspan="5">${tableData.totalCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Buy Cash</td>
                <td colspan="5">${tableData.buyCash}</td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">Sell Cash</td>
                <td colspan="5">${tableData.sellCash}</td>
            </tr>
            ${tableData.history.map(record => `
                <tr>
                    <td>${record.index}</td>
                    <td>${record.date}</td>
                    <td>${record.change}</td>
                    <td>${record.count}</td>
                    <td>${record.cash}</td>
                    <td>${record.profit}</td>
                    <td>${record.action}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildAssetHistoryTables(tablesData, divElementId) {
    if (!divElementId || typeof divElementId !== 'string') {
        throw new Error('divElementId must be a non-empty string');
    }

    const divElement = document.getElementById(divElementId);
    if (!(divElement instanceof HTMLDivElement)) {
        throw new Error('Not a HTMLDivElement');
    }

    // Construct the tables HTML
    divElement.innerHTML = tablesData.tables.map(table => `
        <div class="table-container">
            <h2>${table.title}</h2>
            <table id="${table.id}">
            </table>
        </div>
    `).join('');

    // Build each individual table based on its properties
    tablesData.tables.forEach(table => {
        const tableData = table.table;

        // Determine table type based on properties present
        if (tableData.hasOwnProperty('interestCash') && !tableData.hasOwnProperty('value')) {
            // Cash history table - has interestCash but no value/xirr
            buildCashHistoryTable(tableData, table.id);
        } else if (tableData.hasOwnProperty('incomeCash')) {
            // Stock history table - has incomeCash (unique to stocks)
            buildStockHistoryTable(tableData, table.id);
        } else if (tableData.hasOwnProperty('interestCash') && tableData.hasOwnProperty('value')) {
            // Bond history table - has both interestCash and value/xirr
            buildBondHistoryTable(tableData, table.id);
        } else if (tableData.hasOwnProperty('sellCash')) {
            // Index fund history table - has sellCash but not incomeCash
            buildIndexHistoryTable(tableData, table.id);
        } else {
            // Fallback to summary table building
            buildSummaryTable(tableData, table.id);
        }
    });
}
