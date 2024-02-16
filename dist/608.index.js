"use strict";
exports.id = 608;
exports.ids = [608,379,726];
exports.modules = {

/***/ 63608:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MapReduceDocumentsChain": () => (/* binding */ MapReduceDocumentsChain),
/* harmony export */   "RefineDocumentsChain": () => (/* binding */ RefineDocumentsChain),
/* harmony export */   "StuffDocumentsChain": () => (/* binding */ StuffDocumentsChain)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73197);
/* harmony import */ var _llm_chain_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56726);
/* harmony import */ var _prompts_prompt_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(23379);



/**
 * Chain that combines documents by stuffing into context.
 * @augments BaseChain
 * @augments StuffDocumentsChainInput
 */
class StuffDocumentsChain extends _base_js__WEBPACK_IMPORTED_MODULE_0__/* .BaseChain */ .l {
    get inputKeys() {
        return [this.inputKey, ...this.llmChain.inputKeys];
    }
    get outputKeys() {
        return this.llmChain.outputKeys;
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "llmChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "input_documents"
        });
        Object.defineProperty(this, "documentVariableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "context"
        });
        this.llmChain = fields.llmChain;
        this.documentVariableName =
            fields.documentVariableName ?? this.documentVariableName;
        this.inputKey = fields.inputKey ?? this.inputKey;
    }
    /** @ignore */
    async _call(values, runManager) {
        if (!(this.inputKey in values)) {
            throw new Error(`Document key ${this.inputKey} not found.`);
        }
        const { [this.inputKey]: docs, ...rest } = values;
        const texts = docs.map(({ pageContent }) => pageContent);
        const text = texts.join("\n\n");
        const result = await this.llmChain.call({
            ...rest,
            [this.documentVariableName]: text,
        }, runManager?.getChild());
        return result;
    }
    _chainType() {
        return "stuff_documents_chain";
    }
    static async deserialize(data) {
        if (!data.llm_chain) {
            throw new Error("Missing llm_chain");
        }
        return new StuffDocumentsChain({
            llmChain: await _llm_chain_js__WEBPACK_IMPORTED_MODULE_1__.LLMChain.deserialize(data.llm_chain),
        });
    }
    serialize() {
        return {
            _type: this._chainType(),
            llm_chain: this.llmChain.serialize(),
        };
    }
}
/**
 * Combine documents by mapping a chain over them, then combining results.
 * @augments BaseChain
 * @augments StuffDocumentsChainInput
 */
class MapReduceDocumentsChain extends _base_js__WEBPACK_IMPORTED_MODULE_0__/* .BaseChain */ .l {
    get inputKeys() {
        return [this.inputKey, ...this.combineDocumentChain.inputKeys];
    }
    get outputKeys() {
        return this.combineDocumentChain.outputKeys;
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "llmChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "input_documents"
        });
        Object.defineProperty(this, "documentVariableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "context"
        });
        Object.defineProperty(this, "returnIntermediateSteps", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3000
        });
        Object.defineProperty(this, "maxIterations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 10
        });
        Object.defineProperty(this, "ensureMapStep", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "combineDocumentChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.llmChain = fields.llmChain;
        this.combineDocumentChain = fields.combineDocumentChain;
        this.documentVariableName =
            fields.documentVariableName ?? this.documentVariableName;
        this.ensureMapStep = fields.ensureMapStep ?? this.ensureMapStep;
        this.inputKey = fields.inputKey ?? this.inputKey;
        this.maxTokens = fields.maxTokens ?? this.maxTokens;
        this.maxIterations = fields.maxIterations ?? this.maxIterations;
        this.returnIntermediateSteps = fields.returnIntermediateSteps ?? false;
    }
    /** @ignore */
    async _call(values, runManager) {
        if (!(this.inputKey in values)) {
            throw new Error(`Document key ${this.inputKey} not found.`);
        }
        const { [this.inputKey]: docs, ...rest } = values;
        let currentDocs = docs;
        let intermediateSteps = [];
        // For each iteration, we'll use the `llmChain` to get a new result
        for (let i = 0; i < this.maxIterations; i += 1) {
            const inputs = currentDocs.map((d) => ({
                [this.documentVariableName]: d.pageContent,
                ...rest,
            }));
            // Calculate the total tokens required in the input
            const promises = inputs.map(async (i) => {
                const prompt = await this.llmChain.prompt.format(i);
                return this.llmChain.llm.getNumTokens(prompt);
            });
            const length = await Promise.all(promises).then((results) => results.reduce((a, b) => a + b, 0));
            const canSkipMapStep = i !== 0 || !this.ensureMapStep;
            const withinTokenLimit = length < this.maxTokens;
            // If we can skip the map step, and we're within the token limit, we don't
            // need to run the map step, so just break out of the loop.
            if (canSkipMapStep && withinTokenLimit) {
                break;
            }
            const results = await this.llmChain.apply(inputs, runManager ? [runManager.getChild()] : undefined);
            const { outputKey } = this.llmChain;
            // If the flag is set, then concat that to the intermediate steps
            if (this.returnIntermediateSteps) {
                intermediateSteps = intermediateSteps.concat(results.map((r) => r[outputKey]));
            }
            currentDocs = results.map((r) => ({
                pageContent: r[outputKey],
            }));
        }
        // Now, with the final result of all the inputs from the `llmChain`, we can
        // run the `combineDocumentChain` over them.
        const newInputs = { input_documents: currentDocs, ...rest };
        const result = await this.combineDocumentChain.call(newInputs, runManager?.getChild());
        // Return the intermediate steps results if the flag is set
        if (this.returnIntermediateSteps) {
            return { ...result, intermediateSteps };
        }
        return result;
    }
    _chainType() {
        return "map_reduce_documents_chain";
    }
    static async deserialize(data) {
        if (!data.llm_chain) {
            throw new Error("Missing llm_chain");
        }
        if (!data.combine_document_chain) {
            throw new Error("Missing combine_document_chain");
        }
        return new MapReduceDocumentsChain({
            llmChain: await _llm_chain_js__WEBPACK_IMPORTED_MODULE_1__.LLMChain.deserialize(data.llm_chain),
            combineDocumentChain: await _base_js__WEBPACK_IMPORTED_MODULE_0__/* .BaseChain.deserialize */ .l.deserialize(data.combine_document_chain),
        });
    }
    serialize() {
        return {
            _type: this._chainType(),
            llm_chain: this.llmChain.serialize(),
            combine_document_chain: this.combineDocumentChain.serialize(),
        };
    }
}
/**
 * Combine documents by doing a first pass and then refining on more documents.
 * @augments BaseChain
 * @augments RefineDocumentsChainInput
 */
class RefineDocumentsChain extends _base_js__WEBPACK_IMPORTED_MODULE_0__/* .BaseChain */ .l {
    get defaultDocumentPrompt() {
        return new _prompts_prompt_js__WEBPACK_IMPORTED_MODULE_2__.PromptTemplate({
            inputVariables: ["page_content"],
            template: "{page_content}",
        });
    }
    get inputKeys() {
        return [this.inputKey, ...this.refineLLMChain.inputKeys];
    }
    get outputKeys() {
        return [this.outputKey];
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "llmChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "input_documents"
        });
        Object.defineProperty(this, "outputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "output_text"
        });
        Object.defineProperty(this, "documentVariableName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "context"
        });
        Object.defineProperty(this, "initialResponseName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "existing_answer"
        });
        Object.defineProperty(this, "refineLLMChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "documentPrompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: this.defaultDocumentPrompt
        });
        this.llmChain = fields.llmChain;
        this.refineLLMChain = fields.refineLLMChain;
        this.documentVariableName =
            fields.documentVariableName ?? this.documentVariableName;
        this.inputKey = fields.inputKey ?? this.inputKey;
        this.outputKey = fields.outputKey ?? this.outputKey;
        this.documentPrompt = fields.documentPrompt ?? this.documentPrompt;
        this.initialResponseName =
            fields.initialResponseName ?? this.initialResponseName;
    }
    /** @ignore */
    async _constructInitialInputs(doc, rest) {
        const baseInfo = {
            page_content: doc.pageContent,
            ...doc.metadata,
        };
        const documentInfo = {};
        this.documentPrompt.inputVariables.forEach((value) => {
            documentInfo[value] = baseInfo[value];
        });
        const baseInputs = {
            [this.documentVariableName]: await this.documentPrompt.format({
                ...documentInfo,
            }),
        };
        const inputs = { ...baseInputs, ...rest };
        return inputs;
    }
    /** @ignore */
    async _constructRefineInputs(doc, res) {
        const baseInfo = {
            page_content: doc.pageContent,
            ...doc.metadata,
        };
        const documentInfo = {};
        this.documentPrompt.inputVariables.forEach((value) => {
            documentInfo[value] = baseInfo[value];
        });
        const baseInputs = {
            [this.documentVariableName]: await this.documentPrompt.format({
                ...documentInfo,
            }),
        };
        const inputs = { [this.initialResponseName]: res, ...baseInputs };
        return inputs;
    }
    /** @ignore */
    async _call(values, runManager) {
        if (!(this.inputKey in values)) {
            throw new Error(`Document key ${this.inputKey} not found.`);
        }
        const { [this.inputKey]: docs, ...rest } = values;
        const currentDocs = docs;
        const initialInputs = await this._constructInitialInputs(currentDocs[0], rest);
        let res = await this.llmChain.predict({ ...initialInputs }, runManager?.getChild());
        const refineSteps = [res];
        for (let i = 1; i < currentDocs.length; i += 1) {
            const refineInputs = await this._constructRefineInputs(currentDocs[i], res);
            const inputs = { ...refineInputs, ...rest };
            res = await this.refineLLMChain.predict({ ...inputs }, runManager?.getChild());
            refineSteps.push(res);
        }
        return { [this.outputKey]: res };
    }
    _chainType() {
        return "refine_documents_chain";
    }
    static async deserialize(data) {
        const SerializedLLMChain = data.llm_chain;
        if (!SerializedLLMChain) {
            throw new Error("Missing llm_chain");
        }
        const SerializedRefineDocumentChain = data.refine_llm_chain;
        if (!SerializedRefineDocumentChain) {
            throw new Error("Missing refine_llm_chain");
        }
        return new RefineDocumentsChain({
            llmChain: await _llm_chain_js__WEBPACK_IMPORTED_MODULE_1__.LLMChain.deserialize(SerializedLLMChain),
            refineLLMChain: await _llm_chain_js__WEBPACK_IMPORTED_MODULE_1__.LLMChain.deserialize(SerializedRefineDocumentChain),
        });
    }
    serialize() {
        return {
            _type: this._chainType(),
            llm_chain: this.llmChain.serialize(),
            refine_llm_chain: this.refineLLMChain.serialize(),
        };
    }
}


/***/ }),

/***/ 56726:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "LLMChain": () => (/* binding */ LLMChain)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73197);
/* harmony import */ var _prompts_base_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(55411);
/* harmony import */ var _base_language_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(57396);



/**
 * Chain to run queries against LLMs.
 *
 * @example
 * ```ts
 * import { LLMChain } from "langchain/chains";
 * import { OpenAI } from "langchain/llms/openai";
 * import { PromptTemplate } from "langchain/prompts";
 *
 * const prompt = PromptTemplate.fromTemplate("Tell me a {adjective} joke");
 * const llm = new LLMChain({ llm: new OpenAI(), prompt });
 * ```
 */
class LLMChain extends _base_js__WEBPACK_IMPORTED_MODULE_0__/* .BaseChain */ .l {
    get inputKeys() {
        return this.prompt.inputVariables;
    }
    get outputKeys() {
        return [this.outputKey];
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "prompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "llm", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "text"
        });
        Object.defineProperty(this, "outputParser", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.prompt = fields.prompt;
        this.llm = fields.llm;
        this.outputKey = fields.outputKey ?? this.outputKey;
        this.outputParser = fields.outputParser ?? this.outputParser;
        if (this.prompt.outputParser) {
            if (this.outputParser) {
                throw new Error("Cannot set both outputParser and prompt.outputParser");
            }
            this.outputParser = this.prompt.outputParser;
        }
    }
    /** @ignore */
    async _getFinalOutput(generations, promptValue, runManager) {
        const completion = generations[0].text;
        let finalCompletion;
        if (this.outputParser) {
            finalCompletion = await this.outputParser.parseWithPrompt(completion, promptValue, runManager?.getChild());
        }
        else {
            finalCompletion = completion;
        }
        return finalCompletion;
    }
    /**
     * Run the core logic of this chain and add to output if desired.
     *
     * Wraps _call and handles memory.
     */
    call(values, callbacks) {
        return super.call(values, callbacks);
    }
    /** @ignore */
    async _call(values, runManager) {
        const valuesForPrompt = { ...values };
        const valuesForLLM = {};
        for (const key of this.llm.callKeys) {
            if (key in values) {
                valuesForLLM[key] = values[key];
                delete valuesForPrompt[key];
            }
        }
        const promptValue = await this.prompt.formatPromptValue(valuesForPrompt);
        const { generations } = await this.llm.generatePrompt([promptValue], valuesForLLM, runManager?.getChild());
        return {
            [this.outputKey]: await this._getFinalOutput(generations[0], promptValue, runManager),
        };
    }
    /**
     * Format prompt with values and pass to LLM
     *
     * @param values - keys to pass to prompt template
     * @param callbackManager - CallbackManager to use
     * @returns Completion from LLM.
     *
     * @example
     * ```ts
     * llm.predict({ adjective: "funny" })
     * ```
     */
    async predict(values, callbackManager) {
        const output = await this.call(values, callbackManager);
        return output[this.outputKey];
    }
    _chainType() {
        return "llm_chain";
    }
    static async deserialize(data) {
        const { llm, prompt } = data;
        if (!llm) {
            throw new Error("LLMChain must have llm");
        }
        if (!prompt) {
            throw new Error("LLMChain must have prompt");
        }
        return new LLMChain({
            llm: await _base_language_index_js__WEBPACK_IMPORTED_MODULE_1__/* .BaseLanguageModel.deserialize */ .q.deserialize(llm),
            prompt: await _prompts_base_js__WEBPACK_IMPORTED_MODULE_2__/* .BasePromptTemplate.deserialize */ .dy.deserialize(prompt),
        });
    }
    serialize() {
        return {
            _type: this._chainType(),
            llm: this.llm.serialize(),
            prompt: this.prompt.serialize(),
        };
    }
}


/***/ }),

/***/ 55411:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Al": () => (/* binding */ BaseStringPromptTemplate),
/* harmony export */   "dy": () => (/* binding */ BasePromptTemplate)
/* harmony export */ });
/* unused harmony exports StringPromptValue, BaseExampleSelector */
/* harmony import */ var _schema_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78102);

class StringPromptValue extends _schema_index_js__WEBPACK_IMPORTED_MODULE_0__/* .BasePromptValue */ .MJ {
    constructor(value) {
        super();
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.value = value;
    }
    toString() {
        return this.value;
    }
    toChatMessages() {
        return [new _schema_index_js__WEBPACK_IMPORTED_MODULE_0__/* .HumanChatMessage */ .Z(this.value)];
    }
}
/**
 * Base class for prompt templates. Exposes a format method that returns a
 * string prompt given a set of input values.
 */
class BasePromptTemplate {
    constructor(input) {
        Object.defineProperty(this, "inputVariables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outputParser", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "partialVariables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { inputVariables } = input;
        if (inputVariables.includes("stop")) {
            throw new Error("Cannot have an input variable named 'stop', as it is used internally, please rename.");
        }
        Object.assign(this, input);
    }
    async mergePartialAndUserVariables(userVariables) {
        const partialVariables = this.partialVariables ?? {};
        const partialValues = {};
        for (const [key, value] of Object.entries(partialVariables)) {
            if (typeof value === "string") {
                partialValues[key] = value;
            }
            else {
                partialValues[key] = await value();
            }
        }
        const allKwargs = { ...partialValues, ...userVariables };
        return allKwargs;
    }
    /**
     * Load a prompt template from a json-like object describing it.
     *
     * @remarks
     * Deserializing needs to be async because templates (e.g. {@link FewShotPromptTemplate}) can
     * reference remote resources that we read asynchronously with a web
     * request.
     */
    static async deserialize(data) {
        switch (data._type) {
            case "prompt": {
                const { PromptTemplate } = await __webpack_require__.e(/* import() */ 379).then(__webpack_require__.bind(__webpack_require__, 23379));
                return PromptTemplate.deserialize(data);
            }
            case undefined: {
                const { PromptTemplate } = await __webpack_require__.e(/* import() */ 379).then(__webpack_require__.bind(__webpack_require__, 23379));
                return PromptTemplate.deserialize({ ...data, _type: "prompt" });
            }
            case "few_shot": {
                const { FewShotPromptTemplate } = await __webpack_require__.e(/* import() */ 609).then(__webpack_require__.bind(__webpack_require__, 10609));
                return FewShotPromptTemplate.deserialize(data);
            }
            default:
                throw new Error(`Invalid prompt type in config: ${data._type}`);
        }
    }
}
class BaseStringPromptTemplate extends BasePromptTemplate {
    async formatPromptValue(values) {
        const formattedPrompt = await this.format(values);
        return new StringPromptValue(formattedPrompt);
    }
}
/**
 * Base class for example selectors.
 */
class BaseExampleSelector {
}


/***/ }),

/***/ 23379:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PromptTemplate": () => (/* binding */ PromptTemplate)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(55411);
/* harmony import */ var _template_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(30837);


/**
 * Schema to represent a basic prompt for an LLM.
 * @augments BasePromptTemplate
 * @augments PromptTemplateInput
 *
 * @example
 * ```ts
 * import { PromptTemplate } from "langchain/prompts";
 *
 * const prompt = new PromptTemplate({
 *   inputVariables: ["foo"],
 *   template: "Say {foo}",
 * });
 * ```
 */
class PromptTemplate extends _base_js__WEBPACK_IMPORTED_MODULE_1__/* .BaseStringPromptTemplate */ .Al {
    constructor(input) {
        super(input);
        Object.defineProperty(this, "template", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "templateFormat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "f-string"
        });
        Object.defineProperty(this, "validateTemplate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.assign(this, input);
        if (this.validateTemplate) {
            let totalInputVariables = this.inputVariables;
            if (this.partialVariables) {
                totalInputVariables = totalInputVariables.concat(Object.keys(this.partialVariables));
            }
            (0,_template_js__WEBPACK_IMPORTED_MODULE_0__/* .checkValidTemplate */ .af)(this.template, this.templateFormat, totalInputVariables);
        }
    }
    _getPromptType() {
        return "prompt";
    }
    async format(values) {
        const allValues = await this.mergePartialAndUserVariables(values);
        return (0,_template_js__WEBPACK_IMPORTED_MODULE_0__/* .renderTemplate */ .SM)(this.template, this.templateFormat, allValues);
    }
    /**
     * Take examples in list format with prefix and suffix to create a prompt.
     *
     * Intendend to be used a a way to dynamically create a prompt from examples.
     *
     * @param examples - List of examples to use in the prompt.
     * @param suffix - String to go after the list of examples. Should generally set up the user's input.
     * @param inputVariables - A list of variable names the final prompt template will expect
     * @param exampleSeparator - The separator to use in between examples
     * @param prefix - String that should go before any examples. Generally includes examples.
     *
     * @returns The final prompt template generated.
     */
    static fromExamples(examples, suffix, inputVariables, exampleSeparator = "\n\n", prefix = "") {
        const template = [prefix, ...examples, suffix].join(exampleSeparator);
        return new PromptTemplate({
            inputVariables,
            template,
        });
    }
    /**
     * Load prompt template from a template f-string
     */
    static fromTemplate(template, { templateFormat = "f-string", ...rest } = {}) {
        const names = new Set();
        (0,_template_js__WEBPACK_IMPORTED_MODULE_0__/* .parseTemplate */ .$M)(template, templateFormat).forEach((node) => {
            if (node.type === "variable") {
                names.add(node.name);
            }
        });
        return new PromptTemplate({
            inputVariables: [...names],
            templateFormat,
            template,
            ...rest,
        });
    }
    async partial(values) {
        const promptDict = { ...this };
        promptDict.inputVariables = this.inputVariables.filter((iv) => !(iv in values));
        promptDict.partialVariables = {
            ...(this.partialVariables ?? {}),
            ...values,
        };
        return new PromptTemplate(promptDict);
    }
    serialize() {
        if (this.outputParser !== undefined) {
            throw new Error("Cannot serialize a prompt template with an output parser");
        }
        return {
            _type: this._getPromptType(),
            input_variables: this.inputVariables,
            template: this.template,
            template_format: this.templateFormat,
        };
    }
    static async deserialize(data) {
        if (!data.template) {
            throw new Error("Prompt template must have a template");
        }
        const res = new PromptTemplate({
            inputVariables: data.input_variables,
            template: data.template,
            templateFormat: data.template_format,
        });
        return res;
    }
}


/***/ }),

/***/ 30837:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$M": () => (/* binding */ parseTemplate),
/* harmony export */   "SM": () => (/* binding */ renderTemplate),
/* harmony export */   "af": () => (/* binding */ checkValidTemplate)
/* harmony export */ });
/* unused harmony exports parseFString, interpolateFString, DEFAULT_FORMATTER_MAPPING, DEFAULT_PARSER_MAPPING */
const parseFString = (template) => {
    // Core logic replicated from internals of pythons built in Formatter class.
    // https://github.com/python/cpython/blob/135ec7cefbaffd516b77362ad2b2ad1025af462e/Objects/stringlib/unicode_format.h#L700-L706
    const chars = template.split("");
    const nodes = [];
    const nextBracket = (bracket, start) => {
        for (let i = start; i < chars.length; i += 1) {
            if (bracket.includes(chars[i])) {
                return i;
            }
        }
        return -1;
    };
    let i = 0;
    while (i < chars.length) {
        if (chars[i] === "{" && i + 1 < chars.length && chars[i + 1] === "{") {
            nodes.push({ type: "literal", text: "{" });
            i += 2;
        }
        else if (chars[i] === "}" &&
            i + 1 < chars.length &&
            chars[i + 1] === "}") {
            nodes.push({ type: "literal", text: "}" });
            i += 2;
        }
        else if (chars[i] === "{") {
            const j = nextBracket("}", i);
            if (j < 0) {
                throw new Error("Unclosed '{' in template.");
            }
            nodes.push({
                type: "variable",
                name: chars.slice(i + 1, j).join(""),
            });
            i = j + 1;
        }
        else if (chars[i] === "}") {
            throw new Error("Single '}' in template.");
        }
        else {
            const next = nextBracket("{}", i);
            const text = (next < 0 ? chars.slice(i) : chars.slice(i, next)).join("");
            nodes.push({ type: "literal", text });
            i = next < 0 ? chars.length : next;
        }
    }
    return nodes;
};
const interpolateFString = (template, values) => parseFString(template).reduce((res, node) => {
    if (node.type === "variable") {
        if (node.name in values) {
            return res + values[node.name];
        }
        throw new Error(`Missing value for input ${node.name}`);
    }
    return res + node.text;
}, "");
const DEFAULT_FORMATTER_MAPPING = {
    "f-string": interpolateFString,
    jinja2: (_, __) => "",
};
const DEFAULT_PARSER_MAPPING = {
    "f-string": parseFString,
    jinja2: (_) => [],
};
const renderTemplate = (template, templateFormat, inputValues) => DEFAULT_FORMATTER_MAPPING[templateFormat](template, inputValues);
const parseTemplate = (template, templateFormat) => DEFAULT_PARSER_MAPPING[templateFormat](template);
const checkValidTemplate = (template, templateFormat, inputVariables) => {
    if (!(templateFormat in DEFAULT_FORMATTER_MAPPING)) {
        const validFormats = Object.keys(DEFAULT_FORMATTER_MAPPING);
        throw new Error(`Invalid template format. Got \`${templateFormat}\`;
                         should be one of ${validFormats}`);
    }
    try {
        const dummyInputs = inputVariables.reduce((acc, v) => {
            acc[v] = "foo";
            return acc;
        }, {});
        renderTemplate(template, templateFormat, dummyInputs);
    }
    catch {
        throw new Error("Invalid prompt schema.");
    }
};


/***/ })

};
;