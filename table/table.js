window.addColumn = addColumn;
window.addRow = addRow;
window.generateJSON = generateJSON;
window.removeColumn = removeColumn;
window.removeRow = removeRow;
window.downloadJSON = downloadJSON;
window.uploadJSON = uploadJSON;
window.downloadDescriptionJSON = downloadDescriptionJSON;
window.uploadDescriptionJSON = uploadDescriptionJSON;
window.confirmDescription = confirmDescription;

const table = document.getElementById("table");
const inputDescriptionTextArea = document.getElementById('inputDescription');
const diseaseSelect = document.getElementById('diseaseSelect');
const inputDescription = document.getElementById('inputDescription');
const resultToUser = document.getElementById("result");

diseaseSelect.onmousedown = rebuildOptionsList;
diseaseSelect.onchange = fillDescriptionText;

inputDescriptionTextArea.addEventListener('input', autoSizeDescriptionTextArea);

loadTableFromJSON();
rebuildOptionsList();
fillDescriptionText();

function autoSizeDescriptionTextArea() {
    const scrollY = window.scrollY;
    inputDescriptionTextArea.style.height = 'auto';
    inputDescriptionTextArea.style.height = inputDescriptionTextArea.scrollHeight + 'px';
    window.scrollTo(0, scrollY);
}

function sendUserFeedBack(message, seconds = 1.5) {
    resultToUser.textContent = message;

    setTimeout(() => {
        resultToUser.textContent = ' ';
    }, seconds * 1000);
}

function fillDescriptionText() {
    const selectedDisease = diseaseSelect.value;
    const descriptionData = JSON.parse(localStorage.getItem("diseaseDescriptions")) || { diseases: [] };
    const diseaseEntry = descriptionData.diseases.find(d => d.disease === selectedDisease);
    inputDescriptionTextArea.value = diseaseEntry ? diseaseEntry.description : "";
    autoSizeDescriptionTextArea();
}

function confirmDescription() {
    const selectedDisease = diseaseSelect.value;
    const description = inputDescriptionTextArea.value.trim();

    if (!selectedDisease) return;

    const descriptionData = JSON.parse(localStorage.getItem("diseaseDescriptions")) || { diseases: [] };
    const existingEntry = descriptionData.diseases.find(d => d.disease === selectedDisease);

    if (existingEntry) {
        existingEntry.description = description;
    } else {
        descriptionData.diseases.push({ disease: selectedDisease, description });
    }

    localStorage.setItem("diseaseDescriptions", JSON.stringify(descriptionData));
    sendUserFeedBack('Descrição salva na memória!');
}

function downloadDescriptionJSON() {
    const data = localStorage.getItem("diseaseDescriptions");

    if (!data) {
        sendUserFeedBack('Nenhuma descrição salva na memória!');
        return;
    }

    // Formata o JSON com indentação de 4 espaços
    const formattedData = JSON.stringify(JSON.parse(data), null, 4);

    const blob = new Blob([formattedData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diseaseDescriptions.json';
    link.click();

    sendUserFeedBack('Arquivo de descrições baixado com sucesso.');
}


function uploadDescriptionJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            if (jsonData && Array.isArray(jsonData.diseases)) {
                localStorage.setItem("diseaseDescriptions", JSON.stringify(jsonData));
                sendUserFeedBack('JSON de descrições subido com sucesso!');
            } else {
                throw new Error("Formato inválido.");
            }
        } catch (error) {
            sendUserFeedBack("Erro ao processar JSON!");
            console.error("Erro ao processar JSON:", error);
        }
    };
    reader.readAsText(file);
}

function rebuildOptionsList() {
    const diseaseNames = getRowNames();

    const removeOptions = (select) => {
        while (select.firstChild) select.removeChild(select.firstChild)
    };

    const selectedValue = diseaseSelect.value;
    removeOptions(diseaseSelect);

    diseaseNames.forEach(diseaseName => {
        const option = document.createElement('option');
        option.value = diseaseName;
        option.textContent = diseaseName;

        if (diseaseName === selectedValue) {
            option.selected = true;
        }

        diseaseSelect.appendChild(option);
    });
}

function loadTableFromJSON() {
    const data = localStorage.getItem("tableData");

    if (!data) {
        return sendUserFeedBack('Nenhuma tabela salva na memória.');
    }

    const jsonData = JSON.parse(data);
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    resetTable(thead, tbody);
    const columns = createColumns(jsonData.columns);
    columns.forEach(column => thead.rows[0].appendChild(column));
    addRows(tbody, jsonData.rows);

    sendUserFeedBack('Tabela carregada com sucesso!');
}

function resetTable(thead, tbody) {
    const headerRow = thead.rows[0];
    headerRow.innerHTML = '<th>Doença/Sintoma</th>';
    tbody.innerHTML = "";
}

function createColumns(columns) {
    return columns.map(column => {
        const newTableColumn = document.createElement("th");
        newTableColumn.innerHTML = `
            <input type="text" value="${column}">
            <button class="btn-remove" onclick="removeColumn(event)"></button>
        `;
        return newTableColumn;
    });
}

function addRows(tbody, rows) {
    rows.forEach(rowData => {
        const newRow = tbody.insertRow();

        const diseaseCell = document.createElement("td");
        diseaseCell.innerHTML = `
            <input type="text" value="${rowData.disease}">
            <button class="btn-remove" onclick="removeRow(this)"></button>
        `;

        const valueCells = rowData.values.map(value => {
            const valueCell = document.createElement("td");
            valueCell.innerHTML = createSelect(value);
            return valueCell;
        });

        newRow.append(diseaseCell, ...valueCells);
    });
}

function addColumn() {
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
    const tbody = table.getElementsByTagName("tbody")[0];
    const newRow = tbody.insertRow();
    const columns = table.tHead.rows[0].cells.length;

    const firstCell = newRow.insertCell();
    firstCell.innerHTML = `
        <input type="text" value="Doença ${tbody.rows.length}">
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

function createSelect(selectedValue = "") {
    return `
        <select>
            <option value="Irrelevante" ${selectedValue === "Irrelevante" ? "selected" : ""}>Irrelevante</option>
            <option value="Médio" ${selectedValue === "Médio" ? "selected" : ""}>Médio</option>
            <option value="Forte" ${selectedValue === "Forte" ? "selected" : ""}>Forte</option>
        </select>
    `;
}

function getColumnsNames() {
    return [...table.querySelectorAll("thead input")]
        .map(input => input.value);
}

function getRows() {
    return [...table.querySelectorAll("tbody tr")]
        .map(row => [...row.cells]);
}

function getRowNames() {
    return getRows().map(row => getRowName(row));
}

function getRowName(row) {
    return row[0].querySelector("input").value;
}

function getRowContent(row) {
    return row.slice(1).map(cell => cell.querySelector("select").value);
}

function generateJSON() {
    const data = {
        columns: getColumnsNames(),
        rows: getRows().map(row => ({
            disease: getRowName(row),
            values: getRowContent(row)
        }))
    };

    localStorage.setItem("tableData", JSON.stringify(data));

    sendUserFeedBack(`Tabela salva na memória!`);
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) {
        sendUserFeedBack('Nenhum arquivo selecionado.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            if (!jsonData.columns || !Array.isArray(jsonData.rows)) {
                throw new Error("Formato de dados inválido.");
            }
            localStorage.setItem("tableData", JSON.stringify(jsonData));
            sendUserFeedBack('Tabela carregada com sucesso!');
            loadTableFromJSON();
        } catch (error) {
            sendUserFeedBack('Erro ao processar o arquivo JSON: ' + error.message);
        }
    };

    reader.readAsText(file);
}

function downloadJSON() {
    const data = localStorage.getItem("tableData");

    if (!data) {
        sendUserFeedBack('Nenhuma tabela salva na memória!');
        return;
    }

    // Formata o JSON com indentação de 4 espaços
    const formattedData = JSON.stringify(JSON.parse(data), null, 4);

    const blob = new Blob([formattedData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tableData.json';
    link.click();

    sendUserFeedBack('Arquivo JSON baixado com sucesso.');
}
