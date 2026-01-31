"use strict";
/**
 * Detects if a domain accepts all emails (catch-all)
 * A catch-all domain accepts mail for any address on that domain
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
exports.isCatchAllDomain = void 0;
const net_1 = __importDefault(require("net"));
const log = (...args) => {
    if (process.env.DEBUG === 'true') {
        console.log(...args);
    }
};
/**
 * Test if a domain is catch-all by attempting to verify a non-existent email
 */
const isCatchAllDomain = (sender, domain, mxExchange) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        // Generate a random non-existent email address
        const randomLocalPart = `test_${Math.random().toString(36).substring(2, 15)}@${Math.random().toString(36).substring(2, 15)}`;
        const testEmail = `${randomLocalPart}@${domain}`;
        const timeout = 1000 * 10; // 10 seconds
        let receivedData = false;
        let closed = false;
        const socket = net_1.default.createConnection(25, mxExchange);
        socket.setEncoding('ascii');
        socket.setTimeout(timeout);
        socket.on('error', () => {
            socket.emit('fail');
        });
        socket.on('close', () => {
            if (!closed) {
                socket.emit('fail');
            }
        });
        socket.once('fail', () => {
            closed = true;
            if (socket.writable && !socket.destroyed) {
                socket.write(`quit\r\n`);
                socket.end();
                socket.destroy();
            }
            resolve(false);
        });
        socket.on('success', (isCatchAll) => {
            closed = true;
            if (socket.writable && !socket.destroyed) {
                socket.write(`quit\r\n`);
                socket.end();
                socket.destroy();
            }
            resolve(isCatchAll);
        });
        const commands = [`helo ${mxExchange}\r\n`, `mail from: <${sender}>\r\n`, `rcpt to: <${testEmail}>\r\n`];
        let i = 0;
        let isAccepted = false;
        socket.on('next', () => {
            if (i < 3) {
                if (socket.writable) {
                    socket.write(commands[i++]);
                }
                else {
                    socket.emit('fail');
                }
            }
            else {
                // If we got here, the non-existent email was accepted - it's catch-all
                socket.emit('success', isAccepted);
            }
        });
        socket.on('timeout', () => {
            socket.emit('fail');
        });
        socket.on('connect', () => {
            socket.on('data', msg => {
                receivedData = true;
                log('catch-all test data', msg);
                // 250 = accepted, 550 = rejected
                if (msg.includes('220') || msg.includes('250')) {
                    if (msg.includes('250')) {
                        // RCPT TO returned 250 - non-existent email accepted = catch-all
                        isAccepted = true;
                    }
                    socket.emit('next', msg);
                }
                else if (msg.includes('550')) {
                    // Non-existent email rejected = not catch-all
                    isAccepted = false;
                    socket.emit('next', msg);
                }
                else {
                    socket.emit('next', msg);
                }
            });
        });
    });
});
exports.isCatchAllDomain = isCatchAllDomain;
//# sourceMappingURL=catchAll.js.map