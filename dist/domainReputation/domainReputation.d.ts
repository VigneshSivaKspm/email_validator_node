/**
 * Check domain reputation using open APIs
 * Includes domain age, hosting info, and reputation scores
 */
export declare const checkDomainReputation: (domain: string) => Promise<{
    domainAge: string | null;
    reputation_score: number;
    is_suspicious: boolean;
    hosting_type: string | null;
    dns_present: boolean;
    details: string[];
}>;
