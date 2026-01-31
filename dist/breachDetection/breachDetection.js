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
exports.checkBreachStatus = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Check if email has been found in known data breaches using HaveIBeenPwned API
 * Free API - no authentication required
 */
const checkBreachStatus = (email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('  📡 [HaveIBeenPwned API] Querying for:', email);
        // HaveIBeenPwned API endpoint
        const response = yield axios_1.default.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
            headers: {
                'User-Agent': 'deep-email-validator'
            },
            timeout: 10000
        });
        if (response.status === 200 && response.data && Array.isArray(response.data)) {
            const breaches = response.data.map((breach) => breach.Name || breach.name);
            console.log('  ⚠️ [HaveIBeenPwned API] Email found in', response.data.length, 'breach(es):', breaches);
            return {
                breached: true,
                breachCount: response.data.length,
                breaches: breaches,
                compromised: true
            };
        }
        console.log('  ✅ [HaveIBeenPwned API] Email not found in any breach');
        return {
            breached: false,
            breachCount: 0,
            breaches: [],
            compromised: false
        };
    }
    catch (error) {
        // 404 means email not found in breaches - which is good
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
            console.log('  ✅ [HaveIBeenPwned API] 404 - Not in breaches');
            return {
                breached: false,
                breachCount: 0,
                breaches: [],
                compromised: false
            };
        }
        // Rate limited or service unavailable - return safe default
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 429 || error.code === 'ECONNABORTED') {
            console.log('  ⚠️ [HaveIBeenPwned API] Rate limited or timeout');
            return {
                breached: false,
                breachCount: 0,
                breaches: [],
                compromised: false
            };
        }
        // Other errors - return safe default
        console.log('  ⚠️ [HaveIBeenPwned API] Error:', error.message);
        return {
            breached: false,
            breachCount: 0,
            breaches: [],
            compromised: false
        };
    }
});
exports.checkBreachStatus = checkBreachStatus;
//# sourceMappingURL=breachDetection.js.map