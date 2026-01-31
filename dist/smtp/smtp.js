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
exports.checkCatchAll = exports.checkSMTP = exports.isBlockingService = void 0;
const net_1 = __importDefault(require("net"));
const log = (...args) => {
    if (process.env.DEBUG === 'true') {
        console.log(...args);
    }
};
// SMTP response codes and their meanings
const SMTP_CODES = {
    // Success codes
    220: 'ready',
    250: 'ok',
    251: 'forward',
    // Definite failure - mailbox doesn't exist
    550: 'mailbox_not_found',
    551: 'user_not_local',
    552: 'mailbox_full',
    553: 'invalid_mailbox',
    // Temporary failures - DON'T mark as invalid
    421: 'service_unavailable',
    450: 'mailbox_busy',
    451: 'local_error',
    452: 'insufficient_storage',
    // Policy blocks - DON'T mark as invalid (server blocking verification)
    554: 'transaction_failed',
    // Command errors
    500: 'syntax_error',
    501: 'argument_error',
    502: 'not_implemented',
    503: 'bad_sequence',
    504: 'parameter_not_implemented'
};
// Known enterprise mail protection services that block SMTP verification
const BLOCKING_SERVICES = [
    'mimecast.com',
    'protection.outlook.com',
    'pphosted.com',
    'proofpoint.com',
    'messagelabs.com',
    'google.com',
    'googlemail.com',
    'barracuda',
    'spamexperts',
    'mailcontrol',
    'reflexion',
    'symantec',
    'fireeye'
];
const extractCode = (msg) => {
    const match = msg.match(/^(\d{3})/);
    if (match)
        return parseInt(match[1], 10);
    return null;
};
const isBlockingService = (exchange) => {
    const lowerExchange = exchange.toLowerCase();
    return BLOCKING_SERVICES.some(service => lowerExchange.includes(service));
};
exports.isBlockingService = isBlockingService;
const checkSMTP = (sender, recipient, exchange) => __awaiter(void 0, void 0, void 0, function* () {
    const timeout = 1000 * 10; // 10 seconds (reduced for consistency)
    const isKnownBlocker = isBlockingService(exchange);
    return new Promise(r => {
        let receivedData = false;
        let closed = false;
        let lastResponse = '';
        let lastCode = null;
        let responsesReceived = [];
        const socket = net_1.default.createConnection(25, exchange);
        socket.setEncoding('ascii');
        socket.setTimeout(timeout);
        const finish = (result) => {
            closed = true;
            if (socket.writable && !socket.destroyed) {
                try {
                    socket.write(`QUIT\r\n`);
                }
                catch (e) { }
                socket.end();
                socket.destroy();
            }
            r(result);
        };
        socket.on('error', (error) => {
            log('SMTP error:', error.message);
            if (!closed) {
                // Connection errors = can't verify
                finish({
                    valid: false,
                    reason: 'smtp_error',
                    blocked: true,
                    smtpMessage: `Connection failed: ${error.message}`
                });
            }
        });
        socket.on('close', () => {
            if (!closed) {
                // Connection closed without response
                finish({
                    valid: false,
                    reason: 'smtp_error',
                    blocked: true,
                    smtpMessage: 'No response from server'
                });
            }
        });
        socket.on('timeout', () => {
            log('SMTP timeout');
            if (!closed) {
                // Timeout = server didn't respond
                finish({
                    valid: false,
                    reason: 'smtp_error',
                    blocked: true,
                    smtpMessage: 'Server did not respond in time'
                });
            }
        });
        const commands = [
            `EHLO validator.local\r\n`,
            `MAIL FROM:<${sender}>\r\n`,
            `RCPT TO:<${recipient}>\r\n`
        ];
        let cmdIndex = 0;
        const sendNext = () => {
            if (cmdIndex < commands.length) {
                if (socket.writable) {
                    log('Sending:', commands[cmdIndex].trim());
                    socket.write(commands[cmdIndex++]);
                }
            }
            else {
                // All commands sent successfully - email is VALID
                finish({
                    valid: true,
                    reason: 'accepted_email',
                    smtpCode: lastCode || 250,
                    smtpMessage: 'Mailbox exists'
                });
            }
        };
        socket.on('connect', () => {
            log('Connected to', exchange);
            socket.on('data', (data) => {
                receivedData = true;
                lastResponse = data.toString();
                lastCode = extractCode(lastResponse);
                log('SMTP Response:', lastResponse.trim());
                if (!lastCode) {
                    sendNext();
                    return;
                }
                // Success codes - continue
                if (lastCode === 220 || lastCode === 250 || lastCode === 251) {
                    sendNext();
                    return;
                }
                // EHLO not supported, try HELO
                if (lastCode === 502 && cmdIndex === 1) {
                    commands[0] = `HELO validator.local\r\n`;
                    cmdIndex = 0;
                    sendNext();
                    return;
                }
                // Definite failures - mailbox doesn't exist
                if (lastCode === 550 || lastCode === 551 || lastCode === 553) {
                    finish({
                        valid: false,
                        reason: 'mailbox_not_found',
                        smtpCode: lastCode,
                        smtpMessage: 'Mailbox does not exist'
                    });
                    return;
                }
                // Temporary failures (421/450/451/452) = can't verify
                if (lastCode === 421 || lastCode === 450 || lastCode === 451 || lastCode === 452) {
                    finish({
                        valid: false,
                        reason: 'smtp_error',
                        blocked: true,
                        smtpCode: lastCode,
                        smtpMessage: 'Server temporarily rejected - unable to verify'
                    });
                    return;
                }
                // 554 - Transaction failed = can't verify
                if (lastCode === 554) {
                    finish({
                        valid: false,
                        reason: 'smtp_error',
                        blocked: true,
                        smtpCode: 554,
                        smtpMessage: 'Server rejected the email'
                    });
                    return;
                }
                // 552 - Mailbox full (exists but full = valid)
                if (lastCode === 552) {
                    finish({
                        valid: true,
                        reason: 'mailbox_full',
                        smtpCode: 552,
                        smtpMessage: 'Mailbox full but exists'
                    });
                    return;
                }
                // Any other unknown code = can't verify
                finish({
                    valid: false,
                    reason: 'smtp_error',
                    blocked: true,
                    smtpCode: lastCode,
                    smtpMessage: `Unknown response: ${lastResponse.trim()}`
                });
            });
        });
    });
});
exports.checkSMTP = checkSMTP;
// Catch-all detection (separate function)
const checkCatchAll = (sender, domain, exchange) => __awaiter(void 0, void 0, void 0, function* () {
    const fakeEmail = `nonexistent_test_${Date.now()}_${Math.random().toString(36).substring(7)}@${domain}`;
    return new Promise(resolve => {
        const timeout = 1000 * 10;
        let closed = false;
        const socket = net_1.default.createConnection(25, exchange);
        socket.setEncoding('ascii');
        socket.setTimeout(timeout);
        const finish = (isCatchAll) => {
            closed = true;
            if (socket.writable && !socket.destroyed) {
                try {
                    socket.write(`QUIT\r\n`);
                }
                catch (e) { }
                socket.end();
                socket.destroy();
            }
            resolve(isCatchAll);
        };
        socket.on('error', () => finish(false));
        socket.on('timeout', () => finish(false));
        socket.on('close', () => { if (!closed)
            finish(false); });
        const commands = [
            `EHLO validator.local\r\n`,
            `MAIL FROM:<${sender}>\r\n`,
            `RCPT TO:<${fakeEmail}>\r\n`
        ];
        let cmdIndex = 0;
        socket.on('connect', () => {
            socket.on('data', (data) => {
                const code = extractCode(data.toString());
                if (code === 220 || code === 250 || code === 251) {
                    if (cmdIndex < commands.length) {
                        socket.write(commands[cmdIndex++]);
                    }
                    else {
                        // Fake email accepted = catch-all domain
                        finish(true);
                    }
                }
                else if (code === 550 || code === 551 || code === 553) {
                    // Fake email rejected = NOT catch-all
                    finish(false);
                }
                else {
                    // Unknown - assume not catch-all
                    finish(false);
                }
            });
        });
    });
});
exports.checkCatchAll = checkCatchAll;
//# sourceMappingURL=smtp.js.map