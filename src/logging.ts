export enum LogLevel {
    Debug,
    Info,
    Warn,
    Error
}

export type LogFunc = (level: LogLevel, msg?: any) => void;

export const logFuncs = {
    ignore: (_level: LogLevel, _msg?: any) => { },
    consoleLog: (level: LogLevel, msg?: any) => { console.log(`[${level}] ${msg}`); }
}
