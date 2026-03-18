import * as gatus from "./gatus";
import { LogLevel, LogFunc, logFuncs } from "./logging";
import { performance } from "perf_hooks";

export interface Condition {
    name: string;
    run: () => Promise<boolean>;
}

export function makeCondition(name: string, run: () => Promise<boolean>): Condition {
    return {name, run};
}

export async function worker(
    hostname: string, 
    endpointKey: string,
    token: string,
    conditions: Condition[],
    interval: number = 5 * 60 * 1000,
    log: LogFunc = logFuncs.consoleLog
): Promise<never> {
    const url = gatus.generateGatusURL(hostname, endpointKey);

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

        await new Promise((resolve) => setTimeout(resolve, interval - (performance.now() - startTime)));
    }
}

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
