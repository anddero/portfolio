// Object representation of a table with a single header row and a body of multiple rows.
// Cell can span multiple columns.
class TableView {
    /**
     * Create a new TableView instance.
     * @param header An array of strings representing the header row.
     * @param body An array of arrays, each representing a row in the body, where each cell is a string.
     *             All rows must have the same or fewer number of cells than the header.
     * @throws {Error} On input type issues.
     * @param spanMap Optional. A lookup map of cell spans by row. The key is an integer or a list of integers
     *                representing the row index(es). The value is a list of integers representing the
     *                column span(s) for the cells of the specified row(s).
     *                For example, spanMap[0] = [2, 1] means that the first row must have two cells with spans of 2
     *                and 1 columns respectively.
     *                For example, spanMap[[4, 8, 9]] = [1, 1, 3, 1] means that for the rows 4,8,9, the following
     *                conditions hold: total of 4 cells, where the third cell spans 3 columns, others span 1 column each.
     *                Naturally, the sum of the spans per element in the map must equal the total number of columns
     *                in the header.
     */
    constructor(header, body, spanMap) {
        if (!Array.isArray(header) || !header.every(cell => typeof cell === 'string')) {
            throw new Error('Header must be an array of strings');
        }
        if (!Array.isArray(body)) {
            throw new Error('Body must be an array');
        }
        const colCount = header.length;
        // Validate spanMap
        if (spanMap === undefined) {
            spanMap = new Map(); // Default to an empty Map if not provided
        }
        if (!(spanMap instanceof Map)) {
            throw new Error('spanMap must be a Map');
        }
        const seenRows = new Set();
        spanMap.forEach((rows, spans) => {
            if (typeof rows === 'number') {
                rows = [rows]; // Convert a single number to an array
            }
            if (!Array.isArray(rows) || !rows.every(row => Number.isInteger(row))) {
                throw new Error('spanMap keys must be integers or arrays of integers');
            }
            if (!Array.isArray(spans) || !spans.every(span => Number.isInteger(span))) {
                throw new Error('spanMap values must be arrays of integers');
            }
            if (spans.reduce((sum, span) => sum + span, 0) !== colCount) {
                throw new Error('Sum of spans in spanMap must equal the number of columns in the header');
            }
            rows.forEach(row => {
                if (seenRows.has(row)) {
                    throw new Error(`Row ${row} is defined more than once in spanMap`);
                }
                seenRows.add(row);
            });
        });
        // Flatten the spanMap from having keys as arrays to having keys as integers
        const flatSpanMap = new Map();
        spanMap.forEach((rows, spans) => {
            if (Array.isArray(rows)) {
                rows.forEach(row => {
                    if (flatSpanMap.has(row)) {
                        throw new Error(`Row ${row} is defined more than once in spanMap`);
                    }
                    flatSpanMap.set(row, spans);
                });
            } else if (Number.isInteger(rows)) {
                if (flatSpanMap.has(rows)) {
                    throw new Error(`Row ${rows} is defined more than once in spanMap`);
                }
                flatSpanMap.set(rows, spans);
            } else {
                throw new Error('spanMap keys must be integers or arrays of integers');
            }
        });

        // Validate the body
        body.forEach((row, rowIndex) => {
            if (!Array.isArray(row) || !row.every(cell => typeof cell === 'string')) {
                throw new Error('Each row in the body must be an array of strings');
            }
            if (row.length !== colCount) {
                // Row might have fewer cells than the header, check spanMap
                if (flatSpanMap.has(rowIndex)) {
                    const spans = flatSpanMap.get(rowIndex);
                    if (spans.length !== row.length) {
                        throw new Error(`Row ${rowIndex} has ${row.length} cells, but spanMap expects ${spans.length} spans`);
                    }
                } else {
                    throw new Error(`Row ${rowIndex} has ${row.length} cells, but header has ${colCount} columns`);
                }
            }
        });

        this.header = header;
        this.body = body;
        this.spanMap = flatSpanMap; // Store the flattened spanMap
    }

    #getSpan(rowIndex, colIndex) {
        if (this.spanMap.has(rowIndex)) {
            const spans = this.spanMap.get(rowIndex);
            if (colIndex >= spans.length) {
                throw new Error(`Column index ${colIndex} out of bounds for row ${rowIndex} with spans ${spans}`);
            }
            return spans[colIndex];
        }
        return 1;
    }

    insertRow(atIndex, row, span) {
        // Validation
        validateIndexInRange(atIndex, 0, this.body.length).getOrThrow('atIndex');
        if (!Array.isArray(row) || !row.every(cell => typeof cell === 'string')) {
            throw new Error('Row must be an array of strings');
        }
        if (span !== undefined) {
            if (!Array.isArray(span) || !span.every(s => Number.isInteger(s))) {
                throw new Error('Span must be an array of integers');
            }
            if (span.reduce((sum, s) => sum + s, 0) !== this.header.length) {
                throw new Error('Sum of spans must equal the number of columns in the header');
            }
            if (span.length !== row.length) {
                throw new Error('Span length must match row length');
            }
        } else {
            if (row.length !== this.header.length) {
                throw new Error('Row length must match header length');
            }
        }
        // Insert the row
        this.body.splice(atIndex, 0, row);
        // Update the spanMap if spans are provided
        if (span !== undefined) {
            if (this.spanMap.has(atIndex)) {
                throw new Error(`Row ${atIndex} already has a span defined in spanMap`);
            }
            this.spanMap.set(atIndex, span);
            // Update the spans for lower rows, pushing each key in the map forward by 1
            for (let i = atIndex + 1; i < this.body.length; i++) {
                if (this.spanMap.has(i)) {
                    // Remove the element at i and add it back at i + 1
                    const spans = this.spanMap.get(i);
                    this.spanMap.delete(i);
                    this.spanMap.set(i + 1, spans);
                }
            }
        }
    }

    updateDom(tableElementId) {
        validateNonBlankString(tableElementId).getOrThrow('tableElementId');

        // Ensure that the table element is valid
        const tableElement = document.getElementById(tableElementId);
        if (!(tableElement instanceof HTMLTableElement)) {
            throw new Error('Not a valid HTMLTableElement');
        }

        // Construct the table
        tableElement.innerHTML = `
        <thead>
        <tr>
            ${this.header.map(cell => `<th>${cell}</th>`).join('')}
        </tr>
        </thead>
        <tbody>
            ${this.body.map((row, rowIndex) => `
                <tr>
                    ${row.map((cell, cellIndex) => 
                        `<td colspan="${this.#getSpan(rowIndex, cellIndex)}">${cell}</td>`
                    ).join('')}
                </tr>
            `).join('')}
        </tbody>
        `;
    }

    getTableSpan() {
        return this.header.length;
    }
}
