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
            ${tableData.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${tableData.body.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
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

    // For stock history, the first 6 rows are summary rows with special formatting
    const summaryRows = tableData.body.slice(0, 6);
    const historyRows = tableData.body.slice(6);

    tableElement.innerHTML = `
        <thead>
        <tr>
            ${tableData.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${summaryRows.map(row => `
                <tr class="summary-row">
                    <td colspan="2">${row[0]}</td>
                    <td colspan="${tableData.header.length - 2}">${row[1]}</td>
                </tr>
            `).join('')}
            ${historyRows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
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

    // For cash history, the first row is a summary row with special formatting
    const summaryRows = tableData.body.slice(0, 1);
    const historyRows = tableData.body.slice(1);

    tableElement.innerHTML = `
        <thead>
        <tr>
            ${tableData.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${summaryRows.map(row => `
                <tr class="summary-row">
                    <td colspan="2">${row[0]}</td>
                    <td colspan="${tableData.header.length - 2}">${row[1]}</td>
                </tr>
            `).join('')}
            ${historyRows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
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

    // For bond history, the first 5 rows are summary rows with special formatting
    const summaryRows = tableData.body.slice(0, 5);
    const historyRows = tableData.body.slice(5);

    tableElement.innerHTML = `
        <thead>
        <tr>
            ${tableData.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${summaryRows.map(row => `
                <tr class="summary-row">
                    <td colspan="2">${row[0]}</td>
                    <td colspan="${tableData.header.length - 2}">${row[1]}</td>
                </tr>
            `).join('')}
            ${historyRows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
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

    // For index history, the first 5 rows are summary rows with special formatting
    const summaryRows = tableData.body.slice(0, 5);
    const historyRows = tableData.body.slice(5);

    tableElement.innerHTML = `
        <thead>
        <tr>
            ${tableData.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${summaryRows.map(row => `
                <tr class="summary-row">
                    <td colspan="2">${row[0]}</td>
                    <td colspan="${tableData.header.length - 2}">${row[1]}</td>
                </tr>
            `).join('')}
            ${historyRows.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
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

    // Build each individual table based on its type
    tablesData.tables.forEach(table => {
        const tableType = table.table.type;
        switch (tableType) {
            case 'stock-history':
                buildStockHistoryTable(table.table, table.id);
                break;
            case 'cash-history':
                buildCashHistoryTable(table.table, table.id);
                break;
            case 'bond-history':
                buildBondHistoryTable(table.table, table.id);
                break;
            case 'index-history':
                buildIndexHistoryTable(table.table, table.id);
                break;
            default:
                // Fallback to basic table building
                buildSummaryTable(table.table, table.id);
        }
    });
}
