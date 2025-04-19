import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaClientMySQL } from '../../generated/mysql';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    mysql: PrismaClientMySQL;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
