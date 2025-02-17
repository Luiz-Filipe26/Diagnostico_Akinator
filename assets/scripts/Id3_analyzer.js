export default class Id3_analyzer {
    /**
      * @typedef {Object} TrainingDataItem
      * @property {string} category - Nome da categoria.
      * @property {string[]} attributes - Lista de atributos para a categoria.
      */

    /**
     * @typedef {Object} DecisionTreeNode
     * @property {string|null} attributeOfQuestion - Atributo da questão ou null se for folha.
     * @property {string|null} category - Categoria de uma folha.
     * @property {DecisionTreeNode|null} yes - Sub-árvore para a resposta "sim" ou null se folha.
     * @property {DecisionTreeNode|null} no - Sub-árvore para a resposta "não" ou null se folha.
     */

    /**
     * @param {TrainingDataItem[]} trainingData
     * @param {string[]} answers
     * @returns {string}
     */
    static predictWithTrainingData(trainingData, answers) {
        const attributes = this.getAttributes(trainingData);

        const decisionTree = this.buildDecisionTree(trainingData, attributes, []);

        return this.predict(decisionTree, answers);
    }

    /**
     * @param {DecisionTreeNode} decisionTree
     * @param {string[]} answers
     * @returns {string}
     */
    static predict(decisionTree, answers) {
        const isLeaf = (currentNode) => Boolean(currentNode.category);

        let currentNode = decisionTree;

        while (!isLeaf(currentNode)) {
            const hasAttribute = answers.includes(currentNode.attributeOfQuestion);

            if (hasAttribute) {
                currentNode = currentNode.yes;
            } else {
                currentNode = currentNode.no;
            }
        }

        return currentNode.category;
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @returns {string[]}
     */
    static getAttributes(trainingDataSubset) {
        return [...new Set(trainingDataSubset.flatMap(category => category.attributes))];
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} attributes
     * @returns {DecisionTreeNode}
     */
    static buildDecisionTree(trainingDataSubset, attributes) {
        const leafNode = this.getLeafNode(trainingDataSubset, attributes);

        if (leafNode) {
            return leafNode;
        }

        const bestAttribute = this.getBestInformationGainAttribute(trainingDataSubset, attributes);
        const [yesData, noData] = this.splitDataByAttribute(trainingDataSubset, bestAttribute);

        // Define os nós filhos considerando o caso de subconjuntos vazios
        const nodeYes = yesData.length > 0
            ? this.buildDecisionTree(yesData, attributes.filter(a => a !== bestAttribute))
            : this.createLeafNode(this.getMostFrequentCategory(trainingDataSubset));

        const nodeNo = noData.length > 0
            ? this.buildDecisionTree(noData, attributes.filter(a => a !== bestAttribute))
            : this.createLeafNode(this.getMostFrequentCategory(trainingDataSubset));

        return {
            attributeOfQuestion: bestAttribute,
            category: null,
            yes: nodeYes,
            no: nodeNo
        };
    }

    /**
     * Buscar folha da árvore caso necessário
     * @param {string} category
     * @returns {DecisionTreeNode}
     */
    static createLeafNode(category) {
        return {attributeOfQuestion: null, category, yes: null, no: null};
    }

    /**
     * Buscar folha da árvore caso necessário
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} attributes
     * @returns {DecisionTreeNode|null}
     */
    static getLeafNode(trainingDataSubset, attributes) {
        if (trainingDataSubset.length == 0) {
            return null;
        }

        const isAllOfSameCategory = trainingDataSubset.every(item => item.category === trainingDataSubset[0].category);

        if (isAllOfSameCategory) {
            return this.createLeafNode(trainingDataSubset[0].category);
        }
        else if (attributes.length == 0) {
            const category = this.getMostFrequentCategory(trainingDataSubset);
            return this.createLeafNode(category);
        }

        return null;
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string} attribute
     * @returns {[TrainingDataItem[], TrainingDataItem[]]}
     */
    static splitDataByAttribute(trainingDataSubset, attribute) {
        const yesData = trainingDataSubset.filter(categoryData => categoryData.attributes.includes(attribute));
        const noData = trainingDataSubset.filter(categoryData => !categoryData.attributes.includes(attribute));
        return [yesData, noData];
    }

    /**
     * @param {Map<string, number>} categoryToOccurrencesAmount
     * @returns {string}
     */
    static getMostFrequentCategory(trainingDataSubset) {
        return [...this.getCategoryToOccurrencesAmount(trainingDataSubset).entries()].reduce((max, [category, count]) =>
            count > max[1] ? [category, count] : max, ["", 0]
        )[0];
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @returns {Map<string, number>}
     */
    static getCategoryToOccurrencesAmount(trainingDataSubset) {
        return trainingDataSubset.reduce((categoryToOccurrencesAmount, { category }) =>
            categoryToOccurrencesAmount.set(category, (categoryToOccurrencesAmount.get(category) || 0) + 1), new Map());
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} attributes
     * @returns {string}
     */
    static getBestInformationGainAttribute(trainingDataSubset, attributes) {
        const attributeToInformationGain = this.getAttributeToInformationGain(trainingDataSubset, attributes);

        return [...attributeToInformationGain.entries()].reduce(
            (bestGainEntry, [attribute, gain]) => gain > bestGainEntry[1] ? [attribute, gain] : bestGainEntry,
            ["", -1]
        )[0];
    }

    /**
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} attributes
     * @returns {Map<string, number>}
     */
    static getAttributeToInformationGain(trainingDataSubset, attributes) {
        return attributes.reduce((attributeToInformationGain, attribute) => {
            const gain = this.calculateInformationGain(trainingDataSubset, attribute);
            attributeToInformationGain.set(attribute, gain);
            return attributeToInformationGain;
        }, new Map());
    }

    /**
     * Calcular o ganho de informação G(S) por atributo
     * G(S) = H(D) − H(S|D)
     * @param {number} initialEntropy
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string} attribute
     * @returns {number}
     */
    static calculateInformationGain(trainingDataSubset, attribute) {
        const categoryToOccurrencesAmount = this.getCategoryToOccurrencesAmount(trainingDataSubset);

        const initialEntropy = this.calculateInitialEntropy(categoryToOccurrencesAmount, trainingDataSubset.length)
        const conditionalEntropySum = this.calculateConditionalEntropySum(trainingDataSubset, categoryToOccurrencesAmount, attribute);
        return initialEntropy - conditionalEntropySum;
    }

    /**
     * Calcular a entropia inicial H(D)
     * H(D) = -∑ p(d1) log2 p(d1)  
     * @param {Map<string, number>} categoryToOccurrencesAmount
     * @param {number} totalCases
     * @returns {number}
     */
    static calculateInitialEntropy(categoryToOccurrencesAmount, totalCases) {
        if (totalCases == 0) return 0;

        return [...categoryToOccurrencesAmount.values()].reduce((totalEntropy, count) => {
            const probability = count / totalCases;
            return totalEntropy - (probability || 1) * Math.log2(probability || 1); // Garante que probability nunca seja 0
        }, 0);
    }

    /**
     * Calcular a soma da entropia condicional (H(S|v))
     * H(S|D) = ∑ P(v) H(D|v)
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {Map<string, number>} categoryToOccurrencesAmount
     * @param {string} attribute
     * @returns {number}
     */
    static calculateConditionalEntropySum(trainingDataSubset, categoryToOccurrencesAmount, attribute) {
        const relevantCases = trainingDataSubset.filter(dataItem =>
            dataItem.attributes.includes(attribute)
        );

        const totalRelevantCases = relevantCases.length;
        if (totalRelevantCases == 0) return 0;

        return [...categoryToOccurrencesAmount.values()].reduce((sum, count) => {
            const p_v = count / totalRelevantCases;
            sum += p_v * this.calculateConditionalEntropy(trainingDataSubset, [...categoryToOccurrencesAmount.keys()], attribute);
            return sum;
        }, 0);
    }

    /**
     * Calcular a entropia condicional H(D|v) para todas as categorias por atributo.
     * H(D|v) = -∑ p(d1 | v) log2 p(d1 | v)  
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} categories
     * @param {string} attribute
     * @returns {number}
     */
    static calculateConditionalEntropy(trainingDataSubset, categories, attribute) {
        if (trainingDataSubset.length == 0) {
            return 0;
        }

        return categories.reduce((sum, category) => {
            const numOfFilteredItems = trainingDataSubset.filter(item => item.category === category && item.attributes.includes(attribute)).length;

            if (numOfFilteredItems == 0) {
                return sum;
            }

            const p_d_given_v = numOfFilteredItems / trainingDataSubset.length;
            return sum - (p_d_given_v * Math.log2(p_d_given_v));
        }, 0);
    }

}