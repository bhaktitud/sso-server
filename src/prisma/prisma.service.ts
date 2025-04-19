import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaClientMySQL } from '../../generated/mysql';
// import { PrismaClient as PrismaClientMongo } from '../../generated/mongo';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public mysql: PrismaClientMySQL;
  // public mongo: PrismaClientMongo;

  constructor() {
    this.mysql = new PrismaClientMySQL();
    // this.mongo = new PrismaClientMongo();
  }

  async onModuleInit() {
    // Melakukan koneksi eksplisit saat modul diinisialisasi
    await this.mysql.$connect();
    // await this.mongo.$connect();
    console.log('Successfully connected to MySQL and MongoDB');
  }

  async onModuleDestroy() {
    // Memutuskan koneksi saat aplikasi dimatikan
    await this.mysql.$disconnect();
    // await this.mongo.$disconnect();
    console.log('Disconnected from MySQL and MongoDB');
  }
}
