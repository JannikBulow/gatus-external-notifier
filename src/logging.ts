/**
 * Really basic log level enum. You should know what this is by now.
 */
export enum LogLevel {
    Debug,
    Info,
    Warn,
    Error
}

/**
 * Function that logs a message. Can be one of the existing ones or your own function.
 * Is intended to be easy to integrate with any logging library.
 */
export type LogFunc = (level: LogLevel, msg?: any) => void;

/**
 * Some premade logging functions.
 */
export const logFuncs = {
    /**
     * Ignores any log calls.
     */
    ignore: (_level: LogLevel, _msg?: any) => { },

    /**
     * Forwards log calls to console.log.
     */
    consoleLog: (level: LogLevel, msg?: any) => { console.log(`[${level}] ${msg}`); }
}
