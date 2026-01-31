"use strict";
/**
 * Check SPF, DKIM, and DMARC records for domain
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainSecurityScore = exports.checkDNSSecurityRecords = exports.checkDMARC = exports.checkDKIM = exports.checkSPF = void 0;
const dns_1 = __importDefault(require("dns"));
const util_1 = require("util");
const resolveTxt = (0, util_1.promisify)(dns_1.default.resolveTxt);
/**
 * Check SPF record
 */
const checkSPF = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const records = yield resolveTxt(domain);
        const spfRecord = records.find((record) => record.join('').startsWith('v=spf1'));
        if (spfRecord) {
            return {
                exists: true,
                record: spfRecord.join(''),
                valid: true
            };
        }
        return { exists: false, valid: false };
    }
    catch (_a) {
        return { exists: false, valid: false };
    }
});
exports.checkSPF = checkSPF;
/**
 * Check DKIM record (using default selector)
 */
const checkDKIM = (domain, selector = 'default') => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dkimDomain = `${selector}._domainkey.${domain}`;
        const records = yield resolveTxt(dkimDomain);
        if (records && records.length > 0) {
            return {
                exists: true,
                record: records.map((r) => r.join('')).join('')
            };
        }
        return { exists: false };
    }
    catch (_b) {
        return { exists: false };
    }
});
exports.checkDKIM = checkDKIM;
/**
 * Check DMARC record
 */
const checkDMARC = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dmarcDomain = `_dmarc.${domain}`;
        const records = yield resolveTxt(dmarcDomain);
        if (records && records.length > 0) {
            const record = records.map((r) => r.join('')).join('');
            // Extract policy
            const policyMatch = record.match(/p=(\w+)/);
            const policy = policyMatch ? policyMatch[1] : undefined;
            return {
                exists: true,
                record,
                policy
            };
        }
        return { exists: false };
    }
    catch (_c) {
        return { exists: false };
    }
});
exports.checkDMARC = checkDMARC;
/**
 * Check all DNS security records
 */
const checkDNSSecurityRecords = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    const [spf, dmarc] = yield Promise.all([
        (0, exports.checkSPF)(domain),
        (0, exports.checkDMARC)(domain)
    ]);
    // Try multiple common DKIM selectors
    const commonSelectors = ['default', 'selector1', 'selector2', 'google', 'mail', '_domainkey'];
    let dkim = { exists: false };
    for (const selector of commonSelectors) {
        const result = yield (0, exports.checkDKIM)(domain, selector);
        if (result.exists) {
            dkim = result;
            break;
        }
    }
    return {
        spf,
        dkim,
        dmarc
    };
});
exports.checkDNSSecurityRecords = checkDNSSecurityRecords;
/**
 * Get security score based on DNS records (0-100)
 */
const getDomainSecurityScore = (records) => {
    let score = 0;
    // SPF: 30 points
    if (records.spf.exists && records.spf.valid) {
        score += 30;
    }
    else if (records.spf.exists) {
        score += 15;
    }
    // DKIM: 35 points
    if (records.dkim.exists) {
        score += 35;
    }
    // DMARC: 35 points
    if (records.dmarc.exists) {
        score += 30;
        // Extra points for strict DMARC policy
        if (records.dmarc.policy === 'reject') {
            score += 5;
        }
        else if (records.dmarc.policy === 'quarantine') {
            score += 2;
        }
    }
    return Math.min(100, score);
};
exports.getDomainSecurityScore = getDomainSecurityScore;
//# sourceMappingURL=dnsSecurityRecords.js.map