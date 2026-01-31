/**
 * Advanced email pattern and format validation
 * Detects suspicious patterns, format issues, and common typos
 */
export declare const validateEmailPattern: (email: string) => {
    valid: boolean;
    score: number;
    issues: string[];
    warnings: string[];
};
