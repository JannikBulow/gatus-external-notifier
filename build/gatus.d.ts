import { LogFunc } from "./logging";
export interface ExternalEndpointStatus {
    success: boolean;
    error?: string;
    duration?: number;
}
export declare function generateGatusURL(hostname: string, endpointKey: string): string;
export declare function sendExternalEndpointStatus(url: string, token: string, req: ExternalEndpointStatus, log?: LogFunc): Promise<void>;
