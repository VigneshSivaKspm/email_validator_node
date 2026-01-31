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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBestMx = exports.getMx = void 0;
const dns_1 = __importDefault(require("dns"));
// Set custom DNS servers if provided in environment
const customServers = ((_a = process.env.DNS_SERVERS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['8.8.8.8', '8.8.4.4'];
try {
    dns_1.default.setServers(customServers);
    console.log(`🔧 [DNS] Using DNS servers: ${customServers.join(', ')}`);
}
catch (e) {
    console.warn('⚠️ [DNS] Could not set custom DNS servers, using system defaults');
}
const getMx = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(r => {
        // Set a timeout for DNS resolution
        const timeout = setTimeout(() => {
            console.warn(`⚠️ [DNS] Timeout resolving MX for ${domain}`);
            r([]);
        }, 8000); // Increased timeout for slower connections
        dns_1.default.resolveMx(domain, (err, addresses) => {
            clearTimeout(timeout);
            if (err) {
                console.warn(`⚠️ [DNS] Error resolving MX for ${domain}: ${err.message}`);
                return r([]);
            }
            if (!addresses || addresses.length === 0) {
                console.warn(`⚠️ [DNS] No addresses returned for ${domain}`);
                return r([]);
            }
            r(addresses);
        });
    });
});
exports.getMx = getMx;
const getBestMx = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    const addresses = yield (0, exports.getMx)(domain);
    if (!addresses || addresses.length === 0) {
        return undefined;
    }
    let bestIndex = 0;
    for (let i = 0; i < addresses.length; i++) {
        if (addresses[i].priority < addresses[bestIndex].priority) {
            bestIndex = i;
        }
    }
    return addresses[bestIndex];
});
exports.getBestMx = getBestMx;
//# sourceMappingURL=dns.js.map