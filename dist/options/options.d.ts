type Options = {
    sender: string;
    validateRegex: boolean;
    validateMx: boolean;
    validateTypo: boolean;
    validateDisposable: boolean;
    validateSMTP: boolean;
};
type MailCheckOptions = {
    additionalTopLevelDomains?: string[];
};
export type ValidatorOptions = Partial<Options> & {
    email: string;
} & MailCheckOptions;
type ValidatorOptionsFinal = Options & {
    email: string;
} & MailCheckOptions;
export declare function getOptions(emailOrOptions: string | ValidatorOptions): ValidatorOptionsFinal;
export {};
