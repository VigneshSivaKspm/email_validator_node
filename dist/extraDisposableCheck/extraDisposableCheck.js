"use strict";
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
exports.checkExtraDisposableSources = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Enhanced disposable email detection using multiple open sources
 */
const checkExtraDisposableSources = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('  📡 [Kickbox API] Checking disposable status for:', domain);
        // Check against Kickbox disposable domains database
        try {
            const kickboxResponse = yield axios_1.default.get(`https://open.kickbox.com/v1/disposable/${domain}`, { timeout: 5000 });
            if (kickboxResponse.data && kickboxResponse.data.disposable) {
                console.log('  ⚠️ [Kickbox] Domain is disposable');
                return {
                    isDisposable: true,
                    source: 'Kickbox API',
                    confidence: 95
                };
            }
            console.log('  ✅ [Kickbox] Domain is not disposable');
        }
        catch (e) {
            console.log('  ⚠️ [Kickbox] API check failed');
            // API failed, continue
        }
        // Check against commonly known disposable providers
        const disposableDomains = [
            // Temp mail services
            'tempmail.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
            'mailinator.com', 'throwaway.email', 'maildrop.cc', 'temp-mail.io',
            'yopmail.com', 'fake-mail.com', 'tempemail.com', 'email.com.ar',
            'trashmail.com', 'mytrashmail.com', 'spambox.us', 'pokemail.net',
            'tempinbox.com', 'mail.tm', 'temp-mail.io', '10minutemail.info',
            'mailnesia.com', 'tempmail.me', 'maildrop.cc', 'vpopmail.com',
            'mintemail.com', 'temp-mail.org', 'fakeinbox.com', 'dispostable.com',
            'sharklasers.com', 'spam4.me', 'killmail.net', 'throwawaymail.com'
        ];
        if (disposableDomains.includes(domain.toLowerCase())) {
            console.log('  ⚠️ [Disposable List] Domain found in known list');
            return {
                isDisposable: true,
                source: 'Known disposable list',
                confidence: 100
            };
        }
        // Check for common temp email patterns
        if (/^(temp|test|fake|trash|spam|disposable|anonymous|mail)[0-9]*\.(com|net|org|io)/i.test(domain)) {
            console.log('  ⚠️ [Pattern Match] Disposable pattern detected');
            return {
                isDisposable: true,
                source: 'Pattern matching',
                confidence: 85
            };
        }
        console.log('  ✅ [Extra Disposable] Domain passed all checks');
        return {
            isDisposable: false,
            source: null,
            confidence: 0
        };
    }
    catch (error) {
        console.log('  ⚠️ [Extra Disposable] Error:', error.message);
        return {
            isDisposable: false,
            source: null,
            confidence: 0
        };
    }
});
exports.checkExtraDisposableSources = checkExtraDisposableSources;
//# sourceMappingURL=extraDisposableCheck.js.map