import { PrismaService } from '@src/prisma/prisma.service';
import { UserMysql, Prisma } from '../../generated/mysql';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<UserMysql | null>;
    findById(id: number): Promise<UserMysql | null>;
    create(data: Prisma.UserMysqlCreateInput): Promise<UserMysql>;
    updateRefreshToken(userId: number, hashedRefreshToken: string | null): Promise<void>;
    updatePassword(userId: number, newHashedPassword: string): Promise<void>;
}
