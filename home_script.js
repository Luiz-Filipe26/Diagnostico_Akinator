import Id3_analyzer from "./assets/scripts/Id3_analyzer.js";

let symptoms = [];
let currentIndex = 0;
const answers = {};

window.startEvaluation = startEvaluation;
window.nextSymptom = nextSymptom;

const tableData = JSON.parse(localStorage.getItem("tableData"));
if (!tableData) {
    document.querySelector(".intro").classList.add("hidden");
    showMessage("Parece que você ainda não preencheu a tabela de treinamento. <a href='/table'>Clique aqui</a> para preenchê-la.");
} else {
    symptoms = tableData.columns;
    document.getElementById("symptom").textContent = symptoms[currentIndex];
    updateQuestionProgress();
}

function startEvaluation() {
    document.querySelector(".intro").classList.add("hidden");
    document.getElementById("evaluationCard").classList.add("active");
    showMessage("");
}

function nextSymptom() {
    const selected = document.querySelector('input[name="intensity"]:checked');
    if (!selected) {
        showMessage("Selecione uma opção antes de continuar!");
        return;
    }

    answers[symptoms[currentIndex]] = selected.value;
    selected.checked = false;

    currentIndex++;
    if (currentIndex < symptoms.length) {
        document.getElementById("symptom").textContent = symptoms[currentIndex];
        updateQuestionProgress(); 
        showMessage("");
    } else {
        finishAnalysis();
    }
}

function updateQuestionProgress() {
    const totalQuestions = symptoms.length;
    const currentQuestion = currentIndex + 1; // Para mostrar de forma amigável (1-indexed)
    const progressText = `Pergunta: ${currentQuestion}/${totalQuestions}`;
    document.getElementById("questionProgress").textContent = progressText;
}

function structureTableDataForAnalysis(tableData) {
    return tableData.rows.map(row => ({
        category: row.disease,
        attributes: tableData.columns.map((col, index) => ({
            attribute: col,
            value: row.values[index]
        }))
    }));
}

function structureAnswersForAnalysis(answers) {
    return Object.entries(answers).map(([attribute, value]) => ({
        attribute,
        value
    }));
}

function finishAnalysis() {
    document.getElementById("evaluationCard").classList.remove("active");
    const trainingData = structureTableDataForAnalysis(tableData);
    const answersForAnalysis = structureAnswersForAnalysis(answers);
    const probableDisease = Id3_analyzer.predictWithTrainingData(trainingData, answersForAnalysis);

    // Obter a descrição da doença
    const descriptionData = JSON.parse(localStorage.getItem("diseaseDescriptions")) || { diseases: [] };
    const diseaseEntry = descriptionData.diseases.find(d => d.disease === probableDisease);
    const description = diseaseEntry ? diseaseEntry.description : "Não há descrição para a doença.";

    // Substituir as quebras de linha por <br> para formatar corretamente no HTML
    const formattedDescription = description.replace(/\n/g, "<br>");

    // Mostrar a mensagem com o nome da doença e a descrição
    showMessage(`
        <strong>A doença mais provável é:</strong> ${probableDisease}<br>
        <strong>Descrição da doença:</strong><br> ${formattedDescription}
    `);
}


function showMessage(text) {
    const msgDiv = document.getElementById("mensagem");
    msgDiv.innerHTML = text;
    msgDiv.classList.toggle("hidden", text === "");
}