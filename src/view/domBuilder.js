// DOM building functions for different table types

function formatXirrValue(value) {
    if (
        value === null
        || value === undefined
        || value === 'NaN'
        || value === 'Infinity'
        || value === '-Infinity'
        || (typeof value === 'number' && !Number.isFinite(value))
    ) {
        return '<span title="XIRR calculation failed">⚠️</span>';
    }
    return value;
}

function formatXirrPair(xirrCustom, xirrLib) {
    return `${formatXirrValue(xirrCustom)}/${formatXirrValue(xirrLib)}`;
}

function buildAssetsOverviewTable(tableData, tableElementId) {
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
                    <td>${formatXirrPair(asset.xirrCustom, asset.xirrLib)}</td>
                    <td>${asset.currency}</td>
                    <td>${asset.assetCode}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildStockHistoryTable(tableData) {
    return `
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
                <td colspan="4">
                    ${tableData.valueDate}
                    ${tableData.valueDateWarn ? "⚠️" : ""}
                </td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${formatXirrPair(tableData.xirrCustom, tableData.xirrLib)}</td>
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
            ${tableData.history.toReversed().map((record, index) => `
                <tr>
                    <td>${index + 1}</td>
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

function buildCashHistoryTable(tableData) {
    return `
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
            ${tableData.history.toReversed().map((record, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${record.date}</td>
                    <td>${record.change}</td>
                    <td>${record.balance}</td>
                    <td>${record.action}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
}

function buildBondHistoryTable(tableData) {
    return `
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
                <td colspan="4">
                    ${tableData.valueDate}
                    ${tableData.valueDateWarn ? "⚠️" : ""}
                </td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${formatXirrPair(tableData.xirrCustom, tableData.xirrLib)}</td>
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
            ${tableData.history.toReversed().map((record, index) => `
                <tr>
                    <td>${index + 1}</td>
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

function buildIndexHistoryTable(tableData) {
    return `
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
                <td colspan="4">
                    ${tableData.valueDate}
                    ${tableData.valueDateWarn ? "⚠️" : ""}
                </td>
            </tr>
            <tr class="summary-row">
                <td colspan="2">XIRR</td>
                <td colspan="5">${formatXirrPair(tableData.xirrCustom, tableData.xirrLib)}</td>
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
            ${tableData.history.toReversed().map((record, index) => `
                <tr>
                    <td>${index + 1}</td>
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

    let htmlContent = '';

    // Build Cash tables
    if (tablesData.cashList && tablesData.cashList.length > 0) {
        htmlContent += '<h1>Cash Holdings</h1>';
        tablesData.cashList.forEach(table => {
            htmlContent += `
                <div class="table-container">
                    <h2>${table.title}</h2>
                    <table id="${table.id}">
                        ${buildCashHistoryTable(table.table)}
                    </table>
                </div>
            `;
        });
    }

    // Build Stock tables
    if (tablesData.stockList && tablesData.stockList.length > 0) {
        htmlContent += '<h1>Stock Holdings</h1>';
        tablesData.stockList.forEach(table => {
            htmlContent += `
                <div class="table-container">
                    <h2>${table.title}</h2>
                    <table id="${table.id}">
                        ${buildStockHistoryTable(table.table)}
                    </table>
                </div>
            `;
        });
    }

    // Build Index Fund tables
    if (tablesData.indexFundList && tablesData.indexFundList.length > 0) {
        htmlContent += '<h1>Index Fund Holdings</h1>';
        tablesData.indexFundList.forEach(table => {
            htmlContent += `
                <div class="table-container">
                    <h2>${table.title}</h2>
                    <table id="${table.id}">
                        ${buildIndexHistoryTable(table.table)}
                    </table>
                </div>
            `;
        });
    }

    // Build Bond tables
    if (tablesData.bondList && tablesData.bondList.length > 0) {
        htmlContent += '<h1>Bond Holdings</h1>';
        tablesData.bondList.forEach(table => {
            htmlContent += `
                <div class="table-container">
                    <h2>${table.title}</h2>
                    <table id="${table.id}">
                        ${buildBondHistoryTable(table.table)}
                    </table>
                </div>
            `;
        });
    }

    divElement.innerHTML = htmlContent;
}

function buildPortfolioSummaryTables(summaryData, divElementId) {
    if (!divElementId || typeof divElementId !== 'string') {
        throw new Error('divElementId must be a non-empty string');
    }

    const divElement = document.getElementById(divElementId);
    if (!(divElement instanceof HTMLDivElement)) {
        throw new Error('Not a HTMLDivElement');
    }

    let htmlContent = '';

    htmlContent += `
        <div class="table-container">
            <h2>Total Value by Currency</h2>
            <table id="total-value-by-currency">
                <thead>
                    <tr>
                        <th>Currency</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                        ${Array.from(summaryData.totalValueByCurrency.entries()).map(([currency, value]) => `
                            <tr class="summary-row">
                                <td>${currency}</td>
                                <td>${value}</td>
                            </tr>
                        `).join('')}
                    </tbody>
            </table>
        </div>
    `;

    divElement.innerHTML = htmlContent;
}

function buildEstonianTaxFreeRemainderTable(tableData, divElementId) {
    if (!divElementId || typeof divElementId !== 'string') {
        throw new Error('divElementId must be a non-empty string');
    }

    const divElement = document.getElementById(divElementId);
    if (!(divElement instanceof HTMLDivElement)) {
        throw new Error('Not a HTMLDivElement');
    }

    let htmlContent = `
        <p><strong>Disclaimer:</strong> For now, all dividends are treated as already taxed in this view, even when the imported taxed amount is 0.</p>
    `;

    tableData.forEach(platform => {
        htmlContent += `
            <div class="table-container">
                <h2>${platform.platformName}</h2>
                <table id="estonian-tax-free-remainder-${platform.platformName}">
                    <thead>
                        <tr>
                            <th>Year</th>
                            ${platform.sumTable.currenciesCol.map(currency => `<th>${currency}</th>`).join('')}
                        </tr>
                        </thead>
                        <tbody>
                            ${platform.sumTable.yearsRow.map((year, row) => `
                                <tr class="summary-row">
                                    <td>${year}</td>
                                    ${platform.sumTable.table[row].map(value => `<td>${value}</td>`).join('')}
                            `).join('')}
                        </tbody>
                </table>
            </div>
        `;
    });

    divElement.innerHTML = htmlContent;
}

// Portfolio chart singleton, kept so we can dispose/resize on reload
let _portfolioChartInstance = null;

function buildPortfolioChart(tablesData, divElementId) {
    if (!divElementId || typeof divElementId !== 'string') {
        throw new Error('divElementId must be a non-empty string');
    }
    const divElement = document.getElementById(divElementId);
    if (!(divElement instanceof HTMLDivElement)) {
        throw new Error('Not a HTMLDivElement');
    }
    if (typeof echarts === 'undefined') {
        divElement.innerText = 'Chart library (ECharts) failed to load.';
        return;
    }

    if (_portfolioChartInstance) {
        _portfolioChartInstance.dispose();
        _portfolioChartInstance = null;
    }

    const cashSeries = (tablesData.cashList || []).map(holding => ({
        name: holding.title,
        type: 'line',
        step: 'end',
        showSymbol: true,
        symbolSize: 5,
        emphasis: { focus: 'series' },
        data: (holding.table.history || []).map(record => [
            parsePortfolioViewDate(record.date),
            record.balance,
            record.action,
            record.change,
        ]),
    }));

    const hasData = cashSeries.some(series => series.data.length > 0);
    if (!hasData) {
        divElement.innerHTML = '<p>No cash history to display. Load a portfolio to see the chart.</p>';
        return;
    }

    const legendNames = cashSeries.map(series => series.name);
    const option = {
        title: {
            text: 'Cash balance over time',
            subtext: 'One line per cash holding (values are in each holding\'s own currency)',
            left: 'center',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            formatter: params => formatPortfolioChartTooltip(params),
        },
        legend: {
            type: 'scroll',
            data: legendNames,
            top: 50,
        },
        grid: { left: 60, right: 40, top: 100, bottom: 80 },
        xAxis: { type: 'time' },
        yAxis: { type: 'value', scale: true },
        dataZoom: [
            { type: 'inside' },
            { type: 'slider', bottom: 20 },
        ],
        series: cashSeries,
    };

    _portfolioChartInstance = echarts.init(divElement);
    _portfolioChartInstance.setOption(option);

    if (!buildPortfolioChart._resizeBound) {
        window.addEventListener('resize', () => {
            if (_portfolioChartInstance) {
                _portfolioChartInstance.resize();
            }
        });
        buildPortfolioChart._resizeBound = true;
    }
}

function parsePortfolioViewDate(viewDate) {
    if (typeof viewDate !== 'string') {
        return null;
    }
    const parts = viewDate.trim().split(/\s+/);
    if (parts.length !== 3) {
        const fallback = new Date(viewDate);
        return isNaN(fallback.getTime()) ? null : fallback;
    }
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const year = parseInt(parts[0], 10);
    const month = monthNames.indexOf(parts[1]);
    const day = parseInt(parts[2], 10);
    if (!Number.isFinite(year) || month < 0 || !Number.isFinite(day)) {
        return null;
    }
    return new Date(year, month, day);
}

function formatPortfolioChartTooltip(params) {
    if (!Array.isArray(params) || params.length === 0) {
        return '';
    }
    const axisDate = params[0].axisValueLabel || '';
    const rows = params.map(p => {
        const dataArr = Array.isArray(p.data) ? p.data : [];
        const balance = dataArr[1];
        const action = dataArr[2];
        const change = dataArr[3];
        const balanceStr = balance === undefined || balance === null ? '' : Number(balance).toLocaleString();
        const changeStr = change === undefined || change === null || change === 0
            ? ''
            : ` <span style="color:${Number(change) >= 0 ? '#2e7d32' : '#c62828'}">(${Number(change) >= 0 ? '+' : ''}${Number(change).toLocaleString()}${action ? ' ' + action : ''})</span>`;
        return `${p.marker}${p.seriesName}: <b>${balanceStr}</b>${changeStr}`;
    }).join('<br/>');
    return `<div style="font-weight:bold;margin-bottom:4px">${axisDate}</div>${rows}`;
}
