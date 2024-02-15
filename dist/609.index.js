"use strict";
exports.id = 609;
exports.ids = [609,379];
exports.modules = {

/***/ 10609:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FewShotPromptTemplate": () => (/* binding */ FewShotPromptTemplate)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(55411);
/* harmony import */ var _template_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(30837);
/* harmony import */ var _prompt_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23379);



/**
 * Prompt template that contains few-shot examples.
 * @augments BasePromptTemplate
 * @augments FewShotPromptTemplateInput
 */
class FewShotPromptTemplate extends _base_js__WEBPACK_IMPORTED_MODULE_2__/* .BaseStringPromptTemplate */ .Al {
    constructor(input) {
        super(input);
        Object.defineProperty(this, "examples", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "exampleSelector", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "examplePrompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "suffix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
        });
        Object.defineProperty(this, "exampleSeparator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "\n\n"
        });
        Object.defineProperty(this, "prefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ""
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
        if (this.examples !== undefined && this.exampleSelector !== undefined) {
            throw new Error("Only one of 'examples' and 'example_selector' should be provided");
        }
        if (this.examples === undefined && this.exampleSelector === undefined) {
            throw new Error("One of 'examples' and 'example_selector' should be provided");
        }
        if (this.validateTemplate) {
            let totalInputVariables = this.inputVariables;
            if (this.partialVariables) {
                totalInputVariables = totalInputVariables.concat(Object.keys(this.partialVariables));
            }
            (0,_template_js__WEBPACK_IMPORTED_MODULE_0__/* .checkValidTemplate */ .af)(this.prefix + this.suffix, this.templateFormat, totalInputVariables);
        }
    }
    _getPromptType() {
        return "few_shot";
    }
    async getExamples(inputVariables) {
        if (this.examples !== undefined) {
            return this.examples;
        }
        if (this.exampleSelector !== undefined) {
            return this.exampleSelector.selectExamples(inputVariables);
        }
        throw new Error("One of 'examples' and 'example_selector' should be provided");
    }
    async partial(values) {
        const promptDict = { ...this };
        promptDict.inputVariables = this.inputVariables.filter((iv) => !(iv in values));
        promptDict.partialVariables = {
            ...(this.partialVariables ?? {}),
            ...values,
        };
        return new FewShotPromptTemplate(promptDict);
    }
    async format(values) {
        const allValues = await this.mergePartialAndUserVariables(values);
        const examples = await this.getExamples(allValues);
        const exampleStrings = await Promise.all(examples.map((example) => this.examplePrompt.format(example)));
        const template = [this.prefix, ...exampleStrings, this.suffix].join(this.exampleSeparator);
        return (0,_template_js__WEBPACK_IMPORTED_MODULE_0__/* .renderTemplate */ .SM)(template, this.templateFormat, allValues);
    }
    serialize() {
        if (this.exampleSelector || !this.examples) {
            throw new Error("Serializing an example selector is not currently supported");
        }
        if (this.outputParser !== undefined) {
            throw new Error("Serializing an output parser is not currently supported");
        }
        return {
            _type: this._getPromptType(),
            input_variables: this.inputVariables,
            example_prompt: this.examplePrompt.serialize(),
            example_separator: this.exampleSeparator,
            suffix: this.suffix,
            prefix: this.prefix,
            template_format: this.templateFormat,
            examples: this.examples,
        };
    }
    static async deserialize(data) {
        const { example_prompt } = data;
        if (!example_prompt) {
            throw new Error("Missing example prompt");
        }
        const examplePrompt = await _prompt_js__WEBPACK_IMPORTED_MODULE_1__.PromptTemplate.deserialize(example_prompt);
        let examples;
        if (Array.isArray(data.examples)) {
            examples = data.examples;
        }
        else {
            throw new Error("Invalid examples format. Only list or string are supported.");
        }
        return new FewShotPromptTemplate({
            inputVariables: data.input_variables,
            examplePrompt,
            examples,
            exampleSeparator: data.example_separator,
            prefix: data.prefix,
            suffix: data.suffix,
            templateFormat: data.template_format,
        });
    }
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