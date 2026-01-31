/**
 * Check if email has been found in known data breaches using HaveIBeenPwned API
 * Free API - no authentication required
 */
export declare const checkBreachStatus: (email: string) => Promise<{
    breached: boolean;
    breachCount: number;
    breaches: string[];
    compromised: boolean;
}>;
