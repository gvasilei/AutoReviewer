"use strict";
exports.id = 437;
exports.ids = [437];
exports.modules = {

/***/ 7437:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "ChatOpenAI": () => (/* binding */ ChatOpenAI)
});

// EXTERNAL MODULE: ./node_modules/openai/dist/index.js
var dist = __webpack_require__(9211);
// EXTERNAL MODULE: ./node_modules/axios/index.js
var axios = __webpack_require__(6545);
;// CONCATENATED MODULE: ./node_modules/langchain/dist/util/event-source-parse.js
/* eslint-disable prefer-template */
/* eslint-disable default-case */
/* eslint-disable no-plusplus */
// Adapted from https://github.com/gfortaine/fetch-event-source/blob/main/src/parse.ts
// due to a packaging issue in the original.
// MIT License
const EventStreamContentType = "text/event-stream";
/**
 * Converts a ReadableStream into a callback pattern.
 * @param stream The input ReadableStream.
 * @param onChunk A function that will be called on each new byte chunk in the stream.
 * @returns {Promise<void>} A promise that will be resolved when the stream closes.
 */
async function getBytes(stream, onChunk) {
    const reader = stream.getReader();
    let result;
    // eslint-disable-next-line no-cond-assign
    while (!(result = await reader.read()).done) {
        onChunk(result.value);
    }
}
/**
 * Parses arbitary byte chunks into EventSource line buffers.
 * Each line should be of the format "field: value" and ends with \r, \n, or \r\n.
 * @param onLine A function that will be called on each new EventSource line.
 * @returns A function that should be called for each incoming byte chunk.
 */
function getLines(onLine) {
    let buffer;
    let position; // current read position
    let fieldLength; // length of the `field` portion of the line
    let discardTrailingNewline = false;
    // return a function that can process each incoming byte chunk:
    return function onChunk(arr) {
        if (buffer === undefined) {
            buffer = arr;
            position = 0;
            fieldLength = -1;
        }
        else {
            // we're still parsing the old line. Append the new bytes into buffer:
            buffer = concat(buffer, arr);
        }
        const bufLength = buffer.length;
        let lineStart = 0; // index where the current line starts
        while (position < bufLength) {
            if (discardTrailingNewline) {
                if (buffer[position] === 10 /* ControlChars.NewLine */) {
                    lineStart = ++position; // skip to next char
                }
                discardTrailingNewline = false;
            }
            // start looking forward till the end of line:
            let lineEnd = -1; // index of the \r or \n char
            for (; position < bufLength && lineEnd === -1; ++position) {
                switch (buffer[position]) {
                    case 58 /* ControlChars.Colon */:
                        if (fieldLength === -1) {
                            // first colon in line
                            fieldLength = position - lineStart;
                        }
                        break;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore:7029 \r case below should fallthrough to \n:
                    case 13 /* ControlChars.CarriageReturn */:
                        discardTrailingNewline = true;
                    // eslint-disable-next-line no-fallthrough
                    case 10 /* ControlChars.NewLine */:
                        lineEnd = position;
                        break;
                }
            }
            if (lineEnd === -1) {
                // We reached the end of the buffer but the line hasn't ended.
                // Wait for the next arr and then continue parsing:
                break;
            }
            // we've reached the line end, send it out:
            onLine(buffer.subarray(lineStart, lineEnd), fieldLength);
            lineStart = position; // we're now on the next line
            fieldLength = -1;
        }
        if (lineStart === bufLength) {
            buffer = undefined; // we've finished reading it
        }
        else if (lineStart !== 0) {
            // Create a new view into buffer beginning at lineStart so we don't
            // need to copy over the previous lines when we get the new arr:
            buffer = buffer.subarray(lineStart);
            position -= lineStart;
        }
    };
}
/**
 * Parses line buffers into EventSourceMessages.
 * @param onId A function that will be called on each `id` field.
 * @param onRetry A function that will be called on each `retry` field.
 * @param onMessage A function that will be called on each message.
 * @returns A function that should be called for each incoming line buffer.
 */
function getMessages(onMessage, onId, onRetry) {
    let message = newMessage();
    const decoder = new TextDecoder();
    // return a function that can process each incoming line buffer:
    return function onLine(line, fieldLength) {
        if (line.length === 0) {
            // empty line denotes end of message. Trigger the callback and start a new message:
            onMessage?.(message);
            message = newMessage();
        }
        else if (fieldLength > 0) {
            // exclude comments and lines with no values
            // line is of format "<field>:<value>" or "<field>: <value>"
            // https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
            const field = decoder.decode(line.subarray(0, fieldLength));
            const valueOffset = fieldLength + (line[fieldLength + 1] === 32 /* ControlChars.Space */ ? 2 : 1);
            const value = decoder.decode(line.subarray(valueOffset));
            switch (field) {
                case "data":
                    // if this message already has data, append the new value to the old.
                    // otherwise, just set to the new value:
                    message.data = message.data ? message.data + "\n" + value : value; // otherwise,
                    break;
                case "event":
                    message.event = value;
                    break;
                case "id":
                    onId?.((message.id = value));
                    break;
                case "retry": {
                    const retry = parseInt(value, 10);
                    if (!Number.isNaN(retry)) {
                        // per spec, ignore non-integers
                        onRetry?.((message.retry = retry));
                    }
                    break;
                }
            }
        }
    };
}
function concat(a, b) {
    const res = new Uint8Array(a.length + b.length);
    res.set(a);
    res.set(b, a.length);
    return res;
}
function newMessage() {
    // data, event, and id must be initialized to empty strings:
    // https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
    // retry should be initialized to undefined so we return a consistent shape
    // to the js engine all the time: https://mathiasbynens.be/notes/shapes-ics#takeaways
    return {
        data: "",
        event: "",
        id: "",
        retry: undefined,
    };
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/util/axios-fetch-adapter.js
/* eslint-disable no-plusplus */
/* eslint-disable prefer-template */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-extraneous-dependencies */
/**
 * This is copied from @vespaiach/axios-fetch-adapter, which exposes an ESM
 * module without setting the "type" field in package.json.
 */


function tryJsonStringify(data) {
    try {
        return JSON.stringify(data);
    }
    catch (e) {
        return data;
    }
}
/**
 * In order to avoid import issues with axios 1.x, copying here the internal
 * utility functions that we used to import directly from axios.
 */
// Copied from axios/lib/core/settle.js
function settle(resolve, reject, response) {
    const { validateStatus } = response.config;
    if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
    }
    else {
        reject(createError(`Request failed with status code ${response.status} and body ${typeof response.data === "string"
            ? response.data
            : tryJsonStringify(response.data)}`, response.config, null, response.request, response));
    }
}
// Copied from axios/lib/helpers/isAbsoluteURL.js
function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
// Copied from axios/lib/helpers/combineURLs.js
function combineURLs(baseURL, relativeURL) {
    return relativeURL
        ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
        : baseURL;
}
// Copied from axios/lib/helpers/buildURL.js
function encode(val) {
    return encodeURIComponent(val)
        .replace(/%3A/gi, ":")
        .replace(/%24/g, "$")
        .replace(/%2C/gi, ",")
        .replace(/%20/g, "+")
        .replace(/%5B/gi, "[")
        .replace(/%5D/gi, "]");
}
function buildURL(url, params, paramsSerializer) {
    if (!params) {
        return url;
    }
    var serializedParams;
    if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
    }
    else if (isURLSearchParams(params)) {
        serializedParams = params.toString();
    }
    else {
        var parts = [];
        forEach(params, function serialize(val, key) {
            if (val === null || typeof val === "undefined") {
                return;
            }
            if (isArray(val)) {
                key = `${key}[]`;
            }
            else {
                val = [val];
            }
            forEach(val, function parseValue(v) {
                if (isDate(v)) {
                    v = v.toISOString();
                }
                else if (isObject(v)) {
                    v = JSON.stringify(v);
                }
                parts.push(`${encode(key)}=${encode(v)}`);
            });
        });
        serializedParams = parts.join("&");
    }
    if (serializedParams) {
        var hashmarkIndex = url.indexOf("#");
        if (hashmarkIndex !== -1) {
            url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url;
}
// Copied from axios/lib/core/buildFullPath.js
function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
}
// Copied from axios/lib/utils.js
function isUndefined(val) {
    return typeof val === "undefined";
}
function isObject(val) {
    return val !== null && typeof val === "object";
}
function isDate(val) {
    return toString.call(val) === "[object Date]";
}
function isURLSearchParams(val) {
    return toString.call(val) === "[object URLSearchParams]";
}
function isArray(val) {
    return Array.isArray(val);
}
function forEach(obj, fn) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === "undefined") {
        return;
    }
    // Force an array if not already something iterable
    if (typeof obj !== "object") {
        obj = [obj];
    }
    if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
        }
    }
    else {
        // Iterate over object keys
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                fn.call(null, obj[key], key, obj);
            }
        }
    }
}
function isFormData(val) {
    return toString.call(val) === "[object FormData]";
}
// TODO this needs to be fixed to run in newer browser-like environments
// https://github.com/vespaiach/axios-fetch-adapter/issues/20#issue-1396365322
function isStandardBrowserEnv() {
    if (typeof navigator !== "undefined" &&
        // eslint-disable-next-line no-undef
        (navigator.product === "ReactNative" ||
            // eslint-disable-next-line no-undef
            navigator.product === "NativeScript" ||
            // eslint-disable-next-line no-undef
            navigator.product === "NS")) {
        return false;
    }
    return typeof window !== "undefined" && typeof document !== "undefined";
}
/**
 * - Create a request object
 * - Get response body
 * - Check if timeout
 */
async function fetchAdapter(config) {
    const request = createRequest(config);
    const data = await getResponse(request, config);
    return new Promise((resolve, reject) => {
        if (data instanceof Error) {
            reject(data);
        }
        else {
            // eslint-disable-next-line no-unused-expressions
            Object.prototype.toString.call(config.settle) === "[object Function]"
                ? config.settle(resolve, reject, data)
                : settle(resolve, reject, data);
        }
    });
}
/**
 * Fetch API stage two is to get response body. This funtion tries to retrieve
 * response body based on response's type
 */
async function getResponse(request, config) {
    let stageOne;
    try {
        stageOne = await fetch(request);
    }
    catch (e) {
        if (e && e.name === "AbortError") {
            return createError("Request aborted", config, "ECONNABORTED", request);
        }
        if (e && e.name === "TimeoutError") {
            return createError("Request timeout", config, "ECONNABORTED", request);
        }
        return createError("Network Error", config, "ERR_NETWORK", request);
    }
    const headers = {};
    stageOne.headers.forEach((value, key) => {
        headers[key] = value;
    });
    const response = {
        ok: stageOne.ok,
        status: stageOne.status,
        statusText: stageOne.statusText,
        headers,
        config,
        request,
    };
    if (stageOne.status >= 200 && stageOne.status !== 204) {
        if (config.responseType === "stream") {
            const contentType = stageOne.headers.get("content-type");
            if (!contentType?.startsWith(EventStreamContentType)) {
                // If the content-type is not stream, response is most likely an error
                if (stageOne.status >= 400) {
                    // If the error is a JSON, parse it. Otherwise, return as text
                    if (contentType?.startsWith("application/json")) {
                        response.data = await stageOne.json();
                        return response;
                    }
                    else {
                        response.data = await stageOne.text();
                        return response;
                    }
                }
                // If the non-stream response is also not an error, throw
                throw new Error(`Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`);
            }
            await getBytes(stageOne.body, getLines(getMessages(config.onmessage)));
        }
        else {
            switch (config.responseType) {
                case "arraybuffer":
                    response.data = await stageOne.arrayBuffer();
                    break;
                case "blob":
                    response.data = await stageOne.blob();
                    break;
                case "json":
                    response.data = await stageOne.json();
                    break;
                case "formData":
                    response.data = await stageOne.formData();
                    break;
                default:
                    response.data = await stageOne.text();
                    break;
            }
        }
    }
    return response;
}
/**
 * This function will create a Request object based on configuration's axios
 */
function createRequest(config) {
    const headers = new Headers(config.headers);
    // HTTP basic authentication
    if (config.auth) {
        const username = config.auth.username || "";
        const password = config.auth.password
            ? decodeURI(encodeURIComponent(config.auth.password))
            : "";
        headers.set("Authorization", `Basic ${btoa(`${username}:${password}`)}`);
    }
    const method = config.method.toUpperCase();
    const options = {
        headers,
        method,
    };
    if (method !== "GET" && method !== "HEAD") {
        options.body = config.data;
        // In these cases the browser will automatically set the correct Content-Type,
        // but only if that header hasn't been set yet. So that's why we're deleting it.
        if (isFormData(options.body) && isStandardBrowserEnv()) {
            headers.delete("Content-Type");
        }
    }
    if (config.mode) {
        options.mode = config.mode;
    }
    if (config.cache) {
        options.cache = config.cache;
    }
    if (config.integrity) {
        options.integrity = config.integrity;
    }
    if (config.redirect) {
        options.redirect = config.redirect;
    }
    if (config.referrer) {
        options.referrer = config.referrer;
    }
    if (config.timeout && config.timeout > 0) {
        options.signal = AbortSignal.timeout(config.timeout);
    }
    if (config.signal) {
        // this overrides the timeout signal if both are set
        options.signal = config.signal;
    }
    // This config is similar to XHR’s withCredentials flag, but with three available values instead of two.
    // So if withCredentials is not set, default value 'same-origin' will be used
    if (!isUndefined(config.withCredentials)) {
        options.credentials = config.withCredentials ? "include" : "omit";
    }
    // for streaming
    if (config.responseType === "stream") {
        options.headers.set("Accept", EventStreamContentType);
    }
    const fullPath = buildFullPath(config.baseURL, config.url);
    const url = buildURL(fullPath, config.params, config.paramsSerializer);
    // Expected browser to throw error if there is any wrong configuration value
    return new Request(url, options);
}
/**
 * Note:
 *
 *   From version >= 0.27.0, createError function is replaced by AxiosError class.
 *   So I copy the old createError function here for backward compatible.
 *
 *
 *
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function createError(message, config, code, request, response) {
    if (axios.AxiosError && typeof axios.AxiosError === "function") {
        return new axios.AxiosError(message, axios.AxiosError[code], config, request, response);
    }
    const error = new Error(message);
    return enhanceError(error, config, code, request, response);
}
/**
 *
 * Note:
 *
 *   This function is for backward compatible.
 *
 *
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
        error.code = code;
    }
    error.request = request;
    error.response = response;
    error.isAxiosError = true;
    error.toJSON = function toJSON() {
        return {
            // Standard
            message: this.message,
            name: this.name,
            // Microsoft
            description: this.description,
            number: this.number,
            // Mozilla
            fileName: this.fileName,
            lineNumber: this.lineNumber,
            columnNumber: this.columnNumber,
            stack: this.stack,
            // Axios
            config: this.config,
            code: this.code,
            status: this.response && this.response.status ? this.response.status : null,
        };
    };
    return error;
}

// EXTERNAL MODULE: ./node_modules/langchain/dist/schema/index.js
var schema = __webpack_require__(8102);
// EXTERNAL MODULE: ./node_modules/p-retry/index.js
var p_retry = __webpack_require__(2548);
// EXTERNAL MODULE: ./node_modules/p-queue/dist/index.js
var p_queue_dist = __webpack_require__(8983);
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
        const PQueue =  true ? p_queue_dist["default"] : p_queue_dist;
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

;// CONCATENATED MODULE: ./node_modules/langchain/dist/base_language/count_tokens.js
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
                const { encoding_for_model } = await importTiktoken();
                // modelName only exists in openai subclasses, but tiktoken only supports
                // openai tokenisers anyway, so for other subclasses we default to gpt2
                if (encoding_for_model) {
                    this._encoding = encoding_for_model("modelName" in this
                        ? getModelNameForTiktoken(this.modelName)
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
            openai: (await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 7437))).ChatOpenAI,
        }[_type];
        if (Cls === undefined) {
            throw new Error(`Cannot load  LLM with type ${_type}`);
        }
        return new Cls(rest);
    }
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/memory/base.js
class BaseMemory {
}
/**
 * This function is used by memory classes to select the input value
 * to use for the memory. If there is only one input value, it is used.
 * If there are multiple input values, the inputKey must be specified.
 */
const getInputValue = (inputValues, inputKey) => {
    if (inputKey !== undefined) {
        return inputValues[inputKey];
    }
    const keys = Object.keys(inputValues);
    if (keys.length === 1) {
        return inputValues[keys[0]];
    }
    throw new Error(`input values have multiple keys, memory only supported when one key currently: ${keys}`);
};
/**
 * This function is used by memory classes to get a string representation
 * of the chat message history, based on the message content and role.
 */
function getBufferString(messages, humanPrefix = "Human", aiPrefix = "AI") {
    const string_messages = [];
    for (const m of messages) {
        let role;
        if (m._getType() === "human") {
            role = humanPrefix;
        }
        else if (m._getType() === "ai") {
            role = aiPrefix;
        }
        else if (m._getType() === "system") {
            role = "System";
        }
        else if (m._getType() === "generic") {
            role = m.role;
        }
        else {
            throw new Error(`Got unsupported message type: ${m}`);
        }
        string_messages.push(`${role}: ${m.text}`);
    }
    return string_messages.join("\n");
}

// EXTERNAL MODULE: ./node_modules/langchain/node_modules/uuid/dist/index.js
var uuid_dist = __webpack_require__(8655);
;// CONCATENATED MODULE: ./node_modules/langchain/node_modules/uuid/wrapper.mjs

const v1 = uuid_dist.v1;
const v3 = uuid_dist.v3;
const v4 = uuid_dist.v4;
const v5 = uuid_dist.v5;
const NIL = uuid_dist.NIL;
const version = uuid_dist.version;
const validate = uuid_dist.validate;
const stringify = uuid_dist.stringify;
const parse = uuid_dist.parse;

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
function console_tryJsonStringify(obj, fallback) {
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
        console.log(`${wrap(color.green, "[chain/start]")} [${crumbs}] Entering Chain run with input: ${console_tryJsonStringify(run.inputs, "[inputs]")}`);
    }
    onChainEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.cyan, "[chain/end]")} [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${console_tryJsonStringify(run.outputs, "[outputs]")}`);
    }
    onChainError(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.red, "[chain/error]")} [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${console_tryJsonStringify(run.error, "[error]")}`);
    }
    onLLMStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.green, "[llm/start]")} [${crumbs}] Entering LLM run with input: ${console_tryJsonStringify({ prompts: run.prompts.map((p) => p.trim()) }, "[inputs]")}`);
    }
    onLLMEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.cyan, "[llm/end]")} [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${console_tryJsonStringify(run.response, "[response]")}`);
    }
    onLLMError(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.red, "[llm/error]")} [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${console_tryJsonStringify(run.error, "[error]")}`);
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
        console.log(`${wrap(color.red, "[tool/error]")} [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${console_tryJsonStringify(run.error, "[error]")}`);
    }
    onAgentAction(run) {
        const crumbs = this.getBreadcrumbs(run);
        console.log(`${wrap(color.blue, "[agent/action]")} [${crumbs}] Agent selected action: ${console_tryJsonStringify(run.actions[run.actions.length - 1], "[action]")}`);
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
            const copied = handler.copy();
            manager.addHandler(copied, inheritable);
        }
        for (const handler of additionalHandlers) {
            if (
            // Prevent multiple copies of console_callback_handler
            manager.handlers
                .filter((h) => h.name === "console_callback_handler")
                .some((h) => h.name === handler.name)) {
                continue;
            }
            manager.addHandler(handler.copy(), inherit);
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

;// CONCATENATED MODULE: ./node_modules/langchain/dist/chat_models/base.js




class BaseChatModel extends BaseLanguageModel {
    constructor(fields) {
        super(fields);
    }
    async generate(messages, stop, callbacks) {
        const generations = [];
        const llmOutputs = [];
        const messageStrings = messages.map((messageList) => getBufferString(messageList));
        const callbackManager_ = await CallbackManager.configure(callbacks, this.callbacks, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleLLMStart({ name: this._llmType() }, messageStrings);
        try {
            const results = await Promise.all(messages.map((messageList) => this._generate(messageList, stop, runManager)));
            for (const result of results) {
                if (result.llmOutput) {
                    llmOutputs.push(result.llmOutput);
                }
                generations.push(result.generations);
            }
        }
        catch (err) {
            await runManager?.handleLLMError(err);
            throw err;
        }
        const output = {
            generations,
            llmOutput: llmOutputs.length
                ? this._combineLLMOutput?.(...llmOutputs)
                : undefined,
        };
        await runManager?.handleLLMEnd(output);
        Object.defineProperty(output, schema/* RUN_KEY */.WH, {
            value: runManager ? { runId: runManager?.runId } : undefined,
            configurable: true,
        });
        return output;
    }
    _modelType() {
        return "base_chat_model";
    }
    async generatePrompt(promptValues, stop, callbacks) {
        const promptMessages = promptValues.map((promptValue) => promptValue.toChatMessages());
        return this.generate(promptMessages, stop, callbacks);
    }
    async call(messages, stop, callbacks) {
        const result = await this.generate([messages], stop, callbacks);
        const generations = result.generations;
        return generations[0][0].message;
    }
    async callPrompt(promptValue, stop, callbacks) {
        const promptMessages = promptValue.toChatMessages();
        return this.call(promptMessages, stop, callbacks);
    }
}
class SimpleChatModel extends (/* unused pure expression or super */ null && (BaseChatModel)) {
    async _generate(messages, stop, runManager) {
        const text = await this._call(messages, stop, runManager);
        const message = new AIChatMessage(text);
        return {
            generations: [
                {
                    text: message.text,
                    message,
                },
            ],
        };
    }
}

;// CONCATENATED MODULE: ./node_modules/langchain/dist/chat_models/openai.js





function messageTypeToOpenAIRole(type) {
    switch (type) {
        case "system":
            return "system";
        case "ai":
            return "assistant";
        case "human":
            return "user";
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
function openAIResponseToChatMessage(role, text) {
    switch (role) {
        case "user":
            return new schema/* HumanChatMessage */.Z(text);
        case "assistant":
            return new schema/* AIChatMessage */.Ck(text);
        case "system":
            return new schema/* SystemChatMessage */.w(text);
        default:
            return new schema/* ChatMessage */.J(text, role ?? "unknown");
    }
}
/**
 * Wrapper around OpenAI large language models that use the Chat endpoint.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 */
class ChatOpenAI extends BaseChatModel {
    constructor(fields, configuration) {
        super(fields ?? {});
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logitBias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt-3.5-turbo"
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "clientConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.openAIApiKey ??
            (typeof process !== "undefined"
                ? // eslint-disable-next-line no-process-env
                    process.env?.OPENAI_API_KEY
                : undefined);
        if (!apiKey) {
            throw new Error("OpenAI API key not found");
        }
        this.modelName = fields?.modelName ?? this.modelName;
        this.modelKwargs = fields?.modelKwargs ?? {};
        this.timeout = fields?.timeout;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.maxTokens = fields?.maxTokens;
        this.n = fields?.n ?? this.n;
        this.logitBias = fields?.logitBias;
        this.stop = fields?.stop;
        this.streaming = fields?.streaming ?? false;
        if (this.streaming && this.n > 1) {
            throw new Error("Cannot stream results when n > 1");
        }
        this.clientConfig = {
            apiKey,
            ...configuration,
        };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            model: this.modelName,
            temperature: this.temperature,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            max_tokens: this.maxTokens === -1 ? undefined : this.maxTokens,
            n: this.n,
            logit_bias: this.logitBias,
            stop: this.stop,
            stream: this.streaming,
            ...this.modelKwargs,
        };
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return this._identifyingParams();
    }
    /** @ignore */
    async _generate(messages, stopOrOptions, runManager) {
        const stop = Array.isArray(stopOrOptions)
            ? stopOrOptions
            : stopOrOptions?.stop;
        const options = Array.isArray(stopOrOptions)
            ? {}
            : stopOrOptions?.options ?? {};
        const tokenUsage = {};
        if (this.stop && stop) {
            throw new Error("Stop found in input and default params");
        }
        const params = this.invocationParams();
        params.stop = stop ?? params.stop;
        const messagesMapped = messages.map((message) => ({
            role: messageTypeToOpenAIRole(message._getType()),
            content: message.text,
            name: message.name,
        }));
        const data = params.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                this.completionWithRetry({
                    ...params,
                    messages: messagesMapped,
                }, {
                    ...options,
                    responseType: "stream",
                    onmessage: (event) => {
                        if (event.data?.trim?.() === "[DONE]") {
                            resolve(response);
                        }
                        else {
                            const message = JSON.parse(event.data);
                            // on the first message set the response properties
                            if (!response) {
                                response = {
                                    id: message.id,
                                    object: message.object,
                                    created: message.created,
                                    model: message.model,
                                    choices: [],
                                };
                            }
                            // on all messages, update choice
                            const part = message.choices[0];
                            if (part != null) {
                                let choice = response.choices.find((c) => c.index === part.index);
                                if (!choice) {
                                    choice = {
                                        index: part.index,
                                        finish_reason: part.finish_reason ?? undefined,
                                    };
                                    response.choices.push(choice);
                                }
                                if (!choice.message) {
                                    choice.message = {
                                        role: part.delta
                                            ?.role,
                                        content: part.delta?.content ?? "",
                                    };
                                }
                                choice.message.content += part.delta?.content ?? "";
                                // eslint-disable-next-line no-void
                                void runManager?.handleLLMNewToken(part.delta?.content ?? "");
                            }
                        }
                    },
                }).catch((error) => {
                    if (!rejected) {
                        rejected = true;
                        reject(error);
                    }
                });
            })
            : await this.completionWithRetry({
                ...params,
                messages: messagesMapped,
            }, options);
        const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage ?? {};
        if (completionTokens) {
            tokenUsage.completionTokens =
                (tokenUsage.completionTokens ?? 0) + completionTokens;
        }
        if (promptTokens) {
            tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens;
        }
        if (totalTokens) {
            tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
        }
        const generations = [];
        for (const part of data.choices) {
            const role = part.message?.role ?? undefined;
            const text = part.message?.content ?? "";
            generations.push({
                text,
                message: openAIResponseToChatMessage(role, text),
            });
        }
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    async getNumTokensFromMessages(messages) {
        let totalCount = 0;
        let tokensPerMessage = 0;
        let tokensPerName = 0;
        // From: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb
        if (getModelNameForTiktoken(this.modelName) === "gpt-3.5-turbo") {
            tokensPerMessage = 4;
            tokensPerName = -1;
        }
        else if (getModelNameForTiktoken(this.modelName).startsWith("gpt-4")) {
            tokensPerMessage = 3;
            tokensPerName = 1;
        }
        const countPerMessage = await Promise.all(messages.map(async (message) => {
            const textCount = await this.getNumTokens(message.text);
            const count = textCount + tokensPerMessage + (message.name ? tokensPerName : 0);
            totalCount += count;
            return count;
        }));
        return { totalCount, countPerMessage };
    }
    /** @ignore */
    async completionWithRetry(request, options) {
        if (!this.client) {
            const clientConfig = new dist.Configuration({
                ...this.clientConfig,
                baseOptions: {
                    timeout: this.timeout,
                    adapter: fetchAdapter,
                    ...this.clientConfig.baseOptions,
                },
            });
            this.client = new dist.OpenAIApi(clientConfig);
        }
        return this.caller
            .call(this.client.createChatCompletion.bind(this.client), request, options)
            .then((res) => res.data);
    }
    _llmType() {
        return "openai";
    }
    /** @ignore */
    _combineLLMOutput(...llmOutputs) {
        return llmOutputs.reduce((acc, llmOutput) => {
            if (llmOutput && llmOutput.tokenUsage) {
                acc.tokenUsage.completionTokens +=
                    llmOutput.tokenUsage.completionTokens ?? 0;
                acc.tokenUsage.promptTokens += llmOutput.tokenUsage.promptTokens ?? 0;
                acc.tokenUsage.totalTokens += llmOutput.tokenUsage.totalTokens ?? 0;
            }
            return acc;
        }, {
            tokenUsage: {
                completionTokens: 0,
                promptTokens: 0,
                totalTokens: 0,
            },
        });
    }
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
//# sourceMappingURL=437.index.js.map