"use strict";
exports.id = 216;
exports.ids = [216];
exports.modules = {

/***/ 8393:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "_i": () => (/* binding */ getModelNameForTiktoken),
/* harmony export */   "e9": () => (/* binding */ importTiktoken)
/* harmony export */ });
/* unused harmony exports getEmbeddingContextSize, getModelContextSize, calculateMaxTokens */
// https://www.npmjs.com/package/@dqbd/tiktoken
const getModelNameForTiktoken = (modelName) => {
    if (modelName.startsWith("gpt-3.5-turbo-")) {
        return "gpt-3.5-turbo";
    }
    if (modelName.startsWith("gpt-4-32k-")) {
        return "gpt-4-32k";
    }
    if (modelName.startsWith("gpt-4-")) {
        return "gpt-4";
    }
    return modelName;
};
const getEmbeddingContextSize = (modelName) => {
    switch (modelName) {
        case "text-embedding-ada-002":
            return 8191;
        default:
            return 2046;
    }
};
const getModelContextSize = (modelName) => {
    switch (getModelNameForTiktoken(modelName)) {
        case "gpt-3.5-turbo":
            return 4096;
        case "gpt-4-32k":
            return 32768;
        case "gpt-4":
            return 8192;
        case "text-davinci-003":
            return 4097;
        case "text-curie-001":
            return 2048;
        case "text-babbage-001":
            return 2048;
        case "text-ada-001":
            return 2048;
        case "code-davinci-002":
            return 8000;
        case "code-cushman-001":
            return 2048;
        default:
            return 4097;
    }
};
const importTiktoken = async () => {
    try {
        const { encoding_for_model } = await __webpack_require__.e(/* import() */ 171).then(__webpack_require__.t.bind(__webpack_require__, 3171, 19));
        return { encoding_for_model };
    }
    catch (error) {
        console.log(error);
        return { encoding_for_model: null };
    }
};
const calculateMaxTokens = async ({ prompt, modelName, }) => {
    const { encoding_for_model } = await importTiktoken();
    // fallback to approximate calculation if tiktoken is not available
    let numTokens = Math.ceil(prompt.length / 4);
    try {
        if (encoding_for_model) {
            const encoding = encoding_for_model(getModelNameForTiktoken(modelName));
            const tokenized = encoding.encode(prompt);
            numTokens = tokenized.length;
            encoding.free();
        }
    }
    catch (error) {
        console.warn("Failed to calculate number of tokens with tiktoken, falling back to approximate count", error);
    }
    const maxTokens = getModelContextSize(modelName);
    return maxTokens - numTokens;
};


/***/ }),

/***/ 7396:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "B": () => (/* binding */ BaseLangChain),
  "q": () => (/* binding */ BaseLanguageModel)
});

// EXTERNAL MODULE: ./node_modules/p-retry/index.js
var p_retry = __webpack_require__(2548);
// EXTERNAL MODULE: ./node_modules/p-queue/dist/index.js
var dist = __webpack_require__(8983);
;// CONCATENATED MODULE: ./node_modules/langchain/dist/util/async_caller.js


const STATUS_NO_RETRY = [
    400,
    401,
    403,
    404,
    405,
    406,
    407,
    408,
    409, // Conflict
];
/**
 * A class that can be used to make async calls with concurrency and retry logic.
 *
 * This is useful for making calls to any kind of "expensive" external resource,
 * be it because it's rate-limited, subject to network issues, etc.
 *
 * Concurrent calls are limited by the `maxConcurrency` parameter, which defaults
 * to `Infinity`. This means that by default, all calls will be made in parallel.
 *
 * Retries are limited by the `maxRetries` parameter, which defaults to 6. This
 * means that by default, each call will be retried up to 6 times, with an
 * exponential backoff between each attempt.
 */
class AsyncCaller {
    constructor(params) {
        Object.defineProperty(this, "maxConcurrency", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxRetries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "queue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.maxConcurrency = params.maxConcurrency ?? Infinity;
        this.maxRetries = params.maxRetries ?? 6;
        const PQueue =  true ? dist["default"] : dist;
        this.queue = new PQueue({ concurrency: this.maxConcurrency });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call(callable, ...args) {
        return this.queue.add(() => p_retry(() => callable(...args).catch((error) => {
            // eslint-disable-next-line no-instanceof/no-instanceof
            if (error instanceof Error) {
                throw error;
            }
            else {
                throw new Error(error);
            }
        }), {
            onFailedAttempt(error) {
                if (error.message.startsWith("Cancel") ||
                    error.message.startsWith("TimeoutError") ||
                    error.message.startsWith("AbortError")) {
                    throw error;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (error?.code === "ECONNABORTED") {
                    throw error;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const status = error?.response?.status;
                if (status && STATUS_NO_RETRY.includes(+status)) {
                    throw error;
                }
            },
            retries: this.maxRetries,
            randomize: true,
            // If needed we can change some of the defaults here,
            // but they're quite sensible.
        }), { throwOnTimeout: true });
    }
    fetch(...args) {
        return this.call(() => fetch(...args).then((res) => (res.ok ? res : Promise.reject(res))));
    }
}

// EXTERNAL MODULE: ./node_modules/langchain/dist/base_language/count_tokens.js
var count_tokens = __webpack_require__(8393);
;// CONCATENATED MODULE: ./node_modules/langchain/dist/base_language/index.js


const getVerbosity = () => false;
/**
 * Base class for language models, chains, tools.
 */
class BaseLangChain {
    constructor(params) {
        /**
         * Whether to print out response text.
         */
        Object.defineProperty(this, "verbose", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "callbacks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.verbose = params.verbose ?? getVerbosity();
        this.callbacks = params.callbacks;
    }
}
/**
 * Base class for language models.
 */
class BaseLanguageModel extends BaseLangChain {
    constructor(params) {
        super({
            verbose: params.verbose,
            callbacks: params.callbacks ?? params.callbackManager,
        });
        /**
         * The async caller should be used by subclasses to make any async calls,
         * which will thus benefit from the concurrency and retry logic.
         */
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_encoding", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_registry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.caller = new AsyncCaller(params ?? {});
    }
    async getNumTokens(text) {
        // fallback to approximate calculation if tiktoken is not available
        let numTokens = Math.ceil(text.length / 4);
        try {
            if (!this._encoding) {
                const { encoding_for_model } = await (0,count_tokens/* importTiktoken */.e9)();
                // modelName only exists in openai subclasses, but tiktoken only supports
                // openai tokenisers anyway, so for other subclasses we default to gpt2
                if (encoding_for_model) {
                    this._encoding = encoding_for_model("modelName" in this
                        ? (0,count_tokens/* getModelNameForTiktoken */._i)(this.modelName)
                        : "gpt2");
                    // We need to register a finalizer to free the tokenizer when the
                    // model is garbage collected.
                    this._registry = new FinalizationRegistry((t) => t.free());
                    this._registry.register(this, this._encoding);
                }
            }
            if (this._encoding) {
                numTokens = this._encoding.encode(text).length;
            }
        }
        catch (error) {
            console.warn("Failed to calculate number of tokens with tiktoken, falling back to approximate count", error);
        }
        return numTokens;
    }
    /**
     * Get the identifying parameters of the LLM.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _identifyingParams() {
        return {};
    }
    /**
     * Return a json-like object representing this LLM.
     */
    serialize() {
        return {
            ...this._identifyingParams(),
            _type: this._llmType(),
            _model: this._modelType(),
        };
    }
    /**
     * Load an LLM from a json-like object describing it.
     */
    static async deserialize(data) {
        const { _type, _model, ...rest } = data;
        if (_model && _model !== "base_chat_model") {
            throw new Error(`Cannot load LLM with model ${_model}`);
        }
        const Cls = {
            openai: (await __webpack_require__.e(/* import() */ 30).then(__webpack_require__.bind(__webpack_require__, 7030))).ChatOpenAI,
        }[_type];
        if (Cls === undefined) {
            throw new Error(`Cannot load  LLM with type ${_type}`);
        }
        return new Cls(rest);
    }
}


/***/ }),

/***/ 4855:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Ye": () => (/* binding */ CallbackManager)
});

// UNUSED EXPORTS: BaseCallbackManager, CallbackManagerForChainRun, CallbackManagerForLLMRun, CallbackManagerForToolRun

// EXTERNAL MODULE: ./node_modules/langchain/node_modules/uuid/dist/index.js
var dist = __webpack_require__(8655);
;// CONCATENATED MODULE: ./node_modules/langchain/node_modules/uuid/wrapper.mjs

const v1 = dist.v1;
const v3 = dist.v3;
const v4 = dist.v4;
const v5 = dist.v5;
const NIL = dist.NIL;
const version = dist.version;
const validate = dist.validate;
const stringify = dist.stringify;
const parse = dist.parse;

;// CONCATENATED MODULE: ./node_modules/langchain/dist/callbacks/base.js

class BaseCallbackHandlerMethodsClass {
}
class BaseCallbackHandler extends BaseCallbackHandlerMethodsClass {
    constructor(input) {
        super();
        Object.defineProperty(this, "ignoreLLM", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "ignoreChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "ignoreAgent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        if (input) {
            this.ignoreLLM = input.ignoreLLM ?? this.ignoreLLM;
            this.ignoreChain = input.ignoreChain ?? this.ignoreChain;
            this.ignoreAgent = input.ignoreAgent ?? this.ignoreAgent;
        }
    }
    copy() {
        return new this.constructor(this);
    }
    static fromMethods(methods) {
        class Handler extends BaseCallbackHandler {
            constructor() {
                super();
                Object.defineProperty(this, "name", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: v4()
                });
                Object.assign(this, methods);
            }
        }
        return new Handler();
    }
}

// EXTERNAL MODULE: ./node_modules/langchain/node_modules/ansi-styles/index.js
var ansi_styles = __webpack_require__(8964);
;// CONCATENATED MODULE: ./node_modules/langchain/dist/callbacks/handlers/tracers.js

class BaseTracer extends BaseCallbackHandler {
    constructor() {
        super();
        Object.defineProperty(this, "session", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "runMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    copy() {
        return this;
    }
    async newSession(sessionName) {
        const sessionCreate = {
            start_time: Date.now(),
            name: sessionName,
        };
        const session = await this.persistSession(sessionCreate);
        this.session = session;
        return session;
    }
    _addChildRun(parentRun, childRun) {
        if (childRun.type === "llm") {
            parentRun.child_llm_runs.push(childRun);
        }
        else if (childRun.type === "chain") {
            parentRun.child_chain_runs.push(childRun);
        }
        else if (childRun.type === "tool") {
            parentRun.child_tool_runs.push(childRun);
        }
        else {
            throw new Error("Invalid run type");
        }
    }
    _startTrace(run) {
        if (run.parent_uuid) {
            const parentRun = this.runMap.get(run.parent_uuid);
            if (parentRun) {
                if (!(parentRun.type === "tool" || parentRun.type === "chain")) {
                    throw new Error("Caller run can only be a tool or chain");
                }
                else {
                    this._addChildRun(parentRun, run);
                }
            }
            else {
                throw new Error(`Caller run ${run.parent_uuid} not found`);
            }
        }
        this.runMap.set(run.uuid, run);
    }
    async _endTrace(run) {
        if (!run.parent_uuid) {
            await this.persistRun(run);
        }
        else {
            const parentRun = this.runMap.get(run.parent_uuid);
            if (parentRun === undefined) {
                throw new Error(`Parent run ${run.parent_uuid} not found`);
            }
            parentRun.child_execution_order = Math.max(parentRun.child_execution_order, run.child_execution_order);
        }
        this.runMap.delete(run.uuid);
    }
    _getExecutionOrder(parentRunId) {
        // If a run has no parent then execution order is 1
        if (parentRunId === undefined) {
            return 1;
        }
        const parentRun = this.runMap.get(parentRunId);
        if (parentRun === undefined) {
            throw new Error(`Parent run ${parentRunId} not found`);
        }
        return parentRun.child_execution_order + 1;
    }
    async handleLLMStart(llm, prompts, runId, parentRunId) {
        if (this.session === undefined) {
            this.session = await this.loadDefaultSession();
        }
        const execution_order = this._getExecutionOrder(parentRunId);
        const run = {
            uuid: runId,
            parent_uuid: parentRunId,
            start_time: Date.now(),
            end_time: 0,
            serialized: llm,
            prompts,
            session_id: this.session.id,
            execution_order,
            child_execution_order: execution_order,
            type: "llm",
        };
        this._startTrace(run);
        await this.onLLMStart?.(run);
    }
    async handleLLMEnd(output, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "llm") {
            throw new Error("No LLM run to end.");
        }
        const llmRun = run;
        llmRun.end_time = Date.now();
        llmRun.response = output;
        await this.onLLMEnd?.(llmRun);
        await this._endTrace(llmRun);
    }
    async handleLLMError(error, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "llm") {
            throw new Error("No LLM run to end.");
        }
        const llmRun = run;
        llmRun.end_time = Date.now();
        llmRun.error = error.message;
        await this.onLLMError?.(llmRun);
        await this._endTrace(llmRun);
    }
    async handleChainStart(chain, inputs, runId, parentRunId) {
        if (this.session === undefined) {
            this.session = await this.loadDefaultSession();
        }
        const execution_order = this._getExecutionOrder(parentRunId);
        const run = {
            uuid: runId,
            parent_uuid: parentRunId,
            start_time: Date.now(),
            end_time: 0,
            serialized: chain,
            inputs,
            session_id: this.session.id,
            execution_order,
            child_execution_order: execution_order,
            type: "chain",
            child_llm_runs: [],
            child_chain_runs: [],
            child_tool_runs: [],
        };
        this._startTrace(run);
        await this.onChainStart?.(run);
    }
    async handleChainEnd(outputs, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "chain") {
            throw new Error("No chain run to end.");
        }
        const chainRun = run;
        chainRun.end_time = Date.now();
        chainRun.outputs = outputs;
        await this.onChainEnd?.(chainRun);
        await this._endTrace(chainRun);
    }
    async handleChainError(error, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "chain") {
            throw new Error("No chain run to end.");
        }
        const chainRun = run;
        chainRun.end_time = Date.now();
        chainRun.error = error.message;
        await this.onChainError?.(chainRun);
        await this._endTrace(chainRun);
    }
    async handleToolStart(tool, input, runId, parentRunId) {
        if (this.session === undefined) {
            this.session = await this.loadDefaultSession();
        }
        const execution_order = this._getExecutionOrder(parentRunId);
        const run = {
            uuid: runId,
            parent_uuid: parentRunId,
            start_time: Date.now(),
            end_time: 0,
            serialized: tool,
            tool_input: input,
            session_id: this.session.id,
            execution_order,
            child_execution_order: execution_order,
            type: "tool",
            action: JSON.stringify(tool),
            child_llm_runs: [],
            child_chain_runs: [],
            child_tool_runs: [],
        };
        this._startTrace(run);
        await this.onToolStart?.(run);
    }
    async handleToolEnd(output, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "tool") {
            throw new Error("No tool run to end");
        }
        const toolRun = run;
        toolRun.end_time = Date.now();
        toolRun.output = output;
        await this.onToolEnd?.(toolRun);
        await this._endTrace(toolRun);
    }
    async handleToolError(error, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "tool") {
            throw new Error("No tool run to end");
        }
        const toolRun = run;
        toolRun.end_time = Date.now();
        toolRun.error = error.message;
        await this.onToolError?.(toolRun);
        await this._endTrace(toolRun);
    }
    async handleAgentAction(action, runId) {
        const run = this.runMap.get(runId);
        if (!run || run?.type !== "chain") {
            return;
        }
        const agentRun = run;
        agentRun.actions = agentRun.actions || [];
        agentRun.actions.push(action);
        await this.onAgentAction?.(run);
    }
}
class LangChainTracer extends BaseTracer {
    constructor() {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "langchain_tracer"
        });
        Object.defineProperty(this, "endpoint", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.LANGCHAIN_ENDPOINT
                : undefined) || "http://localhost:8000"
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                "Content-Type": "application/json",
            }
        });
        // eslint-disable-next-line no-process-env
        if (typeof process !== "undefined" && process.env?.LANGCHAIN_API_KEY) {
            // eslint-disable-next-line no-process-env
            this.headers["x-api-key"] = process.env?.LANGCHAIN_API_KEY;
        }
    }
    async persistRun(run) {
        let endpoint;
        if (run.type === "llm") {
            endpoint = `${this.endpoint}/llm-runs`;
        }
        else if (run.type === "chain") {
            endpoint = `${this.endpoint}/chain-runs`;
        }
        else {
            endpoint = `${this.endpoint}/tool-runs`;
        }
        const response = await fetch(endpoint, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(run),
        });
        if (!response.ok) {
            console.error(`Failed to persist run: ${response.status} ${response.statusText}`);
        }
    }
    async persistSession(sessionCreate) {
        const endpoint = `${this.endpoint}/sessions`;
        const response = await fetch(endpoint, {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify(sessionCreate),
        });
        if (!response.ok) {
            console.error(`Failed to persist session: ${response.status} ${response.statusText}, using default session.`);
            return {
                id: 1,
                ...sessionCreate,
            };
        }
        return {
            id: (await response.json()).id,
            ...sessionCreate,
        };
    }
    async loadSession(sessionName) {
        const endpoint = `${this.endpoint}/sessions?name=${sessionName}`;
        return this._handleSessionResponse(endpoint);
    }
    async loadDefaultSession() {
        const endpoint = `${this.endpoint}/sessions?name=default`;
        return this._handleSessionResponse(endpoint);
    }
    async _handleSessionResponse(endpoint) {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: this.headers,
        });
        let tracerSession;
        if (!response.ok) {
            console.error(`Failed to load session: ${response.status} ${response.statusText}`);
            tracerSession = {
                id: 1,
                start_time: Date.now(),
            };
            this.session = tracerSession;
            return tracerSession;
        }
        const resp = (await response.json());
        if (resp.length === 0) {
            tracerSession = {
                id: 1,
                start_time: Date.now(),
            };
            this.session = tracerSession;
            return tracerSession;
        }
        [tracerSession] = resp;
        this.session = tracerSession;
        return tracerSession;
    }
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/callbacks/handlers/console.js


function wrap(style, text) {
    return `${style.open}${text}${style.close}`;
}
function tryJsonStringify(obj, fallback) {
    try {
        return JSON.stringify(obj, null, 2);
    }
    catch (err) {
        return fallback;
    }
}
function elapsed(run) {
    const elapsed = run.end_time - run.start_time;
    if (elapsed < 1000) {
        return `${elapsed}ms`;
    }
    return `${(elapsed / 1000).toFixed(2)}s`;
}
const { color } = ansi_styles;
class ConsoleCallbackHandler extends BaseTracer {
    // boilerplate to work with the base tracer class
    constructor() {
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "console_callback_handler"
        });
        Object.defineProperty(this, "i", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    persistSession(session) {
        // eslint-disable-next-line no-plusplus
        return Promise.resolve({ ...session, id: this.i++ });
    }
    persistRun(_run) {
        return Promise.resolve();
    }
    loadDefaultSession() {
        return this.newSession();
    }
    loadSession(sessionName) {
        return this.newSession(sessionName);
    }
    // utility methods
    getParents(run) {
        const parents = [];
        let currentRun = run;
        while (currentRun.parent_uuid) {
            const parent = this.runMap.get(currentRun.parent_uuid);
            if (parent) {
                parents.push(parent);
                currentRun = parent;
            }
            else {
                break;
            }
        }
        return parents;
    }
    getBreadcrumbs(run) {
        const parents = this.getParents(run).reverse();
        const string = [...parents, run]
            .map((parent, i, arr) => {
            const name = `${parent.execution_order}:${parent.type}:${parent.serialized?.name}`;
            return i === arr.length - 1 ? wrap(ansi_styles.bold, name) : name;
        })
            .join(" > ");
        return wrap(color.grey, string);
    }
    // logging methods
    onChainStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.green, "[chain/start]")} [${crumbs}] Entering Chain run with input: ${tryJsonStringify(run.inputs, "[inputs]")}`);
    }
    onChainEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.cyan, "[chain/end]")} [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${tryJsonStringify(run.outputs, "[outputs]")}`);
    }
    onChainError(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.red, "[chain/error]")} [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
    }
    onLLMStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.green, "[llm/start]")} [${crumbs}] Entering LLM run with input: ${tryJsonStringify({ prompts: run.prompts.map((p) => p.trim()) }, "[inputs]")}`);
    }
    onLLMEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.cyan, "[llm/end]")} [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${tryJsonStringify(run.response, "[response]")}`);
    }
    onLLMError(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.red, "[llm/error]")} [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
    }
    onToolStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.green, "[tool/start]")} [${crumbs}] Entering Tool run with input: "${run.tool_input?.trim()}"`);
    }
    onToolEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.cyan, "[tool/end]")} [${crumbs}] [${elapsed(run)}] Exiting Tool run with output: "${run.output?.trim()}"`);
    }
    onToolError(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.red, "[tool/error]")} [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${tryJsonStringify(run.error, "[error]")}`);
    }
    onAgentAction(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.blue, "[agent/action]")} [${crumbs}] Agent selected action: ${tryJsonStringify(run.actions[run.actions.length - 1], "[action]")}`);
    }
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/callbacks/handlers/initialize.js

async function getTracingCallbackHandler(session) {
    const tracer = new LangChainTracer();
    if (session) {
        await tracer.loadSession(session);
    }
    else {
        await tracer.loadDefaultSession();
    }
    return tracer;
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/callbacks/manager.js




class BaseCallbackManager {
    setHandler(handler) {
        return this.setHandlers([handler]);
    }
}
class BaseRunManager {
    constructor(runId, handlers, inheritableHandlers, _parentRunId) {
        Object.defineProperty(this, "runId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: runId
        });
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: handlers
        });
        Object.defineProperty(this, "inheritableHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: inheritableHandlers
        });
        Object.defineProperty(this, "_parentRunId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: _parentRunId
        });
    }
    async handleText(text) {
        await Promise.all(this.handlers.map(async (handler) => {
            try {
                await handler.handleText?.(text, this.runId, this._parentRunId);
            }
            catch (err) {
                console.error(`Error in handler ${handler.constructor.name}, handleText: ${err}`);
            }
        }));
    }
}
class CallbackManagerForLLMRun extends BaseRunManager {
    async handleLLMNewToken(token) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreLLM) {
                try {
                    await handler.handleLLMNewToken?.(token, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleLLMNewToken: ${err}`);
                }
            }
        }));
    }
    async handleLLMError(err) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreLLM) {
                try {
                    await handler.handleLLMError?.(err, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleLLMError: ${err}`);
                }
            }
        }));
    }
    async handleLLMEnd(output) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreLLM) {
                try {
                    await handler.handleLLMEnd?.(output, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleLLMEnd: ${err}`);
                }
            }
        }));
    }
}
class CallbackManagerForChainRun extends BaseRunManager {
    getChild() {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const manager = new CallbackManager(this.runId);
        manager.setHandlers(this.inheritableHandlers);
        return manager;
    }
    async handleChainError(err) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreChain) {
                try {
                    await handler.handleChainError?.(err, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleChainError: ${err}`);
                }
            }
        }));
    }
    async handleChainEnd(output) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreChain) {
                try {
                    await handler.handleChainEnd?.(output, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleChainEnd: ${err}`);
                }
            }
        }));
    }
    async handleAgentAction(action) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreAgent) {
                try {
                    await handler.handleAgentAction?.(action, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleAgentAction: ${err}`);
                }
            }
        }));
    }
    async handleAgentEnd(action) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreAgent) {
                try {
                    await handler.handleAgentEnd?.(action, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleAgentEnd: ${err}`);
                }
            }
        }));
    }
}
class CallbackManagerForToolRun extends BaseRunManager {
    getChild() {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const manager = new CallbackManager(this.runId);
        manager.setHandlers(this.inheritableHandlers);
        return manager;
    }
    async handleToolError(err) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreAgent) {
                try {
                    await handler.handleToolError?.(err, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleToolError: ${err}`);
                }
            }
        }));
    }
    async handleToolEnd(output) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreAgent) {
                try {
                    await handler.handleToolEnd?.(output, this.runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleToolEnd: ${err}`);
                }
            }
        }));
    }
}
class CallbackManager extends BaseCallbackManager {
    constructor(parentRunId) {
        super();
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "inheritableHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "callback_manager"
        });
        Object.defineProperty(this, "_parentRunId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.handlers = [];
        this.inheritableHandlers = [];
        this._parentRunId = parentRunId;
    }
    async handleLLMStart(llm, prompts, runId = v4()) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreLLM) {
                try {
                    await handler.handleLLMStart?.(llm, prompts, runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleLLMStart: ${err}`);
                }
            }
        }));
        return new CallbackManagerForLLMRun(runId, this.handlers, this.inheritableHandlers, this._parentRunId);
    }
    async handleChainStart(chain, inputs, runId = v4()) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreChain) {
                try {
                    await handler.handleChainStart?.(chain, inputs, runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleChainStart: ${err}`);
                }
            }
        }));
        return new CallbackManagerForChainRun(runId, this.handlers, this.inheritableHandlers, this._parentRunId);
    }
    async handleToolStart(tool, input, runId = v4()) {
        await Promise.all(this.handlers.map(async (handler) => {
            if (!handler.ignoreAgent) {
                try {
                    await handler.handleToolStart?.(tool, input, runId, this._parentRunId);
                }
                catch (err) {
                    console.error(`Error in handler ${handler.constructor.name}, handleToolStart: ${err}`);
                }
            }
        }));
        return new CallbackManagerForToolRun(runId, this.handlers, this.inheritableHandlers, this._parentRunId);
    }
    addHandler(handler, inherit = true) {
        this.handlers.push(handler);
        if (inherit) {
            this.inheritableHandlers.push(handler);
        }
    }
    removeHandler(handler) {
        this.handlers = this.handlers.filter((_handler) => _handler !== handler);
        this.inheritableHandlers = this.inheritableHandlers.filter((_handler) => _handler !== handler);
    }
    setHandlers(handlers, inherit = true) {
        this.handlers = [];
        this.inheritableHandlers = [];
        for (const handler of handlers) {
            this.addHandler(handler, inherit);
        }
    }
    copy(additionalHandlers = [], inherit = true) {
        const manager = new CallbackManager(this._parentRunId);
        for (const handler of this.handlers) {
            const inheritable = this.inheritableHandlers.includes(handler);
            manager.addHandler(handler, inheritable);
        }
        for (const handler of additionalHandlers) {
            if (
            // Prevent multiple copies of console_callback_handler
            manager.handlers
                .filter((h) => h.name === "console_callback_handler")
                .some((h) => h.name === handler.name)) {
                continue;
            }
            manager.addHandler(handler, inherit);
        }
        return manager;
    }
    static fromHandlers(handlers) {
        class Handler extends BaseCallbackHandler {
            constructor() {
                super();
                Object.defineProperty(this, "name", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: v4()
                });
                Object.assign(this, handlers);
            }
        }
        const manager = new this();
        manager.addHandler(new Handler());
        return manager;
    }
    static async configure(inheritableHandlers, localHandlers, options) {
        let callbackManager;
        if (inheritableHandlers || localHandlers) {
            if (Array.isArray(inheritableHandlers) || !inheritableHandlers) {
                callbackManager = new CallbackManager();
                callbackManager.setHandlers(inheritableHandlers?.map(ensureHandler) ?? [], true);
            }
            else {
                callbackManager = inheritableHandlers;
            }
            callbackManager = callbackManager.copy(Array.isArray(localHandlers)
                ? localHandlers.map(ensureHandler)
                : localHandlers?.handlers, false);
        }
        const tracingEnabled = typeof process !== "undefined"
            ? // eslint-disable-next-line no-process-env
                process.env?.LANGCHAIN_TRACING !== undefined
            : false;
        if (options?.verbose || tracingEnabled) {
            if (!callbackManager) {
                callbackManager = new CallbackManager();
            }
            if (options?.verbose &&
                !callbackManager.handlers.some((handler) => handler.name === ConsoleCallbackHandler.prototype.name)) {
                const consoleHandler = new ConsoleCallbackHandler();
                callbackManager.addHandler(consoleHandler, true);
            }
            if (tracingEnabled &&
                !callbackManager.handlers.some((handler) => handler.name === "langchain_tracer")) {
                const session = typeof process !== "undefined"
                    ? // eslint-disable-next-line no-process-env
                        process.env?.LANGCHAIN_SESSION
                    : undefined;
                callbackManager.addHandler(await getTracingCallbackHandler(session), true);
            }
        }
        return callbackManager;
    }
}
function ensureHandler(handler) {
    if ("name" in handler) {
        return handler;
    }
    return BaseCallbackHandler.fromMethods(handler);
}


/***/ }),

/***/ 8102:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Ck": () => (/* binding */ AIChatMessage),
/* harmony export */   "J": () => (/* binding */ ChatMessage),
/* harmony export */   "MJ": () => (/* binding */ BasePromptValue),
/* harmony export */   "WH": () => (/* binding */ RUN_KEY),
/* harmony export */   "Z": () => (/* binding */ HumanChatMessage),
/* harmony export */   "w": () => (/* binding */ SystemChatMessage)
/* harmony export */ });
/* unused harmony exports BaseChatMessage, BaseRetriever, BaseChatMessageHistory, BaseCache, BaseFileStore */
const RUN_KEY = "__run";
class BaseChatMessage {
    constructor(text) {
        /** The text of the message. */
        Object.defineProperty(this, "text", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** The name of the message sender in a multi-user chat. */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.text = text;
    }
}
class HumanChatMessage extends BaseChatMessage {
    _getType() {
        return "human";
    }
}
class AIChatMessage extends BaseChatMessage {
    _getType() {
        return "ai";
    }
}
class SystemChatMessage extends BaseChatMessage {
    _getType() {
        return "system";
    }
}
class ChatMessage extends BaseChatMessage {
    constructor(text, role) {
        super(text);
        Object.defineProperty(this, "role", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.role = role;
    }
    _getType() {
        return "generic";
    }
}
/**
 * Base PromptValue class. All prompt values should extend this class.
 */
class BasePromptValue {
}
/**
 * Base Index class. All indexes should extend this class.
 */
class BaseRetriever {
}
class BaseChatMessageHistory {
}
class BaseCache {
}
class BaseFileStore {
}


/***/ })

};
;
//# sourceMappingURL=216.index.js.map