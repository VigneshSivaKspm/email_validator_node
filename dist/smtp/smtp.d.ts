interface SMTPResult {
    valid: boolean;
    reason: string;
    smtpCode?: number;
    smtpMessage?: string;
    catchAll?: boolean;
    blocked?: boolean;
    accept_all?: boolean;
    validators?: any;
}
declare const isBlockingService: (exchange: string) => boolean;
export { isBlockingService };
export declare const checkSMTP: (sender: string, recipient: string, exchange: string) => Promise<SMTPResult>;
export declare const checkCatchAll: (sender: string, domain: string, exchange: string) => Promise<boolean>;
