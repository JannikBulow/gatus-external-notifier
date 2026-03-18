"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFuncs = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.logFuncs = {
    ignore: (_level, _msg) => { },
    consoleLog: (level, msg) => { console.log(`[${level}] ${msg}`); }
};
