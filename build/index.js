"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.worker = exports.makeCondition = void 0;
const gatus = __importStar(require("./gatus"));
const logging_1 = require("./logging");
const perf_hooks_1 = require("perf_hooks");
function makeCondition(name, run) {
    return { name, run };
}
exports.makeCondition = makeCondition;
function worker(hostname, endpointKey, token, conditions, interval = 5 * 60 * 1000, log = logging_1.logFuncs.consoleLog) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = gatus.generateGatusURL(hostname, endpointKey);
        // Minor optimization to save a few microseconds of allocating and resizing arrays, then GCing, but at the cost of a few hundred or thousand bytes more memory used
        // I would write that memory is free buuuut.......
        const condFails = [];
        const condErrors = [];
        while (true) {
            // Sophisticated js way of resetting an array
            condFails.length = 0;
            condErrors.length = 0;
            const startTime = perf_hooks_1.performance.now();
            for (const cond of conditions) {
                try {
                    const success = yield cond.run();
                    if (!success) {
                        log(logging_1.LogLevel.Warn, `Condition ${cond.name} failed by returning false`);
                        condFails.push(cond);
                    }
                }
                catch (e) {
                    log(logging_1.LogLevel.Warn, `Condition ${cond.name} threw an error`);
                    condErrors.push(cond);
                }
            }
            const endTime = perf_hooks_1.performance.now();
            const success = condFails.length == 0 && condErrors.length == 0;
            let errors = undefined;
            const duration = endTime - startTime;
            if (!success) {
                errors = [];
                for (const fail of condFails) {
                    errors.push(`Condition '${fail.name}' failed`);
                }
                for (const error of condErrors) {
                    errors.push(`Condition '${error.name}' threw an error`);
                }
            }
            const error = errors === null || errors === void 0 ? void 0 : errors.join("\n");
            try {
                yield gatus.sendExternalEndpointStatus(url, token, { success, error, duration }, log);
            }
            catch (e) {
                log(logging_1.LogLevel.Error, `An error was thrown while trying to send status to Gatus API: ${e}`);
            }
            yield new Promise((resolve) => setTimeout(resolve, interval - (perf_hooks_1.performance.now() - startTime)));
        }
    });
}
exports.worker = worker;
function start(hostname, endpointKey, token, conditions, interval = 5 * 60 * 1000, log = logging_1.logFuncs.consoleLog) {
    worker(hostname, endpointKey, token, conditions, interval, log).catch(e => log(logging_1.LogLevel.Error, e));
}
exports.start = start;
