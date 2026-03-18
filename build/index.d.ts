import { LogFunc } from "./logging";
export interface Condition {
    name: string;
    run: () => Promise<boolean>;
}
export declare function makeCondition(name: string, run: () => Promise<boolean>): Condition;
export declare function worker(hostname: string, endpointKey: string, token: string, conditions: Condition[], interval?: number, log?: LogFunc): Promise<never>;
export declare function start(hostname: string, endpointKey: string, token: string, conditions: Condition[], interval?: number, log?: LogFunc): void;
