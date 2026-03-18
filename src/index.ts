import * as gatus from "./gatus";
import { LogLevel, LogFunc, logFuncs } from "./logging";
import { performance } from "perf_hooks";

/**
 * Represents a step in the health check process.
 * Each step has a name for easier debugging as well as an async predicate.
 */
export interface Condition {
    /**
     * The name of this condition.
     * This is shared with the Gatus server if the Condition fails or throws an error.
     */
    name: string;
    /**
     * Async predicate for the step. Resolves to true on success.
     */
    run: () => Promise<boolean>;
}

/**
 * Helper function to create conditions a little easier.
 * @see Condition
 */
export function makeCondition(name: string, run: () => Promise<boolean>): Condition {
    return {name, run};
}

/**
 * Main worker function of the external endpoint notifier. Runs forevever and never returns.
 * This function is async meaning it needs to be allowed to run when it needs to. So make sure you don't hog up the event loop. (Or run this on a separate thread)
 * @param hostname - Hostname of the Gatus webserver. Without http(s) prefix.
 * @param endpointKey - Endpoint key for the external endpoint you are targetting.
 * @param token - Bearer token configured in Gatus for the external endpoint.
 * @param conditions - List of steps for each health check. Every condition is guaranteed to run in order and will be awaited.
 * @param interval - Roughly how often the health check should run. Do keep in mind that the single-threaded nature of JavaScript might make this difficult if you don't know how to program with async.
 * @param log - Logging function.
 * @returns I hope not.
 * @see Condition
 * @see logFuncs
 */
export async function worker(
    hostname: string, 
    endpointKey: string,
    token: string,
    conditions: Condition[],
    interval: number = 5 * 60 * 1000,
    log: LogFunc = logFuncs.consoleLog
): Promise<never> {
    const url = gatus.generateGatusExternalEndpointURL(hostname, endpointKey);

    // Minor optimization to save a few microseconds of allocating and resizing arrays, then GCing, but at the cost of a few hundred or thousand bytes more memory used
    // I would write that memory is free buuuut.......
    const condFails: Condition[] = [];
    const condErrors: Condition[] = [];

    while (true) {
        // Sophisticated js way of resetting an array
        condFails.length = 0;
        condErrors.length = 0;

        const startTime = performance.now();

        for (const cond of conditions) {
            try {
                const success = await cond.run();
                if (!success) {
                    log(LogLevel.Warn, `Condition ${cond.name} failed by returning false`);
                    condFails.push(cond);
                }
            } catch (e) {
                log(LogLevel.Warn, `Condition ${cond.name} threw an error`);
                condErrors.push(cond);
            }
        }

        const endTime = performance.now();

        const success = condFails.length == 0 && condErrors.length == 0;
        let errors: string[] | undefined = undefined;
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

        const error: string | undefined = errors?.join("\n");

        try {
            await gatus.sendExternalEndpointStatus(url, token,  {success, error, duration}, log);
        } catch (e) {
            log(LogLevel.Error, `An error was thrown while trying to send status to Gatus API: ${e}`);
        }

        // Call performance.now() again because sending the status could've taken some time and we want to stay as precise as possible.
        const wait = interval - (performance.now() - startTime);
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, wait)));
    }
}

/**
 * Calls worker() with the parameters provided and adds an error handler just in case something happens (for debug purposes).
 * @param hostname - Hostname of the Gatus webserver. Without http(s) prefix.
 * @param endpointKey - Endpoint key for the external endpoint you are targetting.
 * @param token - Bearer token configured in Gatus for the external endpoint.
 * @param conditions - List of steps for each health check. Every condition is guaranteed to run in order and will be awaited.
 * @param interval - Roughly how often the health check should run. Do keep in mind that the single-threaded nature of JavaScript might make this difficult if you don't know how to program with async.
 * @param log - Logging function.
 */
export function start(
    hostname: string, 
    endpointKey: string,
    token: string,
    conditions: Condition[],
    interval: number = 5 * 60 * 1000,
    log: LogFunc = logFuncs.consoleLog
): void {
    worker(hostname, endpointKey, token, conditions, interval, log).catch(e => log(LogLevel.Error, e));
}
