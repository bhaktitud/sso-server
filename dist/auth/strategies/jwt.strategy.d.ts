import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserType } from '../../../generated/mysql';
interface JwtPayload {
    sub: number;
    email: string;
    userType: UserType;
    name?: string | null;
    role?: string;
    profileId?: number;
    roles?: string[];
    permissions?: string[];
}
interface RequestUser {
    userId: number;
    email: string;
    userType: UserType;
    name?: string | null;
    role?: string;
    profileId?: number;
    roles?: string[];
    permissions?: string[];
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(payload: JwtPayload): RequestUser;
}
export {};
