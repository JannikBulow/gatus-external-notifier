import { LogLevel, LogFunc, logFuncs } from "./logging";
import axios from "axios";

/**
 * Represents a request to the gatus external endpoint API. 
 */
export interface ExternalEndpointStatus {
    /**
     * Whether the specified status was successful or not.
     */
    success: boolean;

    /**
     * Optional error messages seperated by `\n` if `success` is false.
     */
    error?: string;

    /**
     * Optional duration in milliseconds of how long the health check took to run.
     */
    duration?: number;
}

/**
 * Generates an endpoint key following the Gatus documentation.
 * @param name - Name of the endpoint.
 * @param group - Group name of the endpoint.
 * @returns The usable endpoint key.
 * @example
 * generateEndpointKey("Landing", "Frontend"); // "frontend_landing"
 */
export function generateEndpointKey(name: string, group: string): string {
    /**
     * Practically a carbon copy of key.ConvertGroupAndNameToKey in the Gatus source code.
     */ 
    function sanitize(s: string): string {
        return s.trim()
                .toLowerCase() 
                .replaceAll("/", "-")
                .replaceAll("_", "-")
                .replaceAll(".", "-")
                .replaceAll(",", "-")
                .replaceAll("#", "-")
                .replaceAll("+", "-")
                .replaceAll("&", "-");
    }
    return sanitize(group) + "_" + sanitize(name);
}

/**
 * Generates a URL to the API endpoint where external statuses should be posted.
 * If `hostname` starts with localhost, the http protocol is assumed instead of https.
 * @param hostname - Hostname of the Gatus webserver. Without http(s) prefix.
 * @param endpointKey - Endpoint key for the external endpoint you are targetting.
 * @returns The URL of the external endpoint on the regular Gatus API.
 * @see generateEndpointKey
 */
export function generateGatusExternalEndpointURL(hostname: string, endpointKey: string): string {
    if (hostname.startsWith("localhost")) return `http://${hostname}/api/v1/endpoints/${endpointKey}/external`;
    else return `https://${hostname}/api/v1/endpoints/${endpointKey}/external`;
}

/**
 * Posts an external endpoint status to a Gatus server.
 * @param url - The url to post the status to.
 * @param token - Bearer token configured in Gatus for the external endpoint.
 * @param req - The actual status object.
 * @param log - Logging function.
 * @see generateGatusExternalEndpointURL
 * @see logFuncs
 */
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
