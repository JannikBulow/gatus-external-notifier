"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExternalEndpointStatus = exports.generateGatusURL = void 0;
const logging_1 = require("./logging");
const axios_1 = __importDefault(require("axios"));
function generateGatusURL(hostname, endpointKey) {
    if (hostname.startsWith("localhost"))
        return `http://${hostname}/api/v1/endpoints/${endpointKey}/external`;
    else
        return `https://${hostname}/api/v1/endpoints/${endpointKey}/external`;
}
exports.generateGatusURL = generateGatusURL;
function sendExternalEndpointStatus(url, token, req, log = logging_1.logFuncs.consoleLog) {
    return __awaiter(this, void 0, void 0, function* () {
        let finalURL = `${url}?success=${req.success}`;
        if (req.error !== undefined)
            finalURL += `&error=${encodeURIComponent(req.error)}`;
        if (req.duration !== undefined)
            finalURL += `&duration=${encodeURIComponent(Math.floor(req.duration) + "ms")}`;
        log(logging_1.LogLevel.Debug, finalURL);
        yield axios_1.default.post(finalURL, {}, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    });
}
exports.sendExternalEndpointStatus = sendExternalEndpointStatus;
