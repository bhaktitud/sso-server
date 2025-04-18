import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@src/auth/roles/roles.enum';
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
    private configService;
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): {
        userId: number;
        email: string;
        name: string | null | undefined;
        role: Role;
    };
}
export {};
