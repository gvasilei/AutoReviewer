"use strict";
exports.id = 726;
exports.ids = [726];
exports.modules = {

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


/***/ })

};
;