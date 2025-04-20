import { PrismaService } from './prisma/prisma.service';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    getHealth(): Promise<Record<string, string>>;
    getCountries(): {
        code: string;
        name: string;
    }[];
    getTimezones(): {
        id: string;
        offset: string;
        name: string;
    }[];
}
