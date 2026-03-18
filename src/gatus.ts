import { LogLevel, LogFunc, logFuncs } from "./logging";
import axios from "axios";

export interface ExternalEndpointStatus {
    success: boolean;
    error?: string;
    duration?: number;
}

export function generateGatusURL(hostname: string, endpointKey: string): string {
    if (hostname.startsWith("localhost")) return `http://${hostname}/api/v1/endpoints/${endpointKey}/external`;
    else return `https://${hostname}/api/v1/endpoints/${endpointKey}/external`;
}

export async function sendExternalEndpointStatus(
    url: string, 
    token: string, 
    req: ExternalEndpointStatus,
    log: LogFunc = logFuncs.consoleLog
): Promise<void> {
    let finalURL = `${url}?success=${req.success}`;
    if (req.error !== undefined) finalURL += `&error=${encodeURIComponent(req.error)}`
    if (req.duration !== undefined) finalURL += `&duration=${encodeURIComponent(Math.floor(req.duration) + "ms")}`;

    log(LogLevel.Debug, finalURL);

    await axios.post(finalURL, {}, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });
}
