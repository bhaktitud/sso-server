"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConstants = void 0;
const path = require("path");
if (!process.env.JWT_REFRESH_TOKEN_SECRET) {
    throw new Error('Missing JWT_REFRESH_TOKEN_SECRET in .env file');
}
exports.jwtConstants = {
    access: {
        privateKeyPath: path.join(__dirname, '../../keys/private.pem'),
        publicKeyPath: path.join(__dirname, '../../keys/public.pem'),
        expiresIn: '60m',
        algorithm: 'RS256',
    },
    refresh: {
        secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '7d',
        algorithm: 'HS256',
    },
};
//# sourceMappingURL=constants.js.map