import { Strategy } from 'passport-jwt';
import { Request } from 'express';
interface RefreshTokenPayload {
    sub: number;
}
declare const RefreshTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    constructor();
    validate(req: Request, payload: RefreshTokenPayload): {
        refreshToken: string;
        sub: number;
    };
}
export {};
