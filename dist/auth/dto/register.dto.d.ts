import { Prisma } from '../../../generated/mysql';
export declare class RegisterDto implements Prisma.UserMysqlCreateInput {
    name?: string;
    email: string;
    password: string;
}
