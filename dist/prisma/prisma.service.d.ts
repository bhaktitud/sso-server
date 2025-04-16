import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaClientMySQL } from '../../generated/mysql';
import { PrismaClient as PrismaClientMongo } from '../../generated/mongo';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    mysql: PrismaClientMySQL;
    mongo: PrismaClientMongo;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
