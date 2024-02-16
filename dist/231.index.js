"use strict";
exports.id = 231;
exports.ids = [231,197,210];
exports.modules = {

/***/ 73197:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "l": () => (/* binding */ BaseChain)
/* harmony export */ });
/* harmony import */ var _schema_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(78102);
/* harmony import */ var _callbacks_manager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34908);
/* harmony import */ var _base_language_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(57396);



/**
 * Base interface that all chains must implement.
 */
class BaseChain extends _base_language_index_js__WEBPACK_IMPORTED_MODULE_1__/* .BaseLangChain */ .B {
    constructor(fields, 
    /** @deprecated */
    verbose, 
    /** @deprecated */
    callbacks) {
        if (arguments.length === 1 &&
            typeof fields === "object" &&
            !("saveContext" in fields)) {
            // fields is not a BaseMemory
            const { memory, callbackManager, ...rest } = fields;
            super({ ...rest, callbacks: callbackManager ?? rest.callbacks });
            this.memory = memory;
        }
        else {
            // fields is a BaseMemory
            super({ verbose, callbacks });
            this.memory = fields;
        }
    }
    /**
     * Return a json-like object representing this chain.
     */
    serialize() {
        throw new Error("Method not implemented.");
    }
    async run(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input, callbacks) {
        const isKeylessInput = this.inputKeys.length <= 1;
        if (!isKeylessInput) {
            throw new Error(`Chain ${this._chainType()} expects multiple inputs, cannot use 'run' `);
        }
        const values = this.inputKeys.length ? { [this.inputKeys[0]]: input } : {};
        const returnValues = await this.call(values, callbacks);
        const keys = Object.keys(returnValues);
        if (keys.length === 1) {
            return returnValues[keys[0]];
        }
        throw new Error("return values have multiple keys, `run` only supported when one key currently");
    }
    /**
     * Run the core logic of this chain and add to output if desired.
     *
     * Wraps _call and handles memory.
     */
    async call(values, callbacks) {
        const fullValues = { ...values };
        if (!(this.memory == null)) {
            const newValues = await this.memory.loadMemoryVariables(values);
            for (const [key, value] of Object.entries(newValues)) {
                fullValues[key] = value;
            }
        }
        const callbackManager_ = await _callbacks_manager_js__WEBPACK_IMPORTED_MODULE_0__/* .CallbackManager.configure */ .Ye.configure(callbacks, this.callbacks, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleChainStart({ name: this._chainType() }, fullValues);
        let outputValues;
        try {
            outputValues = await this._call(fullValues, runManager);
        }
        catch (e) {
            await runManager?.handleChainError(e);
            throw e;
        }
        if (!(this.memory == null)) {
            await this.memory.saveContext(values, outputValues);
        }
        await runManager?.handleChainEnd(outputValues);
        // add the runManager's currentRunId to the outputValues
        Object.defineProperty(outputValues, _schema_index_js__WEBPACK_IMPORTED_MODULE_2__/* .RUN_KEY */ .WH, {
            value: runManager ? { runId: runManager?.runId } : undefined,
            configurable: true,
        });
        return outputValues;
    }
    /**
     * Call the chain on all inputs in the list
     */
    async apply(inputs, callbacks) {
        return Promise.all(inputs.map(async (i, idx) => this.call(i, callbacks?.[idx])));
    }
    /**
     * Load a chain from a json-like object describing it.
     */
    static async deserialize(data, values = {}) {
        switch (data._type) {
            case "llm_chain": {
                const { LLMChain } = await __webpack_require__.e(/* import() */ 726).then(__webpack_require__.bind(__webpack_require__, 56726));
                return LLMChain.deserialize(data);
            }
            case "sequential_chain": {
                const { SequentialChain } = await __webpack_require__.e(/* import() */ 210).then(__webpack_require__.bind(__webpack_require__, 97210));
                return SequentialChain.deserialize(data);
            }
            case "simple_sequential_chain": {
                const { SimpleSequentialChain } = await __webpack_require__.e(/* import() */ 210).then(__webpack_require__.bind(__webpack_require__, 97210));
                return SimpleSequentialChain.deserialize(data);
            }
            case "stuff_documents_chain": {
                const { StuffDocumentsChain } = await __webpack_require__.e(/* import() */ 608).then(__webpack_require__.bind(__webpack_require__, 63608));
                return StuffDocumentsChain.deserialize(data);
            }
            case "map_reduce_documents_chain": {
                const { MapReduceDocumentsChain } = await __webpack_require__.e(/* import() */ 608).then(__webpack_require__.bind(__webpack_require__, 63608));
                return MapReduceDocumentsChain.deserialize(data);
            }
            case "refine_documents_chain": {
                const { RefineDocumentsChain } = await __webpack_require__.e(/* import() */ 608).then(__webpack_require__.bind(__webpack_require__, 63608));
                return RefineDocumentsChain.deserialize(data);
            }
            case "vector_db_qa": {
                const { VectorDBQAChain } = await Promise.all(/* import() */[__webpack_require__.e(608), __webpack_require__.e(341)]).then(__webpack_require__.bind(__webpack_require__, 38341));
                return VectorDBQAChain.deserialize(data, values);
            }
            default:
                throw new Error(`Invalid prompt type in config: ${data._type}`);
        }
    }
}


/***/ }),

/***/ 97210:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "SequentialChain": () => (/* binding */ SequentialChain),
  "SimpleSequentialChain": () => (/* binding */ SimpleSequentialChain)
});

// EXTERNAL MODULE: ./node_modules/langchain/dist/chains/base.js
var base = __webpack_require__(73197);
;// CONCATENATED MODULE: ./node_modules/langchain/dist/util/set.js
/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
 */
/**
 * returns intersection of two sets
 */
function intersection(setA, setB) {
    const _intersection = new Set();
    for (const elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}
/**
 * returns union of two sets
 */
function union(setA, setB) {
    const _union = new Set(setA);
    for (const elem of setB) {
        _union.add(elem);
    }
    return _union;
}
/**
 * returns difference of two sets
 */
function difference(setA, setB) {
    const _difference = new Set(setA);
    for (const elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/chains/sequential_chain.js


function formatSet(input) {
    return Array.from(input)
        .map((i) => `"${i}"`)
        .join(", ");
}
/**
 * Chain where the outputs of one chain feed directly into next.
 */
class SequentialChain extends base/* BaseChain */.l {
    get inputKeys() {
        return this.inputVariables;
    }
    get outputKeys() {
        return this.outputVariables;
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "chains", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputVariables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "outputVariables", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "returnAll", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.chains = fields.chains;
        this.inputVariables = fields.inputVariables;
        this.outputVariables = fields.outputVariables ?? [];
        if (this.outputVariables.length > 0 && fields.returnAll) {
            throw new Error("Either specify variables to return using `outputVariables` or use `returnAll` param. Cannot apply both conditions at the same time.");
        }
        this.returnAll = fields.returnAll ?? false;
        this._validateChains();
    }
    /** @ignore */
    _validateChains() {
        if (this.chains.length === 0) {
            throw new Error("Sequential chain must have at least one chain.");
        }
        const memoryKeys = this.memory?.memoryKeys ?? [];
        const inputKeysSet = new Set(this.inputKeys);
        const memoryKeysSet = new Set(memoryKeys);
        const keysIntersection = intersection(inputKeysSet, memoryKeysSet);
        if (keysIntersection.size > 0) {
            throw new Error(`The following keys: ${formatSet(keysIntersection)} are overlapping between memory and input keys of the chain variables. This can lead to unexpected behaviour. Please use input and memory keys that don't overlap.`);
        }
        const availableKeys = union(inputKeysSet, memoryKeysSet);
        for (const chain of this.chains) {
            const missingKeys = difference(new Set(chain.inputKeys), availableKeys);
            if (missingKeys.size > 0) {
                throw new Error(`Missing variables for chain "${chain._chainType()}": ${formatSet(missingKeys)}. Only got the following variables: ${formatSet(availableKeys)}.`);
            }
            const outputKeysSet = new Set(chain.outputKeys);
            const overlappinOutputKeys = intersection(availableKeys, outputKeysSet);
            if (overlappinOutputKeys.size > 0) {
                throw new Error(`The following output variables for chain "${chain._chainType()}" are overlapping: ${formatSet(overlappinOutputKeys)}. This can lead to unexpected behaviour.`);
            }
            for (const outputKey of outputKeysSet) {
                availableKeys.add(outputKey);
            }
        }
        if (this.outputVariables.length === 0) {
            if (this.returnAll) {
                const outputKeys = difference(availableKeys, inputKeysSet);
                this.outputVariables = Array.from(outputKeys);
            }
            else {
                this.outputVariables = this.chains[this.chains.length - 1].outputKeys;
            }
        }
        else {
            const missingKeys = difference(new Set(this.outputVariables), new Set(availableKeys));
            if (missingKeys.size > 0) {
                throw new Error(`The following output variables were expected to be in the final chain output but were not found: ${formatSet(missingKeys)}.`);
            }
        }
    }
    /** @ignore */
    async _call(values, runManager) {
        let input = values;
        const allChainValues = {};
        for (const chain of this.chains) {
            input = await chain.call(input, runManager?.getChild());
            for (const key of Object.keys(input)) {
                allChainValues[key] = input[key];
            }
        }
        const output = {};
        for (const key of this.outputVariables) {
            output[key] = allChainValues[key];
        }
        return output;
    }
    _chainType() {
        return "sequential_chain";
    }
    static async deserialize(data) {
        const chains = [];
        const inputVariables = data.input_variables;
        const outputVariables = data.output_variables;
        const serializedChains = data.chains;
        for (const serializedChain of serializedChains) {
            const deserializedChain = await base/* BaseChain.deserialize */.l.deserialize(serializedChain);
            chains.push(deserializedChain);
        }
        return new SequentialChain({ chains, inputVariables, outputVariables });
    }
    serialize() {
        const chains = [];
        for (const chain of this.chains) {
            chains.push(chain.serialize());
        }
        return {
            _type: this._chainType(),
            input_variables: this.inputVariables,
            output_variables: this.outputVariables,
            chains,
        };
    }
}
/**
 * Simple chain where a single string output of one chain is fed directly into the next.
 * @augments BaseChain
 * @augments SimpleSequentialChainInput
 *
 * @example
 * ```ts
 * import { SimpleSequentialChain, LLMChain } from "langchain/chains";
 * import { OpenAI } from "langchain/llms/openai";
 * import { PromptTemplate } from "langchain/prompts";
 *
 * // This is an LLMChain to write a synopsis given a title of a play.
 * const llm = new OpenAI({ temperature: 0 });
 * const template = `You are a playwright. Given the title of play, it is your job to write a synopsis for that title.
 *
 * Title: {title}
 * Playwright: This is a synopsis for the above play:`
 * const promptTemplate = new PromptTemplate({ template, inputVariables: ["title"] });
 * const synopsisChain = new LLMChain({ llm, prompt: promptTemplate });
 *
 *
 * // This is an LLMChain to write a review of a play given a synopsis.
 * const reviewLLM = new OpenAI({ temperature: 0 })
 * const reviewTemplate = `You are a play critic from the New York Times. Given the synopsis of play, it is your job to write a review for that play.
 *
 * Play Synopsis:
 * {synopsis}
 * Review from a New York Times play critic of the above play:`
 * const reviewPromptTempalte = new PromptTemplate({ template: reviewTemplate, inputVariables: ["synopsis"] });
 * const reviewChain = new LLMChain({ llm: reviewLLM, prompt: reviewPromptTempalte });
 *
 * const overallChain = new SimpleSequentialChain({chains: [synopsisChain, reviewChain], verbose:true})
 * const review = await overallChain.run("Tragedy at sunset on the beach")
 * // the variable review contains resulting play review.
 * ```
 */
class SimpleSequentialChain extends base/* BaseChain */.l {
    get inputKeys() {
        return [this.inputKey];
    }
    get outputKeys() {
        return [this.outputKey];
    }
    constructor(fields) {
        super(fields.memory, fields.verbose, fields.callbacks ?? fields.callbackManager);
        Object.defineProperty(this, "chains", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "input"
        });
        Object.defineProperty(this, "outputKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "output"
        });
        Object.defineProperty(this, "trimOutputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.chains = fields.chains;
        this.trimOutputs = fields.trimOutputs ?? false;
        this._validateChains();
    }
    /** @ignore */
    _validateChains() {
        for (const chain of this.chains) {
            if (chain.inputKeys.length !== 1) {
                throw new Error(`Chains used in SimpleSequentialChain should all have one input, got ${chain.inputKeys.length} for ${chain._chainType()}.`);
            }
            if (chain.outputKeys.length !== 1) {
                throw new Error(`Chains used in SimpleSequentialChain should all have one output, got ${chain.outputKeys.length} for ${chain._chainType()}.`);
            }
        }
    }
    /** @ignore */
    async _call(values, runManager) {
        let input = values[this.inputKey];
        for (const chain of this.chains) {
            input = await chain.run(input, runManager?.getChild());
            if (this.trimOutputs) {
                input = input.trim();
            }
            await runManager?.handleText(input);
        }
        return { [this.outputKey]: input };
    }
    _chainType() {
        return "simple_sequential_chain";
    }
    static async deserialize(data) {
        const chains = [];
        const serializedChains = data.chains;
        for (const serializedChain of serializedChains) {
            const deserializedChain = await base/* BaseChain.deserialize */.l.deserialize(serializedChain);
            chains.push(deserializedChain);
        }
        return new SimpleSequentialChain({ chains });
    }
    serialize() {
        const chains = [];
        for (const chain of this.chains) {
            chains.push(chain.serialize());
        }
        return {
            _type: this._chainType(),
            chains,
        };
    }
}


/***/ })

};
;