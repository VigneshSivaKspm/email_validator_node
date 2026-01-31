"use strict";
/**
 * Detects if an email is from a free email provider
 * Free providers: Gmail, Yahoo, Outlook, ProtonMail, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderName = exports.getEmailProvider = exports.isFreeEmail = void 0;
const freeEmailProviders = new Set([
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.co.in',
    'yahoo.fr',
    'yahoo.de',
    'yahoo.it',
    'yahoo.es',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'protonmail.com',
    'proton.me',
    'tutanota.com',
    'mail.com',
    'mailfence.com',
    'tutamail.com',
    'mailbox.org',
    'posteo.de',
    'runbox.com',
    'fastmail.com',
    'fastmail.fm',
    'mail.de',
    'web.de',
    'gmx.com',
    'gmx.de',
    'gmx.net',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'aim.com',
    'ymail.com',
    'rocketmail.com',
    'mail.yahoo.com',
    'zoho.com',
    'mail.zoho.com',
    'temp-mail.org',
    'tempmail.com',
    'throwaway.email',
    '10minutemail.com',
    'mailinator.com',
    'maildrop.cc',
    'sharklasers.com',
    'spam4.me',
    'spamgourmet.com',
    'yopmail.com',
    'trashmail.com',
    'mytrashmail.com'
]);
const isFreeEmail = (domain) => {
    return freeEmailProviders.has(domain.toLowerCase());
};
exports.isFreeEmail = isFreeEmail;
const getEmailProvider = (domain) => {
    return (0, exports.isFreeEmail)(domain) ? 'free' : 'commercial';
};
exports.getEmailProvider = getEmailProvider;
/**
 * Get provider name if it's a known free provider
 */
const getProviderName = (domain) => {
    const lowerDomain = domain.toLowerCase();
    // Map common domains to provider names
    const providerMap = {
        'gmail.com': 'Gmail',
        'googlemail.com': 'Gmail',
        'yahoo.com': 'Yahoo',
        'yahoo.co.uk': 'Yahoo',
        'yahoo.co.in': 'Yahoo',
        'hotmail.com': 'Hotmail',
        'outlook.com': 'Outlook',
        'live.com': 'Live Mail',
        'msn.com': 'MSN',
        'protonmail.com': 'ProtonMail',
        'proton.me': 'Proton',
        'icloud.com': 'iCloud',
        'me.com': 'iCloud',
        'aol.com': 'AOL',
        'zoho.com': 'Zoho',
        'fastmail.com': 'FastMail',
        'tutanota.com': 'Tutanota'
    };
    return providerMap[lowerDomain] || ((0, exports.isFreeEmail)(domain) ? 'Free Email Provider' : null);
};
exports.getProviderName = getProviderName;
//# sourceMappingURL=freeEmailDetection.js.map