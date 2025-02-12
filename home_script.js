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
        showMessage("");
    } else {
        finishAnalysis();
    }
}

function structureTableDataForAnalysis(tableData) {
    return tableData.rows.map(row => ({
        disease: row.disease,
        symptoms: tableData.columns
            .map((col, index) => row.values[index] !== "Irrelevante" ? `${col}_${row.values[index]}` : null)
            .filter(Boolean)
    }));
}

function strucutureAnswersForAnalysis(answers) {
    return Object.keys(answers)
        .filter(symptom => answers[symptom] !== "Irrelevante") // Filtra os sintomas com resposta "Irrelevante"
        .map(symptom => `${symptom}_${answers[symptom]}`); // Combina o sintoma com a resposta
}

function finishAnalysis() {
    document.getElementById("evaluationCard").classList.remove("active");
    const trainingData = structureTableDataForAnalysis(tableData);
    const answersForAnalysis = strucutureAnswersForAnalysis(answers);
    const probableDisease = Id3_analyzer.getProbableResult(trainingData, answersForAnalysis);
    showMessage(`A doença mais provável é: ${probableDisease}`);
}

function showMessage(text) {
    const msgDiv = document.getElementById("mensagem");
    msgDiv.innerHTML = text;
    msgDiv.classList.toggle("hidden", text === "");
}