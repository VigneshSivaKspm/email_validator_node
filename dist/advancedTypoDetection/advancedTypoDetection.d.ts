/**
 * Enhanced typo detection with suggestions
 */
interface TypoResult {
    isTypo: boolean;
    suggestion?: string;
    confidence?: number;
}
/**
 * Check for common typos and provide suggestions
 */
export declare const checkTypoWithSuggestion: (email: string, additionalTopLevelDomains?: string[]) => Promise<TypoResult>;
/**
 * Get list of likely typo corrections for a domain
 */
export declare const getSuggestedDomains: (domain: string) => string[];
export {};
