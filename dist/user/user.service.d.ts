import { PrismaService } from '@src/prisma/prisma.service';
import { User, Prisma } from '../../generated/mysql';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findOneByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    updateRefreshToken(userId: number, hashedRefreshToken: string | null): Promise<void>;
    updatePassword(userId: number, newHashedPassword: string): Promise<void>;
}
