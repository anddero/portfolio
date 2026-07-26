// CONSTANTS

const ALL_POSSIBLE_JSON_FIELDS = [
    "date",
    "action",
    "platform",
    "assetType",
    "assetCode",
    "totalShares",
    "currency",
    "unitValue",
    "totalValue",
    "feeValue",
    "grossValue",
    "netValue",
    "taxValue",
    "fromPlatform",
    "toPlatform",
    "fromCurrency",
    "toCurrency",
    "fromValue",
    "toValue",
    "fromTotalShares",
    "toTotalShares",
    "fromToCoefficient",
    "friendlyName",
    "notes"
];

// Boolean tells whether the action requires an asset type to be specified.
const ACTIONS = Object.freeze({
    "Check": true,
    "NewPlatform": false,
    "NewAsset": true,
    "Buy": true,
    "Deposit": true,
    "Dividend": true,
    "CurrencyConversion": true,
    "PublicToPrivateShareConversion": true,
    "Split": true,
    "Transfer": true,
    "UnspecificAccountingIncomeAction": true,
    "Sell": true,
    "Interest": true
});

const ASSET_TYPES = [
    "Cash",
    "Stock",
    "Bond",
    "IndexFund",
    "EstonianTaxFreeCashRemainder"
];

// STATE

let gActivityList = []; // Raw activity JSON
let gActivityErrorMap = new Map(); // Errors in the activity JSON, where key is activity index and value is error message
let gPortfolioState = {}; // Portfolio structured state such as overview, individual asset summaries, etc
let gLogEditorState = {
    mode: "none", // "none" | "insert" | "edit"
    editIndex: null, // index into gActivityList when mode === "edit"
    draft: null,
};

// EVENT BINDINGS

document.getElementById('importLogInput').addEventListener('change', onImportLogInputChange);
document.getElementById('updateLogButton').addEventListener('click', onUpdateLogButtonClick);
document.getElementById('exportLogButton').addEventListener('click', onExportLogButtonClick);

// EVENT HANDLERS

function setStatusMessage(message, isError) {
    document.getElementById("importLogInputMsg").innerText = message;
    document.getElementById("importLogInputMsg").style = `color: ${isError ? "red" : "green"};`;
}

function reloadAllTables() {
    tryReloadTable("logTable", reloadLogTable);
    tryReloadTable("portfolioSummaryContainer", reloadPortfolioSummaryTables);
    tryReloadTable("assetsOverviewTable", reloadAssetsOverviewTable);
    tryReloadTable("assetSummaryContainer", reloadAssetHistoryTables);
    tryReloadTable("estonianTaxFreeRemainderContainer", reloadEstonianTaxFreeRemainderTable);
}

function setStatusMessageFromProcessingOutcome(activityErrorMap, criticalErrorOccurred) {
    if (activityErrorMap.size > 0) {
        if (criticalErrorOccurred) {
            setStatusMessage(`You have ${activityErrorMap.size} issue(s), where the last detected issue is a critical error. The log processing is incomplete and calculated data partial! See table below for the line where the issue occurred. Please fix the issue and reload the log.`, true);
        } else {
            setStatusMessage(`You have ${activityErrorMap.size} warning(s). See table below for the lines where they occurred. The entire log has been processed and it is safe to continue if you choose to ignore the warnings.`, true);
        }
    } else {
        setStatusMessage("All good.", false);
    }
}

async function processCurrentActivityAndReloadAllViews() {
    let portfolioObj;
    let activityErrorMap;
    let criticalErrorOccurred;
    [portfolioObj, activityErrorMap, criticalErrorOccurred] = await processActivityList(gActivityList);
    gPortfolioState = portfolioObj;
    gActivityErrorMap = activityErrorMap;
    setStatusMessageFromProcessingOutcome(activityErrorMap, criticalErrorOccurred);
    reloadAllTables();
}

// Reset all global state, process and validate the given file, set the global state and update DOM
async function onImportLogInputChange(event) {
    console.log("onImportLogInputChange");

    const file = event.target.files[0];
    if (!file) {
        gActivityList = [];
        gActivityErrorMap = new Map();
        gPortfolioState = {};
        setStatusMessage("No file selected.", true);
        reloadAllTables();
        return;
    }

    try {
        gActivityList = await readJsonFile(file); // await very much needed here as readJsonFile cannot be made sync function
        await processCurrentActivityAndReloadAllViews();
    } catch (error) {
        console.error(error);
        gActivityErrorMap = new Map();
        gPortfolioState = {};
        setStatusMessage(`Critical error, no data has been processed. Please fix the issue and reload the log. Error: ${error.message}`, true);
        reloadAllTables();
    }
}

// Reload the portfolio summary table view, based on global portfolio object
function reloadPortfolioSummaryTables(id) {
    const tableData = gPortfolioState.getPortfolioSummaryTablesView();
    buildPortfolioSummaryTables(tableData, id);
}

// Reload the assets overview table view, based on global portfolio object
function reloadAssetsOverviewTable(id) {
    const tableData = gPortfolioState.getAssetsOverviewTableView();
    buildAssetsOverviewTable(tableData, id);
}

// Reload the asset history tables view, based on global portfolio object
function reloadAssetHistoryTables(id) {
    const tablesData = gPortfolioState.getAssetHistoryTablesView();
    buildAssetHistoryTables(tablesData, id);
}

function reloadEstonianTaxFreeRemainderTable(id) {
    const tableData = gPortfolioState.getEstonianTaxFreeRemainderTableView();
    buildEstonianTaxFreeRemainderTable(tableData, id);
}

function reloadErrorTable(id, msg) {
    const el = document.getElementById(id);
    // if el is a div, create a table inside it
    let errorTable = null;
    if (el instanceof HTMLTableElement) {
        errorTable = el;
    } else if (el instanceof HTMLDivElement) {
        errorTable = document.createElement("table");
        el.innerHTML = ''; // Clear the div
        el.appendChild(errorTable);
    } else {
        throw new Error(`Element with id "${id}" is neither a table nor a div.`);
    }
    errorTable.innerHTML = `
        <thead>
        <tr>
            <th>Failure</th>
        </tr>
        </thead>
        <tbody>
            <td>${msg}</td>
        </tbody>
        `;
    // Style bold and red
    errorTable.style.fontWeight = "bold";
    errorTable.style.color = "red";
}

function tryReloadTable(id, loader) {
    try {
        validateNonBlankString(id).getOrThrow('id');
        if (typeof loader !== 'function') {
            throw new Error('Loader must be a function');
        }
        loader(id);
    } catch (e) {
        console.error(`Error while reloading table ${id}:`, e);
        reloadErrorTable(id, `Error while reloading table ${id}: ${e.message}`);
    }
}

// Reload the activity table view, based on global activity list and error map
function reloadLogTable(id) {
    const logTable = document.getElementById(id);
    logTable.innerHTML = `
        <thead>
        <tr>
            ${['#'].concat(ALL_POSSIBLE_JSON_FIELDS).map(field => `<th>${field}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
        </tbody>
        `;

    const tbody = logTable.getElementsByTagName("tbody")[0];
    const rowLength = ALL_POSSIBLE_JSON_FIELDS.length + 1; // +1 for index/actions column

    if (gLogEditorState.mode === "none") {
        const appendRow = document.createElement("tr");
        appendRow.innerHTML = `
            <td colspan="${rowLength}">
                <button type="button" onclick="onStartAddLogRecord()">+</button>
            </td>
        `;
        tbody.appendChild(appendRow);
    } else if (gLogEditorState.mode === "insert") {
        const draft = gLogEditorState.draft ?? getDefaultLogRecordDraft();
        const saveDisabled = !canSaveDraftRecord(draft);
        const editorRow = document.createElement("tr");
        editorRow.innerHTML = `<td>${buildLogEditorActionButtons(saveDisabled)}</td>${ALL_POSSIBLE_JSON_FIELDS.map(field => `<td>${buildLogEditorInputByField(field, draft)}</td>`).join('')}`;
        tbody.appendChild(editorRow);
    }

    for (const [i, item] of gActivityList.toReversed().entries()) {
        const actualIndex = gActivityList.length - i - 1;
        const rowNo = actualIndex + 1;
        const row = document.createElement("tr");
        if (gLogEditorState.mode === "edit" && gLogEditorState.editIndex === actualIndex) {
            const draft = gLogEditorState.draft ?? getDefaultLogRecordDraft();
            const saveDisabled = !canSaveDraftRecord(draft);
            row.innerHTML = `<td>${rowNo}${buildLogEditorActionButtons(saveDisabled)}</td>${ALL_POSSIBLE_JSON_FIELDS.map(field => `<td>${buildLogEditorInputByField(field, draft)}</td>`).join('')}`;
        } else {
            row.innerHTML = [`<td>${rowNo}${buildLogRowActionButtons(actualIndex)}</td>`]
                .concat(ALL_POSSIBLE_JSON_FIELDS.map(field => `<td>${item[field] === undefined ? '' : escapeHtml(item[field])}</td>`))
                .join('');
        }
        tbody.appendChild(row);
        if (gActivityErrorMap.has(actualIndex)) {
            const errorRow = document.createElement("tr");
            errorRow.innerHTML = `
                    <td colspan="${rowLength}"style="color: red;">
                        Applies to the above record: ${escapeHtml(gActivityErrorMap.get(actualIndex))}
                    </td>
                `
            tbody.appendChild(errorRow);
        }
    }
}

function getDefaultLogRecordDraft() {
    return {
        date: dateToInputIso(new Date()),
        action: "Check",
        platform: "",
        assetType: "Cash",
        assetCode: "",
        totalShares: "",
        currency: "",
        unitValue: "",
        totalValue: "",
        feeValue: "",
        grossValue: "",
        netValue: "",
        taxValue: "",
        fromPlatform: "",
        toPlatform: "",
        fromCurrency: "",
        toCurrency: "",
        fromValue: "",
        toValue: "",
        fromTotalShares: "",
        toTotalShares: "",
        fromToCoefficient: "",
        friendlyName: "",
        notes: "",
    };
}

function onStartAddLogRecord() {
    gLogEditorState.mode = "insert";
    gLogEditorState.editIndex = null;
    gLogEditorState.draft = getDefaultLogRecordDraft();
    tryReloadTable("logTable", reloadLogTable);
}

function onStartEditLogRecord(index) {
    if (gLogEditorState.mode !== "none") {
        return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= gActivityList.length) {
        return;
    }
    gLogEditorState.mode = "edit";
    gLogEditorState.editIndex = index;
    gLogEditorState.draft = buildDraftFromItem(gActivityList[index]);
    tryReloadTable("logTable", reloadLogTable);
}

function onCancelAddLogRecord() {
    gLogEditorState.mode = "none";
    gLogEditorState.editIndex = null;
    gLogEditorState.draft = null;
    tryReloadTable("logTable", reloadLogTable);
}

function onLogDraftInputChange(field, value) {
    if (gLogEditorState.mode === "none") {
        return;
    }
    const draft = gLogEditorState.draft;
    draft[field] = value;

    if (field === "action" && !ACTIONS[draft.action]) {
        draft.assetType = "";
        draft.assetCode = "";
    }
    if (field === "platform" || field === "assetType" || field === "action") {
        normalizeDraftAssetCode(draft);
    }
    if (field === "assetCode") {
        applyAssetDefaultsToDraft(draft);
    }

    tryReloadTable("logTable", reloadLogTable);
}

function onSaveAddLogRecord() {
    if (gLogEditorState.mode === "none") {
        return;
    }
    const draft = gLogEditorState.draft;
    if (!canSaveDraftRecord(draft)) {
        return;
    }

    let newItem;
    try {
        newItem = buildRawItemFromDraft(draft);
    } catch (error) {
        setStatusMessage(`Cannot save record: ${error.message}`, true);
        return;
    }

    if (gLogEditorState.mode === "insert") {
        gActivityList = gActivityList.concat([newItem]);
        setStatusMessage("Record appended. Click Update to recalculate.", false);
    } else if (gLogEditorState.mode === "edit") {
        const index = gLogEditorState.editIndex;
        if (!Number.isInteger(index) || index < 0 || index >= gActivityList.length) {
            setStatusMessage("Cannot save record: invalid edit index.", true);
            return;
        }
        const updated = gActivityList.slice();
        updated[index] = newItem;
        gActivityList = updated;
        setStatusMessage("Record updated. Click Update to recalculate.", false);
    }
    gActivityErrorMap = new Map();
    gLogEditorState.mode = "none";
    gLogEditorState.editIndex = null;
    gLogEditorState.draft = null;
    tryReloadTable("logTable", reloadLogTable);
}

function onDeleteLogRecord(index) {
    if (gLogEditorState.mode !== "none") {
        return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= gActivityList.length) {
        return;
    }
    if (!window.confirm(`Delete record #${index + 1}? This cannot be undone.`)) {
        return;
    }
    const updated = gActivityList.slice();
    updated.splice(index, 1);
    gActivityList = updated;
    gActivityErrorMap = new Map();
    setStatusMessage("Record deleted. Click Update to recalculate.", false);
    tryReloadTable("logTable", reloadLogTable);
}

function onMoveLogRecord(index, direction) {
    if (gLogEditorState.mode !== "none") {
        return;
    }
    if (!Number.isInteger(index) || index < 0 || index >= gActivityList.length) {
        return;
    }
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= gActivityList.length) {
        return;
    }
    const updated = gActivityList.slice();
    const tmp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = tmp;
    gActivityList = updated;
    gActivityErrorMap = new Map();
    setStatusMessage("Record moved. Click Update to recalculate.", false);
    tryReloadTable("logTable", reloadLogTable);
}

function buildRawItemFromDraft(draft) {
    const expectedFields = getExpectedFieldsForDraft(draft);
    if (expectedFields === undefined) {
        throw new Error("Action and asset type combination is not supported");
    }
    const item = {};
    expectedFields.forEach(field => {
        const value = draft[field];
        if ((field === "notes" || field === "feeValue") && isBlank(value)) {
            return;
        }
        if (field === "date") {
            item[field] = inputDateIsoToDotDate(value);
            return;
        }
        item[field] = value;
    });
    return item;
}

function getExpectedFieldsForDraft(draft) {
    if (isBlank(draft.action)) {
        return undefined;
    }
    if (!ACTIONS[draft.action]) {
        return getInputsByActionAndAsset(draft.action, undefined);
    }
    if (isBlank(draft.assetType)) {
        return undefined;
    }
    return getInputsByActionAndAsset(draft.action, draft.assetType);
}

function canSaveDraftRecord(draft) {
    const expectedFields = getExpectedFieldsForDraft(draft);
    if (expectedFields === undefined) {
        return false;
    }
    const optionalFields = new Set(["notes", "feeValue"]);
    for (const field of expectedFields) {
        if (!optionalFields.has(field) && isBlank(draft[field])) {
            return false;
        }
    }
    return true;
}

function buildLogEditorActionButtons(saveDisabled) {
    return `
        <button type="button" onclick="onSaveAddLogRecord()" ${saveDisabled ? "disabled" : ""}>Save</button>
        <button type="button" onclick="onCancelAddLogRecord()">Cancel</button>
    `;
}

function buildLogRowActionButtons(index) {
    const disableUp = index === gActivityList.length - 1 ? "disabled" : "";
    const disableDown = index === 0 ? "disabled" : "";
    return `
        <div class="log-row-actions">
            <button type="button" title="Edit" onclick="onStartEditLogRecord(${index})">✎</button>
            <button type="button" title="Move up" onclick="onMoveLogRecord(${index}, 1)" ${disableUp}>↑</button>
            <button type="button" title="Move down" onclick="onMoveLogRecord(${index}, -1)" ${disableDown}>↓</button>
            <button type="button" title="Delete" onclick="onDeleteLogRecord(${index})">✕</button>
        </div>
    `;
}

function buildDraftFromItem(item) {
    const draft = {};
    ALL_POSSIBLE_JSON_FIELDS.forEach(field => {
        const v = item[field];
        draft[field] = v === undefined || v === null ? "" : String(v);
    });
    if (!isBlank(draft.date)) {
        draft.date = draft.date.replaceAll(".", "-");
    }
    return draft;
}

function buildLogEditorInputByField(field, draft) {
    const expectedFields = getExpectedFieldsForDraft(draft) ?? [];
    const disabled = isDraftFieldEditable(field, draft, expectedFields) ? "" : "disabled";
    const value = draft[field] ?? "";

    switch (field) {
        case "date":
            return `<input type="date" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('date', this.value)" ${disabled}>`;
        case "action":
            return `
                <select onchange="onLogDraftInputChange('action', this.value)">
                    ${Object.getOwnPropertyNames(ACTIONS).map(action => `<option value="${escapeHtml(action)}" ${action === value ? "selected" : ""}>${action}</option>`).join('')}
                </select>
            `;
        case "assetType":
            return `
                <select onchange="onLogDraftInputChange('assetType', this.value)" ${disabled}>
                    <option value=""></option>
                    ${ASSET_TYPES.map(assetType => `<option value="${escapeHtml(assetType)}" ${assetType === value ? "selected" : ""}>${assetType}</option>`).join('')}
                </select>
            `;
        case "platform":
        case "fromPlatform":
        case "toPlatform":
            if (shouldUseTextInputForPlatform(field, draft)) {
                return `<input type="text" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>`;
            }
            return `
                <select onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>
                    <option value=""></option>
                    ${getKnownPlatforms().map(platform => `<option value="${escapeHtml(platform)}" ${platform === value ? "selected" : ""}>${platform}</option>`).join('')}
                </select>
            `;
        case "assetCode":
            if (draft.action === "NewAsset") {
                return `<input type="text" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('assetCode', this.value)" ${disabled}>`;
            }
            return `
                <select onchange="onLogDraftInputChange('assetCode', this.value)" ${disabled}>
                    <option value=""></option>
                    ${getKnownAssetsForSelection(draft).map(asset => `<option value="${escapeHtml(asset.code)}" ${asset.code === value ? "selected" : ""}>${escapeHtml(asset.friendlyName)} (${escapeHtml(asset.code)})</option>`).join('')}
                </select>
            `;
        case "currency":
            if (draft.action === "NewAsset" && draft.assetType === "Cash") {
                return `<input type="text" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>`;
            }
            return `
                <select onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>
                    <option value=""></option>
                    ${getKnownCurrenciesForDraftField(field, draft).map(currency => `<option value="${escapeHtml(currency)}" ${currency === value ? "selected" : ""}>${currency}</option>`).join('')}
                </select>
            `;
        case "fromCurrency":
        case "toCurrency":
            return `
                <select onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>
                    <option value=""></option>
                    ${getKnownCurrenciesForDraftField(field, draft).map(currency => `<option value="${escapeHtml(currency)}" ${currency === value ? "selected" : ""}>${currency}</option>`).join('')}
                </select>
            `;
        case "notes":
        case "friendlyName":
            return `<input type="text" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>`;
        case "totalShares":
        case "unitValue":
        case "totalValue":
        case "feeValue":
        case "grossValue":
        case "netValue":
        case "taxValue":
        case "fromValue":
        case "toValue":
        case "fromTotalShares":
        case "toTotalShares":
        case "fromToCoefficient":
            return `<input type="number" step="any" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>`;
        default:
            return `<input type="text" value="${escapeHtml(value)}" onchange="onLogDraftInputChange('${field}', this.value)" ${disabled}>`;
    }
}

function shouldUseTextInputForPlatform(field, draft) {
    return draft.action === "NewPlatform" && field === "platform";
}

function isDraftFieldEditable(field, draft, expectedFields) {
    if (field === "action" || field === "date" || field === "notes") {
        return true;
    }
    if (field === "assetType") {
        return isBlank(draft.action) || ACTIONS[draft.action] === true;
    }
    if (field === "platform") {
        return draft.action !== "Transfer";
    }
    if (field === "fromPlatform" || field === "toPlatform") {
        return draft.action === "Transfer";
    }
    if (field === "fromCurrency" || field === "toCurrency") {
        return draft.action === "CurrencyConversion";
    }
    if (ACTIONS[draft.action] && isBlank(draft.assetType)) {
        return false;
    }
    return expectedFields.includes(field);
}

function getKnownPlatforms() {
    if (!(gPortfolioState instanceof Portfolio)) {
        return [];
    }
    return gPortfolioState.getPlatforms().map(p => p.getName());
}

function getKnownCurrenciesForDraftField(field, draft) {
    const platform = getCurrencySourcePlatform(field, draft);
    if (isBlank(platform)) {
        return [];
    }
    return getKnownCashCurrenciesByPlatform(platform);
}

function getCurrencySourcePlatform(field, draft) {
    if (field === "currency" && draft.action === "Transfer") {
        return draft.fromPlatform;
    }
    return draft.platform;
}

function getKnownCashCurrenciesByPlatform(platformName) {
    if (!(gPortfolioState instanceof Portfolio) || !gPortfolioState.hasPlatform(platformName)) {
        return [];
    }
    return gPortfolioState.getPlatform(platformName).getCashHoldings().map(h => h.getCurrency());
}

function getKnownAssetsByPlatformAndType(platformName, assetType) {
    if (isBlank(platformName) || isBlank(assetType)) {
        return [];
    }
    if (!(gPortfolioState instanceof Portfolio) || !gPortfolioState.hasPlatform(platformName)) {
        return [];
    }
    const platform = gPortfolioState.getPlatform(platformName);
    let holdings;
    switch (assetType) {
        case "Stock":
            holdings = platform.getStockHoldings();
            break;
        case "IndexFund":
            holdings = platform.getIndexFundHoldings();
            break;
        case "Bond":
            holdings = platform.getBondHoldings();
            break;
        default:
            return [];
    }
    return holdings.map(h => ({
        code: h.getCode(),
        friendlyName: h.getFriendlyName(),
        currency: h.getCurrency(),
    }));
}

function getKnownAssetsForSelection(draft) {
    return getKnownAssetsByPlatformAndType(draft.platform, draft.assetType);
}

function normalizeDraftAssetCode(draft) {
    if (draft.action === "NewAsset") {
        return;
    }
    const options = getKnownAssetsForSelection(draft);
    if (options.length === 0) {
        draft.assetCode = "";
        return;
    }
    const exists = options.some(asset => asset.code === draft.assetCode);
    if (!exists) {
        draft.assetCode = "";
    }
}

function applyAssetDefaultsToDraft(draft) {
    if (draft.action === "NewAsset" || isBlank(draft.assetCode)) {
        return;
    }
    const asset = getKnownAssetsForSelection(draft).find(item => item.code === draft.assetCode);
    if (!asset) {
        return;
    }
    if (!isBlank(asset.friendlyName)) {
        draft.friendlyName = asset.friendlyName;
    }
    if (!isBlank(asset.currency) && isBlank(draft.currency)) {
        draft.currency = asset.currency;
    }
}

function isBlank(value) {
    return typeof value !== "string" || value.trim() === "";
}

function dateToInputIso(date) {
    const d = getLocalDate(date);
    return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function inputDateIsoToDotDate(isoDate) {
    if (isBlank(isoDate)) {
        throw new Error("Date is missing");
    }
    return isoDate.replaceAll("-", ".");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function onExportLogButtonClick() {
    console.log("onExportLogButtonClick");

    const dataStr = JSON.stringify(gActivityList, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const downloadElement = document.createElement("a");
    downloadElement.href = url;
    downloadElement.download = "portfolio.json";
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
}

async function onUpdateLogButtonClick() {
    if (!Array.isArray(gActivityList) || gActivityList.length === 0) {
        setStatusMessage("No log data to update.", true);
        return;
    }
    try {
        await processCurrentActivityAndReloadAllViews();
    } catch (error) {
        setStatusMessage(`Critical error, no data has been processed. Please fix the issue and reload the log. Error: ${error.message}`, true);
    }
}

// FUNCTIONS WITHOUT SIDE EFFECTS

// Omit "async" as we must explicitly return "Promise" here anyway due to FileReader,
// which is not promise-based. Function is still await-able.
function readJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                resolve(JSON.parse(e.target.result));
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error("Failed to read file."));

        reader.readAsText(file);
    });
}

/*
 * Process the given activity log JSON, which is expected to be an array of action items.
 * Each item is processed sequentially.
 * Return a tuple of [calculated portfolio state; map of errors/warnings; whether an error has occurred].
 *
 * In the returned map of errors, the key is the index of the activity item and the value is the error message.
 * If no errors occurred, the map will be empty.
 * If an error has occurred, the processing stops and the calculated portfolio state will be partial.
 * If an error has not occurred, the map will only contain warnings (if any). All data will be successfully processed.
 *
 * Throw in case of a critical error which isn't tied to a specific activity item.
 */
async function processActivityList(activityFileJson) {
    if (!Array.isArray(activityFileJson)) {
        throw new Error("Top-level JSON must be an array.");
    }

    if (activityFileJson.length === 0) {
        throw new Error("Activity JSON is empty.");
    }

    let portfolioObj = new Portfolio();
    let activityErrorMap = new Map();

    let criticalErrorOccurred = false;
    for (const [i, item] of activityFileJson.entries()) {
        try {
            let warnings = processAction(item, portfolioObj);
            if (warnings.length > 0) {
                activityErrorMap.set(i, `You have ${warnings.length} warning(s): ${warnings.join(' ')}`);
            }
        } catch (error) {
            activityErrorMap.set(i, `Critical error occurred, further processing stopped: ${error.message}`);
            criticalErrorOccurred = true;
            break;
        }
    }

    if (!criticalErrorOccurred) {
        // Validation will fail if another critical error stopped the processing, causing it to overwrite the original issue,
        // which is why we want to run it conditionally.
        await portfolioObj.validateAndFinalize();
    }

    return [portfolioObj, activityErrorMap, criticalErrorOccurred];
}

/*
 * Process a single action item from the activity log, updating the given portfolio state.
 * Return a list of warnings (maybe empty).
 * Throw in case of a critical error in which case the activity item may not be correctly processed.
 */
function processAction(item, portfolioObj) {
    item = parseActionInputsByNames(item).getOrThrow('Problem parsing input');

    portfolioObj.setSameOrLaterDate(item.date)
        .getOrThrow('Record not in chronological order with previous record');

    // Process the action with a dedicated function
    switch (item.action) {
        case "NewPlatform":
            return processActionNewPlatform(item, portfolioObj);
        case "NewAsset":
            return processActionNewAsset(item, portfolioObj);
        case "Check":
            return processActionCheck(item, portfolioObj);
        case "Deposit":
            return processActionDeposit(item, portfolioObj);
        case "Buy":
            return processActionBuy(item, portfolioObj);
        case "Sell":
            return processActionSell(item, portfolioObj);
        case "Dividend":
            return processActionDividend(item, portfolioObj);
        case "CurrencyConversion":
            return processActionCurrencyConversion(item, portfolioObj);
        case "Transfer":
            return processActionTransfer(item, portfolioObj);
        case "UnspecificAccountingIncomeAction":
            return processActionUnspecificAccountingIncomeAction(item, portfolioObj);
        case "PublicToPrivateShareConversion":
            return processActionPublicToPrivateShareConversion(item, portfolioObj);
        case "Interest":
            return processActionInterest(item, portfolioObj);
        case "Split":
            return processActionStockSplit(item, portfolioObj);
        default:
            throw new Error(`Processing for "${item.action}" is not implemented`);
    }
}

function processActionPublicToPrivateShareConversion(item, portfolioObj) {
    let warnings = [];

    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    // Validate that the fee value is positive
    if (item.feeValue.lessThanOrEqualTo(0)) {
        warnings.push(`Fee value "${item.feeValue}" is not a positive amount.`);
    }
    // Subtract the fee value from the platform
    const cashChange = item.feeValue.negated();
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(cashChange, item.date, "STOCK_PUBLIC_TO_PRIVATE_SHARE_CONVERSION"));
    warnings = warnings.concat(stockHolding.updateShares(new Decimal(0), cashChange, item.date, true, "PUBLIC_TO_PRIVATE_SHARE_CONVERSION", false, null, item.feeValue.greaterThan(0)));

    return warnings;
}

/**
 * The unspecific account income action is an event doesn't affect the asset holdings in any meaningful way, but
 * results in an untaxed cash income of the asset's currency - some form of payout by the company. By "untaxed" we
 * don't mean that the income is not taxed, but rather that the tax is not deducted with the payout automatically.
 * An example of such an event could be nominal value reduction - important for the company for accounting purposes,
 * but doesn't affect the held assets directly.
 */
function processActionUnspecificAccountingIncomeAction(item, portfolioObj) {
    let warnings = [];

    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    // Add the received cash to the platform
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(item.totalValue, item.date, "STOCK_UNSPECIFIC_ACCOUNTING_INCOME"));
    warnings = warnings.concat(stockHolding.updateShares(new Decimal(0), item.totalValue, item.date, true, "UNSPECIFIC_ACCOUNTING_INCOME", false, null, false));

    return warnings;
}

function processActionTransfer(item, portfolioObj) {
    let warnings = [];

    if (!portfolioObj.hasPlatform(item.fromPlatform)) {
        throw new Error(`From platform "${item.fromPlatform}" does not exist`);
    }
    if (!portfolioObj.hasPlatform(item.toPlatform)) {
        throw new Error(`To platform "${item.toPlatform}" does not exist`);
    }
    // Validate that the transferred amount is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        throw new Error(`Total value "${item.totalValue}" is not a positive amount`);
    }
    // Validate that the fee value is non-negative
    if (item.feeValue.lessThan(0)) {
        throw new Error(`Fee value "${item.feeValue}" is not a non-negative amount`);
    }
    // Update the cash amount on the from platform
    const fromPlatform = portfolioObj.getPlatform(item.fromPlatform);
    warnings = warnings.concat(fromPlatform.getCashHolding(item.currency).updateValue(item.totalValue.plus(item.feeValue).negated(), item.date, "CASH_TRANSFER"));
    // Update the cash amount on the to platform
    const toPlatform = portfolioObj.getPlatform(item.toPlatform);
    warnings = warnings.concat(toPlatform.getCashHolding(item.currency).updateValue(item.totalValue, item.date, "CASH_TRANSFER"));
    return warnings;
}

function processActionCurrencyConversion(item, portfolioObj) {
    let warnings = [];

    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Validate that the from value is positive
    if (item.fromValue.lessThanOrEqualTo(0)) {
        throw new Error(`From value "${item.fromValue}" is not a positive amount`);
    }
    // Validate that the to value is positive
    if (item.toValue.lessThanOrEqualTo(0)) {
        throw new Error(`To value "${item.toValue}" is not a positive amount`);
    }
    if (item.fromToCoefficient.lessThanOrEqualTo(0)) {
        throw new Error(`From-to coefficient "${item.fromToCoefficient}" must be a positive number`);
    }
    // Check that the conversion makes sense
    warnings = warnings.concat(validateCurrencyConversionTransactionValue(item.fromToCoefficient, item.fromValue, item.toValue));

    // Validate that the fee value is non-negative
    if (item.feeValue.lessThan(0)) {
        throw new Error(`Fee value "${item.feeValue}" is not a non-negative amount`);
    }

    // Update the cash amounts on the platform
    const platform = portfolioObj.getPlatform(item.platform);

    warnings = warnings.concat(platform.getCashHolding(item.fromCurrency).updateValue(item.fromValue.plus(item.feeValue).negated(), item.date, "CASH_CURRENCY_CONVERSION"));
    warnings = warnings.concat(platform.getCashHolding(item.toCurrency).updateValue(item.toValue, item.date, "CASH_CURRENCY_CONVERSION"));
    return warnings;
}

function processActionDividend(item, portfolioObj) {
    let warnings = [];

    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    // Validate that the gross value is positive
    if (item.grossValue.lessThanOrEqualTo(0)) {
        throw new Error(`Gross value "${item.grossValue}" is not a positive amount`);
    }
    // Validate that the net value is positive
    if (item.netValue.lessThanOrEqualTo(0)) {
        throw new Error(`Net value "${item.netValue}" is not a positive amount`);
    }
    // Validate that the tax value is positive
    if (item.taxValue.lessThan(0)) {
        throw new Error(`Tax value "${item.taxValue}" is not a non-negative amount`);
    }
    // Validate that the net value is less than or equal to the gross value
    if (item.netValue.greaterThan(item.grossValue)) {
        throw new Error(`Net value "${item.netValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the tax value is less than or equal to the gross value
    if (item.taxValue.greaterThan(item.grossValue)) {
        throw new Error(`Tax value "${item.taxValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the net value plus tax value equals gross value
    const expectedGrossValueDecimal = item.netValue.plus(item.taxValue);
    if (!item.grossValue.equals(expectedGrossValueDecimal)) {
        throw new Error(`Gross value ${item.grossValue} does not match the sum of net value and tax value, expected ${expectedGrossValueDecimal}`);
    }

    // Update the cash amount on the platform
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(item.netValue, item.date, "STOCK_DIVIDEND"));
    // For now, we don't have a method to distinguish between already taxed and untaxed dividends,
    // so we are treating all dividends as already taxed, even if the taxed amount is 0.
    // Change this to a more proper method (e.g. explicit flag in imported JSON) if there are exceptions.
    warnings = warnings.concat(stockHolding.updateShares(new Decimal(0), item.netValue, item.date, true, "DIVIDEND", false, null, true));
    return warnings;
}

function processActionStockSplit(item, portfolioObj) {
    let warnings = [];

    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    // Validate that the multiplier is positive
    if (item.fromToCoefficient.lessThanOrEqualTo(0)) {
        throw new Error(`Multiplier "${item.fromToCoefficient}" must be a positive number`);
    }
    // Validate that the fromTotalShares is positive
    if (item.fromTotalShares.lessThanOrEqualTo(0)) {
        throw new Error(`From total shares "${item.fromTotalShares}" is not a positive number`);
    }
    // Validate that the toTotalShares is positive
    if (item.toTotalShares.lessThanOrEqualTo(0)) {
        throw new Error(`To total shares "${item.toTotalShares}" is not a positive number`);
    }
    // Validate that the fromTotalShares is correct
    const currentTotalShares = stockHolding.getCurrentShares();
    if (!item.fromTotalShares.equals(currentTotalShares)) {
        throw new Error(`Initial total shares "${item.fromTotalShares}" does not match the current total shares held "${currentTotalShares}"`);
    }
    // Validate that the toTotalShares is equal to the fromTotalShares multiplied by the multiplier
    warnings = warnings.concat(validateTotalSharesSplitValue(item.fromTotalShares, item.fromToCoefficient, item.toTotalShares));

    // Update
    const updateDiff = item.toTotalShares.minus(item.fromTotalShares);
    warnings = warnings.concat(stockHolding.updateShares(updateDiff, new Decimal(0), item.date, false, "STOCK_SPLIT", true, null, false));
    return warnings;
}

function processActionInterest(item, portfolioObj) {
    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Process the asset with a dedicated function
    switch (item.assetType) {
        case "Cash":
            return processActionInterestCash(item, portfolioObj);
        case "Bond":
            return processActionInterestBond(item, portfolioObj);
        default:
            throw new Error(`Processing of "Interest" for asset type "${item.assetType}" is not implemented`);
    }
}

function processActionInterestBond(item, portfolioObj) {//
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const bondHolding = platform.getBondHolding(item.assetCode);
    if (bondHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${bondHolding.getCurrency()}"`);
    }
    // Validate that the gross value is positive
    if (item.grossValue.lessThanOrEqualTo(0)) {
        throw new Error(`Gross value "${item.grossValue}" is not a positive amount`);
    }
    // Validate that the net value is positive
    if (item.netValue.lessThanOrEqualTo(0)) {
        throw new Error(`Net value "${item.netValue}" is not a positive amount`);
    }
    // Validate that the tax value is positive
    if (item.taxValue.lessThan(0)) {
        throw new Error(`Tax value "${item.taxValue}" is not a non-negative amount`);
    }
    // Validate that the net value is less than or equal to the gross value
    if (item.netValue.greaterThan(item.grossValue)) {
        throw new Error(`Net value "${item.netValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the tax value is less than or equal to the gross value
    if (item.taxValue.greaterThan(item.grossValue)) {
        throw new Error(`Tax value "${item.taxValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the net value plus tax value equals gross value
    const expectedGrossValueDecimal = item.netValue.plus(item.taxValue);
    if (!item.grossValue.equals(expectedGrossValueDecimal)) {
        throw new Error(`Gross value ${item.grossValue} does not match the sum of net value and tax value, expected ${expectedGrossValueDecimal}`);
    }

    // Update the cash amount on the platform
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(item.netValue, item.date, "BOND_INTEREST"));
    warnings = warnings.concat(bondHolding.updateShares(new Decimal(0), item.netValue, item.date, true, "INTEREST", null, item.taxValue.greaterThan(0)));
    return warnings;
}

function processActionInterestCash(item, portfolioObj) {//
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const cashHolding = platform.getCashHolding(item.currency);

    // Validate that the gross value is positive
    if (item.grossValue.lessThanOrEqualTo(0)) {
        throw new Error(`Gross value "${item.grossValue}" is not a positive amount`);
    }
    // Validate that the net value is positive
    if (item.netValue.lessThanOrEqualTo(0)) {
        throw new Error(`Net value "${item.netValue}" is not a positive amount`);
    }
    // Validate that the tax value is positive
    if (item.taxValue.lessThan(0)) {
        throw new Error(`Tax value "${item.taxValue}" is not a non-negative amount`);
    }
    // Validate that the net value is less than or equal to the gross value
    if (item.netValue.greaterThan(item.grossValue)) {
        throw new Error(`Net value "${item.netValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the tax value is less than or equal to the gross value
    if (item.taxValue.greaterThan(item.grossValue)) {
        throw new Error(`Tax value "${item.taxValue}" cannot be greater than gross value "${item.grossValue}"`);
    }
    // Validate that the net value plus tax value equals gross value
    const expectedGrossValueDecimal = item.netValue.plus(item.taxValue);
    if (!item.grossValue.equals(expectedGrossValueDecimal)) {
        throw new Error(`Gross value ${item.grossValue} does not match the sum of net value and tax value, expected ${expectedGrossValueDecimal}`);
    }

    // Update the cash amount on the platform
    warnings = warnings.concat(cashHolding.updateValue(item.netValue, item.date, "CASH_INTEREST"));
    return warnings;
}

/*
 * Process the "Buy" action of purchasing an asset on a platform.
 */
function processActionBuy(item, portfolioObj) {
    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Process the asset with a dedicated function
    switch (item.assetType) {
        case "Stock":
            return processActionBuyStock(item, portfolioObj);
        case "IndexFund":
            return processActionBuyIndexFund(item, portfolioObj);
        case "Bond":
            return processActionBuyBond(item, portfolioObj);
        default:
            throw new Error(`Processing of "Buy" for asset type "${item.assetType}" is not implemented`);
    }
}

/*
 * Process the "Sell" action of purchasing an asset on a platform.
 */
function processActionSell(item, portfolioObj) {
    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Process the asset with a dedicated function
    switch (item.assetType) {
        case "Stock":
            return processActionSellStock(item, portfolioObj);
        case "IndexFund":
            return processActionSellIndexFund(item, portfolioObj);
        default:
            throw new Error(`Processing of "Sell" for asset type "${item.assetType}" is not implemented`);
    }
}

/*
 * Process the "Buy" action for asset type "Stock" of purchasing stock.
 */
function processActionBuyStock(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    // Validate that the share count is positive
    if (item.totalShares.lessThan(0)) {
        throw new Error(`Share count "${item.totalShares}" is not a positive number`);
    }
    // Validate that the currency matches the existing asset currency
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    // Validate that the unit value is positive
    if (item.unitValue.lessThanOrEqualTo(0)) {
        warnings.push(`Unit value "${item.unitValue}" is not a positive amount.`);
    }
    // Validate that the total value is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    warnings = warnings.concat(validateTotalSharesTransactionValue(item.unitValue, item.totalShares, item.totalValue));
    // Subtract the spent cash from the platform
    const spentCash = item.totalValue.plus(item.feeValue).negated();
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(spentCash, item.date, "STOCK_BUY"));
    // Add the shares to the platform
    warnings = warnings.concat(platform.getStockHolding(item.assetCode).updateShares(item.totalShares, spentCash, item.date, false, "BUY", false, item.unitValue, false));

    return warnings;
}

function validateTotalSharesTransactionValue(unitValue, totalShares, totalValue) {
    let warnings = [];
    let expectedTotalValueDecimal = unitValue.times(totalShares);
    // Check if expected value has more than 2 decimal places, if it does, round it to 2 decimal places
    if (expectedTotalValueDecimal.decimalPlaces() > 2) {
        expectedTotalValueDecimal = expectedTotalValueDecimal.toDecimalPlaces(2);
    }
    if (!totalValue.equals(expectedTotalValueDecimal)) {
        warnings.push(`Total value ${totalValue} does not match the product of share count and unit value, expected ${expectedTotalValueDecimal}.`);
    }
    return warnings;
}

function validateTotalSharesSplitValue(fromTotalShares, multiplier, toTotalShares) {
    let warnings = [];
    let expectedToShares = fromTotalShares.times(multiplier);
    if (!toTotalShares.equals(expectedToShares)) {
        warnings.push(`Total shares ${toTotalShares} does not match the product of initial total shares and multiplier, expected ${expectedToShares}.`);
    }
    return warnings;
}

function validateCurrencyConversionTransactionValue(fromToCoefficient, fromValue, toValue) {
    let warnings = [];
    let expectedToValue = fromToCoefficient.times(fromValue);
    let roundedValue = expectedToValue;
    let flooredValue = expectedToValue;
    // Check if expected value has more than 2 decimal places, if it does, round or floor it to 2 decimal places
    if (expectedToValue.decimalPlaces() > 2) {
        roundedValue = expectedToValue.toDecimalPlaces(2);
        flooredValue = expectedToValue.toDecimalPlaces(2, Decimal.ROUND_FLOOR);
    }
    if (!toValue.equals(roundedValue) && !toValue.equals(flooredValue)) {
        warnings.push(`To value ${toValue} does not match the product of from value ${fromValue} and from-to coefficient ${fromToCoefficient}, expected either rounded ${roundedValue} or floored ${flooredValue}.`);
    }
    return warnings;
}

/*
 * Process the "Buy" action for asset type "Bond" of purchasing a bond.
 */
function processActionBuyBond(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const bondHolding = platform.getBondHolding(item.assetCode);
    // Validate that the share count is positive
    if (item.totalShares.lessThan(0)) {
        throw new Error(`Share count "${item.totalShares}" is not a positive number`);
    }
    // Validate that the currency matches the existing asset currency
    if (bondHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${bondHolding.getCurrency()}"`);
    }
    // Validate that the unit value is positive
    if (item.unitValue.lessThanOrEqualTo(0)) {
        warnings.push(`Unit value "${item.unitValue}" is not a positive amount.`);
    }
    // Validate that the total value is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    // Validate that the fee value is non-negative
    if (item.feeValue.lessThan(0)) {
        throw new Error(`Fee value "${item.feeValue}" is not a non-negative amount`);
    }
    // Validate the total value against unit value and share count
    warnings = warnings.concat(validateTotalSharesTransactionValue(item.unitValue, item.totalShares, item.totalValue));
    // Subtract the spent cash from the platform
    const spentCash = item.totalValue.plus(item.feeValue).negated();
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(spentCash, item.date, "BOND_BUY"));
    // Add the shares to the platform
    warnings = warnings.concat(platform.getBondHolding(item.assetCode).updateShares(item.totalShares, spentCash, item.date, false, "BUY", item.unitValue, false));

    return warnings;
}

/*
 * Process the "Buy" action for asset type "IndexFund" of purchasing index fund.
 */
function processActionBuyIndexFund(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const indexFundHolding = platform.getIndexFundHolding(item.assetCode);

    // Validate that the currency matches the existing asset currency
    if (indexFundHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${indexFundHolding.getCurrency()}"`);
    }
    // Validate that the total value is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    // Validate that the share count is positive
    if (item.totalShares.lessThanOrEqualTo(0)) {
        throw new Error(`Share count "${item.totalShares}" is not a positive number`);
    }
    // Validate that the unit value is positive
    if (item.unitValue.lessThanOrEqualTo(0)) {
        throw new Error(`Unit value "${item.unitValue}" is not a positive amount.`);
    }
    // Validate the total value against unit value and share count
    warnings = warnings.concat(validateTotalSharesTransactionValue(item.unitValue, item.totalShares, item.totalValue));
    // Subtract the spent cash from the platform
    const spentCash = item.totalValue.negated();
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(spentCash, item.date, "INDEX_FUND_BUY"));
    // Add the index fund cash to the platform
    warnings = warnings.concat(platform.getIndexFundHolding(item.assetCode).updateShares(item.totalShares, spentCash, item.date, false, "BUY", item.unitValue, false));
    return warnings;
}

/*
 * Process the "Sell" action for asset type "Stock".
 */
function processActionSellStock(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);
    // Validate that the share count is positive
    if (item.totalShares.lessThan(0)) {
        throw new Error(`Share count "${item.totalShares}" is not a positive number`);
    }
    // Validate that the currency matches the existing asset currency
    if (stockHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${stockHolding.getCurrency()}"`);
    }
    // Validate that the unit value is positive
    if (item.unitValue.lessThanOrEqualTo(0)) {
        warnings.push(`Unit value "${item.unitValue}" is not a positive amount.`);
    }
    // Validate that the total value is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    // Validate the total value against unit value and share count
    warnings = warnings.concat(validateTotalSharesTransactionValue(item.unitValue, item.totalShares, item.totalValue));
    // Validate that the fee value is non-negative
    if (item.feeValue.lessThan(0)) {
        throw new Error(`Fee value "${item.feeValue}" is not a non-negative amount`);
    }
    // Validate that the fee value is smaller than the total value
    if (item.feeValue.greaterThanOrEqualTo(item.totalValue)) {
        throw new Error(`Fee value "${item.feeValue}" is not smaller than total value`);
    }
    // Add the acquired cash to the platform
    const acquiredCash = item.totalValue.minus(item.feeValue);
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(acquiredCash, item.date, "STOCK_SELL"));
    // Subtract the sold shares from the platform
    warnings = warnings.concat(platform.getStockHolding(item.assetCode).updateShares(item.totalShares.negated(), acquiredCash, item.date, false, "SELL", false, item.unitValue, false));

    return warnings;
}

/*
 * Process the "Sell" action for asset type "IndexFund".
 */
function processActionSellIndexFund(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const indexFundHolding = platform.getIndexFundHolding(item.assetCode);
    // Validate that the currency matches the existing asset currency
    if (indexFundHolding.getCurrency() !== item.currency) {
        throw new Error(`Currency "${item.currency}" does not match the existing asset currency "${indexFundHolding.getCurrency()}"`);
    }
    // Validate that the total value is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        warnings.push(`Total value "${item.totalValue}" is not a positive amount.`);
    }
    // Validate that the share count is positive
    if (item.totalShares.lessThanOrEqualTo(0)) {
        throw new Error(`Share count "${item.totalShares}" is not a positive number`);
    }
    // Validate that the unit value is positive
    if (item.unitValue.lessThanOrEqualTo(0)) {
        throw new Error(`Unit value "${item.unitValue}" is not a positive amount.`);
    }
    // Validate the total value against unit value and share count
    warnings = warnings.concat(validateTotalSharesTransactionValue(item.unitValue, item.totalShares, item.totalValue));
    // Add the acquired cash to the platform
    const acquiredCash = item.totalValue;
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(acquiredCash, item.date, "INDEX_FUND_SELL"));
    // Subtract the index fund cash from the platform
    warnings = warnings.concat(platform.getIndexFundHolding(item.assetCode).updateShares(item.totalShares.negated(), acquiredCash, item.date, false, "SELL", item.unitValue, false));
    return warnings;
}

/*
 * Process the "Deposit" action of adding cash to a platform.
 */
function processActionDeposit(item, portfolioObj) {
    let warnings = [];

    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Validate that the deposited amount is positive
    if (item.totalValue.lessThanOrEqualTo(0)) {
        throw new Error(`Total value "${item.totalValue}" is not a positive amount`);
    }
    // Update the cash amount on the platform
    const platform = portfolioObj.getPlatform(item.platform);
    warnings = warnings.concat(platform.getCashHolding(item.currency).updateValue(item.totalValue, item.date, "CASH_DEPOSIT"));
    return warnings;
}

/*
 * Process the "Check" action of validating an asset's current value.
 */
function processActionCheck(item, portfolioObj) {
    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Process the asset with a dedicated function
    switch (item.assetType) {
        case "Cash":
            return processActionCheckCash(item, portfolioObj);
        case "Stock":
            return processActionCheckStock(item, portfolioObj);
        case "Bond":
            return processActionCheckBond(item, portfolioObj);
        case "IndexFund":
            return processActionCheckIndexFund(item, portfolioObj);
        case "EstonianTaxFreeCashRemainder":
            return processActionCheckEstonianTaxFreeCashRemainder(item, portfolioObj);
        default:
            throw new Error(`Processing of "Check" for asset type "${item.assetType}" is not implemented`);
    }
}

/*
 * Process the "Check" action for asset type "Cash" of validating the current cash amount.
 */
function processActionCheckCash(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const cashHolding = platform.getCashHolding(item.currency);

    // Get the cash amount from the platform.
    const cashAmountDecimal = cashHolding.getCurrentValue();

    // Validate the amount
    if (!cashAmountDecimal.equals(item.totalValue)) {
        warnings.push(`Current cash amount for currency "${item.currency}" is ${cashAmountDecimal} but expected ${item.totalValue}`);
    }

    return warnings;
}

/*
 * Process the "Check" action for asset type "Stock" of validating the current shares amount.
 */
function processActionCheckStock(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const stockHolding = platform.getStockHolding(item.assetCode);

    // Get the shares amount from the platform.
    const sharesAmount = stockHolding.getCurrentShares();

    // Validate the amount
    if (!sharesAmount.equals(item.totalShares)) {
        warnings.push(`Current shares amount for stock "${item.assetCode}" is ${sharesAmount} but expected ${item.totalShares}`);
    }

    return warnings;
}

/*
 * Process the "Check" action for asset type "Bond" of validating the current shares amount.
 */
function processActionCheckBond(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const bondHolding = platform.getBondHolding(item.assetCode);

    // Get the shares amount from the platform.
    const sharesAmount = bondHolding.getCurrentShares();

    // Validate the amount
    if (!sharesAmount.equals(item.totalShares)) {
        warnings.push(`Current shares amount for bond "${item.assetCode}" is ${sharesAmount} but expected ${item.totalShares}`);
    }

    return warnings;
}

/*
 * Process the "Check" action for asset type "IndexFund" of validating the current shares amount.
 */
function processActionCheckIndexFund(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const indexFundHolding = platform.getIndexFundHolding(item.assetCode);

    // Get the shares amount from the platform.
    const sharesAmount = indexFundHolding.getCurrentShares();

    // Validate the amount
    if (!sharesAmount.equals(item.totalShares)) {
        warnings.push(`Current shares amount for index fund "${item.assetCode}" is ${sharesAmount} but expected ${item.totalShares}`);
    }

    return warnings;
}

/*
 * Process the "Check" action for asset type "EstonianTaxFreeCashRemainder" of validating
 * the tax-free cash remainder amount by currency at the end of the record year.
 */
function processActionCheckEstonianTaxFreeCashRemainder(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    const remainderByCurrency = platform.getTaxFreeRemainderEstonia(item.date.getFullYear());
    const remainder = remainderByCurrency.has(item.currency)
        ? remainderByCurrency.get(item.currency)
        : new Decimal(0);

    if (!remainder.equals(item.totalValue)) {
        warnings.push(`Tax-free cash remainder for platform "${item.platform}" in year ${item.date.getFullYear()} and currency "${item.currency}" is ${remainder} but expected ${item.totalValue}`);
    }

    return warnings;
}

/*
 * Process the "NewPlatform" action of introducing a new investment platform to the portfolio.
 */
function processActionNewPlatform(item, portfolioObj) {
    let warnings = [];

    portfolioObj.addPlatform(new Platform(item.platform));

    return warnings;
}

/*
 * Process the "NewAsset" action of introducing a new asset to the portfolio.
 */
function processActionNewAsset(item, portfolioObj) {
    // Validate that the platform exists
    if (!portfolioObj.hasPlatform(item.platform)) {
        throw new Error(`Platform "${item.platform}" does not exist`);
    }
    // Different function per asset type
    switch (item.assetType) {
        case "Stock":
            return processActionNewAssetStock(item, portfolioObj);
        case "IndexFund":
            return processActionNewAssetIndexFund(item, portfolioObj);
        case "Cash":
            return processActionNewAssetCash(item, portfolioObj);
        case "Bond":
            return processActionNewAssetBond(item, portfolioObj);
        default:
            throw new Error(`Processing of "NewAsset" for asset type "${item.assetType}" is not implemented`);
    }
}

/*
 * Process the "NewAsset" action of introducing a new asset of type "Stock" to the portfolio.
 */
function processActionNewAssetStock(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    platform.addStockHolding(new StockHolding(item.assetCode, item.friendlyName, item.currency));

    return warnings;
}

/*
 * Process the "NewAsset" action of introducing a new asset of type "Bond" to the portfolio.
 */
function processActionNewAssetBond(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    platform.addBondHolding(new BondHolding(item.assetCode, item.friendlyName, item.currency));

    return warnings;
}

/*
 * Process the "NewAsset" action of introducing a new asset of type "IndexFund" to the portfolio.
 */
function processActionNewAssetIndexFund(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    platform.addIndexFundHolding(new IndexFundHolding(item.assetCode, item.friendlyName, item.currency));

    return warnings;
}

/*
 * Process the "NewAsset" action of introducing a new asset of type "Cash" to the portfolio.
 */
function processActionNewAssetCash(item, portfolioObj) {
    let warnings = [];

    const platform = portfolioObj.getPlatform(item.platform);
    platform.addCashHolding(new CashHolding(item.currency));

    return warnings;
}

function parseActionInputsByNames(item) {
    if (typeof item !== "object") {
        return new VRes(`Not a JSON object`);
    }

    for (let key of Object.getOwnPropertyNames(item)) {
        if (!ALL_POSSIBLE_JSON_FIELDS.includes(key)) {
            return new VRes(`Unhandled property: "${key}"`);
        }
    }

    // Immediately check action
    if (!item.hasOwnProperty("action")) {
        return new VRes(`Missing required field "action"`);
    }
    if (typeof item.action !== "string") {
        return new VRes(`Field "action" must be a string`);
    }
    if (!Object.getOwnPropertyNames(ACTIONS).includes(item.action)) {
        return new VRes(`Action "${item.action}" is not supported`);
    }
    if (ACTIONS[item.action]) {
        // Immediately check asset type
        if (!item.hasOwnProperty("assetType")) {
            return new VRes(`Missing required field "assetType"`);
        }
        if (typeof item.assetType !== "string") {
            return new VRes(`Field "assetType" must be a string`);
        }
        if (!ASSET_TYPES.includes(item.assetType)) {
            return new VRes(`Asset type "${item.assetType}" is not supported`);
        }
    }

    // Parse inputs
    const parsedInputs = {};
    const expectedFields = getInputsByActionAndAsset(item.action, item.assetType);
    if (expectedFields === undefined) {
        return new VRes(`Action "${item.action}" is not supported for "${item.assetType}"`);
    }
    if (!(expectedFields instanceof Array)) {
        throw new Error(`Expected fields should be an array`);
    }
    for (let key of Object.getOwnPropertyNames(item)) {
        if (!expectedFields.includes(key)) {
            return new VRes(`Property "${key}" is unexpected`);
        }
    }

    const optionalFields = ["notes", "feeValue"];
    let vres = new VRes();
    for (let field of expectedFields) {
        if (!ALL_POSSIBLE_JSON_FIELDS.includes(field)) {
            throw new Error(`Invalid expected field`);
        }
        if (!item.hasOwnProperty(field) && !optionalFields.includes(field)) {
            return new VRes(`Missing required field: "${field}"`);
        }
        vres = vres.and(() => parseActionInputByName(field, item[field]))
            .apply((value) => parsedInputs[field] = value);
    }
    return vres.and(() => new VRes(parsedInputs));
}

function parseActionInputByName(inputName, inputValue) {
    let validate = () => {
        switch (inputName) {
            case "date":
                return parseDateInput(inputValue);
            case "action":
                return validateActionInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "platform":
            case "fromPlatform":
            case "toPlatform":
                return validatePlatformNameInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "assetType":
                return validateAssetTypeInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "assetCode":
                return validateAssetCodeInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "currency":
            case "fromCurrency":
            case "toCurrency":
                return validateCurrencyInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "totalValue":
            case "grossValue":
            case "netValue":
            case "taxValue":
            case "fromValue":
            case "toValue":
            case "fromTotalShares":
            case "toTotalShares":
                return parseDecimalInput(inputValue, 4);
            case "totalShares":
                return parseDecimalInput(inputValue, 9);
            case "feeValue":
                return parseDecimalInput(inputValue, 2, true);
            case "fromToCoefficient":
                return parseDecimalInput(inputValue, 5);
            case "unitValue":
                return parseDecimalInput(inputValue, 8);
            case "friendlyName":
                return validateAssetNameInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            case "notes":
                return validateNotesInput(inputValue)
                    .and(() => new VRes(inputValue, false));
            default:
                throw new Error(`Validation not implemented for input name "${inputName}"`);
        }
    };
    return validate().extend(inputName);
}

/**
 * Return all the fields that must be present for a given action type and asset type pair.
 * No other fields should be present.
 * Return undefined if the action type and asset type pair are not supported.
 */
function getInputsByActionAndAsset(action, assetType) {
    switch (action) {
        case "PublicToPrivateShareConversion":
            switch (assetType) {
                case "Stock":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "feeValue"];
            }
            return undefined;
        case "UnspecificAccountingIncomeAction":
            switch (assetType) {
                case "Stock":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "totalValue"];
            }
            return undefined;
        case "Transfer":
            switch (assetType) {
                case "Cash":
                    return ["date", "notes", "action", "fromPlatform", "toPlatform", "assetType", "currency", "totalValue", "feeValue"];
            }
            return undefined;
        case "CurrencyConversion":
            switch (assetType) {
                case "Cash":
                    return ["date", "notes", "action", "platform", "assetType", "fromCurrency", "toCurrency", "fromValue", "toValue", "fromToCoefficient", "feeValue"];
            }
            return undefined;
        case "Dividend":
            switch (assetType) {
                case "Stock":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "grossValue", "netValue", "taxValue"];
            }
            return undefined;
        case "Interest":
            switch (assetType) {
                case "Bond":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "grossValue", "netValue", "taxValue"];
                case "Cash":
                    return ["date", "notes", "action", "platform", "assetType", "currency", "grossValue", "netValue", "taxValue"];
            }
            return undefined;
        case "Buy":
            switch (assetType) {
                case "Stock":
                case "Bond":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "totalShares", "unitValue", "totalValue", "feeValue"];
                case "IndexFund":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "totalShares", "unitValue", "totalValue"];
            }
            return undefined;
        case "Sell":
            switch (assetType) {
                case "Stock":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "totalShares", "unitValue", "totalValue", "feeValue"];
                case "IndexFund":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "totalShares", "unitValue", "totalValue"];
            }
            return undefined;
        case "Deposit":
            switch (assetType) {
                case "Cash":
                    return ["date", "notes", "action", "platform", "assetType", "currency", "totalValue"];
            }
            return undefined;
        case "Check":
            switch (assetType) {
                case "Cash":
                case "EstonianTaxFreeCashRemainder":
                    return ["date", "notes", "action", "platform", "assetType", "currency", "totalValue"];
                case "Stock":
                case "Bond":
                case "IndexFund":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "totalShares"];
            }
            return undefined;
        case "NewPlatform":
            return ["date", "notes", "action", "platform"];
        case "NewAsset":
            switch (assetType) {
                case "Stock":
                case "IndexFund":
                case "Bond":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "friendlyName"];
                case "Cash":
                    return ["date", "notes", "action", "platform", "assetType", "currency"];
            }
            return undefined;
        case "Split":
            switch (assetType) {
                case "Stock":
                    return ["date", "notes", "action", "platform", "assetType", "assetCode", "currency", "fromTotalShares", "toTotalShares", "fromToCoefficient"];
            }
            return undefined;
        default:
            return undefined;
    }
}

// TAB FUNCTIONALITY
function openTab(evt, tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Show the selected tab and mark button as active
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Some thoughts (todos)
// TODO Add total cash flow validations - e.g. (deposit - invest - withdraw == cash balance).
// TODO Add warning symbols ⚠️ and hover tooltips for XIRR and Value if the date is old.
//      Probably best for this to lose the intermediate TableView layer completely and have 1 model + 1 view.
// TODO Throws for internal issues, otherwise always VRes (both warnings and critical errors)
// TODO Implement asset removal
// TODO Add country for geographical distributing
