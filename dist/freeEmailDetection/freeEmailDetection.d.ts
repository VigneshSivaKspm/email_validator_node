/**
 * Detects if an email is from a free email provider
 * Free providers: Gmail, Yahoo, Outlook, ProtonMail, etc.
 */
export declare const isFreeEmail: (domain: string) => boolean;
export declare const getEmailProvider: (domain: string) => 'free' | 'commercial';
/**
 * Get provider name if it's a known free provider
 */
export declare const getProviderName: (domain: string) => string | null;
