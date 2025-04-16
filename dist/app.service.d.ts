import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    getHealth(): Promise<Record<string, string>>;
}
