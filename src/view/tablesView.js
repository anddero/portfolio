// Representation of multiple tables, each with a title and a table.
class TablesView {
    constructor(tables) {
        if (!Array.isArray(tables)) {
            throw new Error('Tables must be an array');
        }
        tables.forEach(table => {
            if (typeof table !== 'object') {
                throw new Error('Each table must be an object');
            }
            validateNonBlankString(table.title).getOrThrow('table.title');
            validateNonBlankString(table.id).getOrThrow('table.id');
            if (!(table.table instanceof TableView)) {
                throw new Error('Not a TableView');
            }
        });
        this.tables = tables;
    }

    updateDom(divElementId) {
        validateNonBlankString(divElementId).getOrThrow('divElementId');

        // Ensure that the div element is valid
        const divElement = document.getElementById(divElementId);
        if (!(divElement instanceof HTMLDivElement)) {
            throw new Error('Not a HTMLDivElement');
        }

        // Construct the tables
        divElement.innerHTML = this.tables.map(table => `
            <div class="table-container">
                <h2>${table.title}</h2>
                <table id="${table.id}">
                </table>
            </div>
        `).join('');

        // Update each table
        this.tables.forEach(table => {
            table.table.updateDom(table.id);
        });
    }
}
