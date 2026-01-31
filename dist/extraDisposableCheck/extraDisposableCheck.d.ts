/**
 * Enhanced disposable email detection using multiple open sources
 */
export declare const checkExtraDisposableSources: (domain: string) => Promise<{
    isDisposable: boolean;
    source: string | null;
    confidence: number;
}>;
