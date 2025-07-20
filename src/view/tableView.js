// Object representation of a table with a single header row and a body of multiple rows.
// All rows have the same number of cells.
class TableView {
    constructor(header, body) {
        if (!Array.isArray(header) || !header.every(cell => typeof cell === 'string')) {
            throw new Error('Header must be an array of strings');
        }
        if (!Array.isArray(body)) {
            throw new Error('Body must be an array');
        }
        const colCount = header.length;
        body.forEach(row => {
            if (!Array.isArray(row) || !row.every(cell => typeof cell === 'string')) {
                throw new Error('Each row in the body must be an array of strings');
            }
            if (row.length !== colCount) {
                throw new Error('All rows must have the same number of cells as the header');
            }
        });
        this.header = header;
        this.body = body;
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
            ${this.body.map(row => `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
        `;
    }
}
