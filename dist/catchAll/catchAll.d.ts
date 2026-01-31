/**
 * Detects if a domain accepts all emails (catch-all)
 * A catch-all domain accepts mail for any address on that domain
 */
/**
 * Test if a domain is catch-all by attempting to verify a non-existent email
 */
export declare const isCatchAllDomain: (sender: string, domain: string, mxExchange: string) => Promise<boolean>;
