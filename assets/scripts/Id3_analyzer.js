export default class Id3_analyzer {
    /**
      * @typedef {Object} AttributeValue
      * @property {string} attribute - Nome do atributo.
      * @property {string} value - Valor do atributo.
      */

    /**
      * @typedef {Object} TrainingDataItem
      * @property {string} category - Nome da categoria.
      * @property {AttributeValue[]} attributes - Lista de atributos para a categoria.
      */

    /**
     * @typedef {Object} DecisionTreeNode
     * @property {string|null} attributeOfQuestion - Atributo da questão ou null se for folha.
     * @property {string|null} category - Categoria de uma folha, ou null se não for folha.
     * @property {Object.<string, DecisionTreeNode>|null} children - Mapeia os valores do atributo para sub-nós, ou null se for folha.
     */

    /**
     * @param {TrainingDataItem[]} trainingData
     * @param {AttributeValue[]} answers
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
        return { attributeOfQuestion: null, category, yes: null, no: null };
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
     * Calcular o ganho de informação G(A) por atributo
     * G(A) = H(D) − H(A|D)
     * @param {number} initialEntropy
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string} attribute
     * @returns {number}
     */
    static calculateInformationGain(trainingDataSubset, attribute) {
        const categoryToOccurrencesAmount = this.getCategoryToOccurrencesAmount(trainingDataSubset);

        const initialEntropy = this.calculateInitialEntropy(categoryToOccurrencesAmount, trainingDataSubset.length);
        const conditionalEntropySum = this.calculateConditionalEntropy(trainingDataSubset, [...categoryToOccurrencesAmount.keys()], attribute);
        return initialEntropy - conditionalEntropySum;
    }

    /**
     * Calcular a entropia inicial H(D)
     * H(D) = -∑ p(c_i) log2 p(c_i)
     * @param {Map<string, number>} categoryToOccurrencesAmount
     * @param {number} totalCases
     * @returns {number}
     */
    static calculateInitialEntropy(categoryToOccurrencesAmount, totalCases) {
        if (totalCases === 0) return 0;

        return [...categoryToOccurrencesAmount.values()].reduce((totalEntropy, count) => {
            const probability = count / totalCases;
            if (probability <= 0) {
                return totalEntropy
            }
            return totalEntropy - probability * Math.log2(probability);
        }, 0);
    }

    /**
     * Calcular a entropia condicional H(D|A) para um atributo específico.
     * H(D|A) = ∑ P(v) * H(D|v)
     * @param {TrainingDataItem[]} trainingDataSubset
     * @param {string[]} categories
     * @param {string} attribute
     * @returns {number}
     */
    static calculateConditionalEntropy(trainingDataSubset, categories, attribute) {
        const attributeValues = new Set(trainingDataSubset.flatMap(item =>
            item.attributes.filter(attr => attr.attribute === attribute).map(attr => attr.value)
        ));

        return [...attributeValues].reduce((conditionalEntropy, value) => {
            const dataWithAttributeValue = trainingDataSubset.filter(item =>
                item.attributes.some(attr => attr.attribute === attribute && attr.value === value)
            );

            const totalFiltered = dataWithAttributeValue.length;
            if (totalFiltered === 0) return conditionalEntropy;

            const valueProbability = totalFiltered / trainingDataSubset.length;
            const valueEntropy = this.calculateValueEntropy(categories, dataWithAttributeValue);

            return conditionalEntropy + valueProbability * valueEntropy;
        }, 0);
    }

    /**
     * Calcular a entropia de um valor para um conjunto de dados filtrado.
     * H(D|v) = -∑ P(c_i | v) log2 P(c_i | v)
     * @param {string[]} categories
     * @param {TrainingDataItem[]} filteredData
     * @returns {number}
     */
    static calculateValueEntropy(categories, filteredData) {
        const totalFiltered = filteredData.length;

        const categoryProbabilities = categories.map(category => {
            const countInSubset = filteredData.filter(item => item.category === category).length;
            return countInSubset / totalFiltered;
        }).filter(prob => prob > 0);

        return categoryProbabilities.reduce((sum, categoryProbability) => {
            return sum - categoryProbability * Math.log2(categoryProbability);
        }, 0);
    }

}