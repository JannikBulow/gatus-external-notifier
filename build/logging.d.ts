export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
export type LogFunc = (level: LogLevel, msg?: any) => void;
export declare const logFuncs: {
    ignore: (_level: LogLevel, _msg?: any) => void;
    consoleLog: (level: LogLevel, msg?: any) => void;
};
