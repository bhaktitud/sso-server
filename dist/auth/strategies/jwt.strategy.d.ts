import { Strategy } from 'passport-jwt';
import { Role } from '../roles/roles.enum';
interface JwtPayload {
    sub: number;
    email: string;
    name?: string | null;
    role: Role;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): {
        userId: number;
        email: string;
        name: string | null | undefined;
        role: Role;
    };
}
export {};
