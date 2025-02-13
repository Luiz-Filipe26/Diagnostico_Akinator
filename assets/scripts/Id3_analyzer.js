export default class Id3_analyzer {
    /*
    Formato de entrada de trainingData:
    [
        {
            disease: "Doença A",
            symptoms: ["Febre_Forte", "Tosse_Médio"]
        },
        {
            disease: "Doença B",
            symptoms: ["Febre_Médio", "Tosse_Forte"]
        }
    ]
    Formato de entrada de answers:
    [
        "Sintoma 1_Médio",
        "Sintoma 2_Forte"
    ]
    */
    static getProbableResult(trainingData, answers) {
        const symptoms = this.getSymptoms(trainingData);

        const decisionTree = this.buildDecisionTree(trainingData, symptoms, []);

        return this.predict(decisionTree, answers);
    }

    // get all symptoms from the training data
    static getSymptoms(trainingData) {
        return [...new Set(trainingData.flatMap(disease => disease.symptoms))];
    }

    // prever o resultado mais provável
    static predict(decisionTree, answers) {
        let currentNode = decisionTree;

        // Percorre a árvore enquanto existirem perguntas para fazer
        while (currentNode.symptomOfQuestion) {
            // Verifica se a resposta para o sintoma está presente nos sintomas da resposta
            const answer = answers.includes(currentNode.symptomOfQuestion);

            // Decide qual ramo seguir (yes ou no) com base na resposta
            if (answer) {
                currentNode = currentNode.yes;
            } else {
                currentNode = currentNode.no;
            }
        }

        // Quando chegar a uma folha, retorna a doença
        return currentNode.disease;
    }

    // Método para construir a árvore de decisão
    static buildDecisionTree(trainingData, symptoms, previousAnswers) {
        // Buscar folha da árvore caso necessário
        const leafNode = this.getLeafNode(trainingData, symptoms);

        if (leafNode) {
            return leafNode;
        }

        // Obter o melhor sintoma com o maior ganho de informação
        const bestSymptom = this.getBestInformationGain(previousAnswers, trainingData, symptoms);

        // Dividir os dados em dois conjuntos com base no sintoma escolhido
        const [yesData, noData] = this.splitDataBySymptom(trainingData, bestSymptom);

        // Criar o nó de decisão com base no melhor sintoma
        const node = {
            symptomOfQuestion: bestSymptom,
            disease: null,  // doença será nula até a folha
            yes: this.buildDecisionTree(yesData, symptoms.filter(s => s !== bestSymptom), [...previousAnswers, { symptom: bestSymptom, answer: true }]),
            no: this.buildDecisionTree(noData, symptoms.filter(s => s !== bestSymptom), [...previousAnswers, { symptom: bestSymptom, answer: false }])
        };

        return node;
    }

    //buscar folha da árvore caso necessário
    static getLeafNode(trainingData, symptoms) {
        const diseaseToOccurrencesAmount = this.getDiseaseToOccurrencesAmount(trainingData);

        // Se todas as instâncias têm a mesma doença, retornamos essa doença
        if (diseaseToOccurrencesAmount.size === 1) {
            const disease = [...diseaseToOccurrencesAmount.keys()][0];
            return { symptomOfQuestion: null, disease, yes: null, no: null }; // folha com a doença
        }

        // Se não restam sintomas para perguntar, escolhemos a doença mais frequente como resposta
        if (symptoms.length === 0) {
            const mostFrequentDisease = this.getMostFrequentDisease(trainingData);
            return { symptomOfQuestion: null, disease: mostFrequentDisease, yes: null, no: null }; // folha com a doença mais frequente
        }

        return null;
    }

    // Dividir os dados de treinamento com base no sintoma
    static splitDataBySymptom(trainingData, symptom) {
        const yesData = trainingData.filter(diseaseData => diseaseData.symptoms.includes(symptom));
        const noData = trainingData.filter(diseaseData => !diseaseData.symptoms.includes(symptom));
        return [yesData, noData];
    }

    // Obter a doença mais frequente nos dados
    static getMostFrequentDisease(trainingData) {
        const diseaseToOccurrencesAmount = this.getDiseaseToOccurrencesAmount(trainingData);
        return [...diseaseToOccurrencesAmount.entries()].reduce((max, [disease, count]) =>
            count > max[1] ? [disease, count] : max, ["", 0]
        )[0];
    }

    // map disease -> count of occurrences
    static getDiseaseToOccurrencesAmount(trainingData) {
        return trainingData.reduce((diseaseToOccurrencesAmount, { disease }) =>
            diseaseToOccurrencesAmount.set(disease, (diseaseToOccurrencesAmount.get(disease) || 0) + 1), new Map());
    }

    // initial entropy of the disease set
    static calculateInitialEntropy(diseaseCounts, totalCases) {
        if (totalCases === 0) return 0;
    
        return [...diseaseCounts.values()].reduce((totalEntropy, count) => {
            const probability = count / totalCases;
            return totalEntropy - (probability || 1) * Math.log2(probability || 1); // Garante que probability nunca seja 0
        }, 0);
    }
    

    /*
    Formato de entrada de previousSymptoms:
    [
        {
            symptom: "Febre_Forte",
            answer: true,
        },
        {
            symptom: "Tosse_Médio",
            answer: false,
        }
    ]*/
    // get the symptom with best information gain
    static getBestInformationGain(previousSymptoms, trainingData, symptoms) {
        // Filtra os dados de treinamento com base nos sintomas e respostas
        const filteredData = trainingData.filter(diseaseData =>
            previousSymptoms.every(({ symptom, answer }) => {
                if (answer) {
                    return diseaseData.symptoms.includes(symptom);
                } else {
                    return !diseaseData.symptoms.includes(symptom);
                }
            })
        );

        const diseaseToOccurrencesAmount = this.getDiseaseToOccurrencesAmount(filteredData);

        const symptomToInformationGain = this.getSymptomToInformationGain(filteredData, symptoms, diseaseToOccurrencesAmount);

        return [...symptomToInformationGain.entries()].reduce(
            (bestGainEntry, [symptom, gain]) => gain > bestGainEntry[1] ? [symptom, gain] : bestGainEntry,
            ["", 0]
        )[0];
    }

    // map symptom to informationGain
    static getSymptomToInformationGain(trainingData, symptoms, diseaseToOccurrencesAmount) {
        const initialEntropy = this.calculateInitialEntropy(diseaseToOccurrencesAmount, trainingData.length)
        return symptoms.reduce((symptomToInformationGain, symptom) => {
            const gain = this.calculateInformationGain(initialEntropy, trainingData, symptom, diseaseToOccurrencesAmount);
            symptomToInformationGain.set(symptom, gain);
            return symptomToInformationGain;
        }, new Map());
    }

    // calculate G(S) = H(D) − H(S|D) by symptom
    static calculateInformationGain(initialEntropy, trainingData, symptom, diseaseToOccurrencesAmount) {
        const conditionalEntropySum = this.calculateConditionalEntropySum(trainingData, symptom, diseaseToOccurrencesAmount);
        return initialEntropy - conditionalEntropySum;
    }

    // calculate H(S|v) = sum of p(d|v) * H(D|V) for all diseases by symptom
    static calculateConditionalEntropySum(trainingData, symptom, diseaseToOccurrencesAmount) {
        const relevantCases = trainingData.filter(diseaseData =>
            diseaseData.symptoms.includes(symptom)
        );

        const totalRelevantCases = relevantCases.length;
        if (totalRelevantCases === 0) return 0;

        return [...diseaseToOccurrencesAmount.values()].reduce((sum, count) => {
            const p_v = count / totalRelevantCases;
            sum += p_v * this.calculateConditionalEntropy(trainingData, [...diseaseToOccurrencesAmount.keys()], symptom);
            return sum;
        }, 0);
    }

    // calculate H(D|v) = - sum of p(d|v) * log2(p(d|v)) for all diseases by symptom
    static calculateConditionalEntropy(trainingData, diseases, symptom) {
        return diseases.reduce((sum, disease) => sum - this.calculateEntropyItem(trainingData, symptom, disease), 0);
    }

    // calculate p(d|v) * log2(p(d|v))
    static calculateEntropyItem(trainingData, symptom, disease) {
        const totalCasesForDisease = trainingData.filter(diseaseData =>
            diseaseData.disease === disease &&
            diseaseData.symptoms.includes(symptom)
        ).length;

        if (totalCasesForDisease === 0) return 0;

        const symptomCount = totalCasesForDisease;

        // Probabilidade condicional p(d|v)
        const p_d_given_v = symptomCount / totalCasesForDisease;

        // Retorna o valor calculado, porém 0 para não quebrar o logaritmo
        return p_d_given_v === 0 ? 0 : p_d_given_v * Math.log2(p_d_given_v);
    }
}