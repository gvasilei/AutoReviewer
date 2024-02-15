"use strict";
exports.id = 197;
exports.ids = [197];
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


/***/ })

};
;