/**
 * Check SPF, DKIM, and DMARC records for domain
 */
interface DKIMRecord {
    exists: boolean;
    record?: string;
}
interface SPFRecord {
    exists: boolean;
    record?: string;
    valid: boolean;
}
interface DMARCRecord {
    exists: boolean;
    record?: string;
    policy?: string;
}
interface DNSSecurityRecords {
    spf: SPFRecord;
    dkim: DKIMRecord;
    dmarc: DMARCRecord;
}
/**
 * Check SPF record
 */
export declare const checkSPF: (domain: string) => Promise<SPFRecord>;
/**
 * Check DKIM record (using default selector)
 */
export declare const checkDKIM: (domain: string, selector?: string) => Promise<DKIMRecord>;
/**
 * Check DMARC record
 */
export declare const checkDMARC: (domain: string) => Promise<DMARCRecord>;
/**
 * Check all DNS security records
 */
export declare const checkDNSSecurityRecords: (domain: string) => Promise<DNSSecurityRecords>;
/**
 * Get security score based on DNS records (0-100)
 */
export declare const getDomainSecurityScore: (records: DNSSecurityRecords) => number;
export {};
