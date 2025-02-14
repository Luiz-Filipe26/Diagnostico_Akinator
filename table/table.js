window.addColumn = addColumn;
window.addRow = addRow;
window.generateJSON = generateJSON;
window.removeColumn = removeColumn;
window.removeRow = removeRow;
window.downloadJSON = downloadJSON;
window.uploadJSON = uploadJSON;

const resultToUser = document.getElementById("result");

loadTableFromJSON();

function loadTableFromJSON() {
    const data = localStorage.getItem("tableData");

    if (!data) {
        return resultToUser.textContent = 'Nenhuma tabela salva na memória.';
    }

    const jsonData = JSON.parse(data);

    // Referências à tabela
    const table = document.getElementById("table");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    // Limpa a tabela atual, mantendo apenas a primeira coluna (Doença/Sintoma)
    const headerRow = thead.rows[0];
    headerRow.innerHTML = '<th>Doença/Sintoma</th>';
    tbody.innerHTML = "";

    // Adiciona as colunas do JSON
    jsonData.columns.forEach(column => {
        const newColumn = document.createElement("th");
        newColumn.innerHTML = `
                <input type="text" value="${column}">
                <button class="btn-remove" onclick="removeColumn(event)"></button>
            `;
        headerRow.appendChild(newColumn);
    });

    // Adiciona as linhas da tabela
    jsonData.rows.forEach(rowData => {
        const newRow = tbody.insertRow();

        // Primeira célula (Doença)
        const firstCell = newRow.insertCell();
        firstCell.innerHTML = `
                <input type="text" value="${rowData.disease}">
                <button class="btn-remove" onclick="removeRow(this)"></button>
            `;

        // Células de sintomas
        rowData.values.forEach(value => {
            const cell = newRow.insertCell();
            cell.innerHTML = createSelectWithValue(value);
        });
    });

    resultToUser.textContent = 'Tabela carregada com sucesso!';
}



function addColumn() {
    const table = document.getElementById("table");
    const headerRow = table.tHead.rows[0];
    const colIndex = headerRow.cells.length;

    const newColumn = document.createElement("th");
    newColumn.innerHTML = `
        <input type="text" value="Sintoma ${colIndex}">
        <button class="btn-remove" onclick="removeColumn(event)"></button>
    `;
    headerRow.appendChild(newColumn);

    document.querySelectorAll("#table tbody tr").forEach(row => {
        const newCell = document.createElement("td");
        newCell.innerHTML = createSelect();
        row.appendChild(newCell);
    });
}

function addRow() {
    const table = document.getElementById("table").getElementsByTagName("tbody")[0];
    const newRow = table.insertRow();
    const columns = document.getElementById("table").tHead.rows[0].cells.length;

    const firstCell = newRow.insertCell();
    firstCell.innerHTML = `
        <input type="text" value="Doença ${table.rows.length}">
        <button class="btn-remove" onclick="removeRow(this)"></button>
    `;

    for (let i = 1; i < columns; i++) {
        const cell = newRow.insertCell();
        cell.innerHTML = createSelect();
    }
}

function removeColumn(event) {
    const th = event.target.closest("th");
    if (!th) return;

    const colIndex = Array.from(th.parentNode.children).indexOf(th);

    th.remove();

    document.querySelectorAll("#table tbody tr").forEach(row => {
        row.deleteCell(colIndex);
    });
}

function removeRow(button) {
    const row = button.closest("tr");
    if (row && row.parentNode.rows.length > 1) {
        row.remove();
    }
}

function createSelectWithValue(selectedValue) {
    return `
        <select>
            <option value="Irrelevante" ${selectedValue === "Irrelevante" ? "selected" : ""}>Irrelevante</option>
            <option value="Médio" ${selectedValue === "Médio" ? "selected" : ""}>Médio</option>
            <option value="Forte" ${selectedValue === "Forte" ? "selected" : ""}>Forte</option>
        </select>
    `;
}


function createSelect() {
    return `
        <select>
            <option value="Irrelevante">Irrelevante</option>
            <option value="Médio">Médio</option>
            <option value="Forte">Forte</option>
        </select>
    `;
}

function generateJSON() {
    const table = document.getElementById("table");
    const data = { columns: [], rows: [] };

    document.querySelectorAll("#table thead input").forEach(input => {
        data.columns.push(input.value);
    });

    document.querySelectorAll("#table tbody tr").forEach(row => {
        const rowData = { disease: row.cells[0].querySelector("input").value, values: [] };
        row.querySelectorAll("td select").forEach(select => {
            rowData.values.push(select.value);
        });
        data.rows.push(rowData);
    });

    // Armazenar o JSON no localStorage
    localStorage.setItem("tableData", JSON.stringify(data));

    // Exibir o JSON na tela
    resultToUser.textContent = `Tabela salva na memória!`;
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        resultToUser.textContent = 'Nenhum arquivo selecionado.';
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            if (jsonData.columns && Array.isArray(jsonData.rows)) {
                localStorage.setItem("tableData", JSON.stringify(jsonData));
                resultToUser.textContent = 'Tabela carregada com sucesso!';
                loadTableFromJSON();
            } else {
                throw new Error("Formato de dados inválido.");
            }
        } catch (error) {
            resultToUser.textContent = 'Erro ao processar o arquivo JSON: ' + error.message;
        }
    };

    reader.readAsText(file);  // Lê o arquivo como texto
}


function downloadJSON() {
    const data = localStorage.getItem("tableData");

    if (data) {
        const blob = new Blob([data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'tableData.json';
        link.click();

        resultToUser.textContent = 'Arquivo JSON baixado com sucesso.';
    } else {
        resultToUser.textContent = 'Nenhuma tabela salva na memória!';
    }
}