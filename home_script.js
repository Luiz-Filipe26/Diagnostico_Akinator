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

    answers[symptoms[currentIndex]] = convertIntensityToNumber(selected.value);
    selected.checked = false;

    currentIndex++;
    if (currentIndex < symptoms.length) {
        document.getElementById("symptom").textContent = symptoms[currentIndex];
        showMessage("");
    } else {
        evaluateProbableDisease(symptoms, answers);
    }
}

function convertIntensityToNumber(intensity) {
    switch (intensity) {
        case "Irrelevante":
            return 1;
        case "Médio":
            return 2;
        case "Forte":
            return 3;
        default:
            return 0;
    }
}

function evaluateProbableDisease(symptoms, answers) {
    const diseaseScores = new Map();

    for (let i = 0; i < tableData.rows.length; i++) {
        let score = 0;

        for (let j = 0; j < symptoms.length; j++) {
            const answerValue = answers[symptoms[j]];
            const tableValue = convertIntensityToNumber(tableData.rows[i].values[j]);
            score += Math.abs(answerValue - tableValue);
        }

        const disease = tableData.rows[i].disease;
        if (diseaseScores.has(disease)) {
            diseaseScores.set(disease, diseaseScores.get(disease) + score);
        } else {
            diseaseScores.set(disease, score);
        }
    }

    let probableDisease = "Doença desconhecida";
    let minScore = Infinity;

    for (let [disease, score] of diseaseScores) {
        if (score < minScore) {
            minScore = score;
            probableDisease = disease;
        }
    }

    showMessage(`A doença mais provável é: ${probableDisease}`);
}

function showMessage(text) {
    const msgDiv = document.getElementById("mensagem");
    msgDiv.innerHTML = text;
    msgDiv.classList.toggle("hidden", text === "");
}
