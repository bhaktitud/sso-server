import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateApikeyDto } from './dto/create-apikey.dto';
import { UpdateApikeyDto } from './dto/update-apikey.dto';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ApikeyService {
  constructor(private prisma: PrismaService) {}

  // Membuat API key baru
  async create(createApikeyDto: CreateApikeyDto) {
    // Periksa apakah perusahaan ada
    const company = await this.prisma.mysql.company.findUnique({
      where: { id: createApikeyDto.companyId },
    });

    if (!company) {
      throw new NotFoundException(
        `Perusahaan dengan ID ${createApikeyDto.companyId} tidak ditemukan`,
      );
    }

    // Generate API key yang unik (32 bytes = 64 karakter hex)
    const apiKeyString = randomBytes(32).toString('hex');

    // Simpan API key ke database
    return this.prisma.mysql.apiKey.create({
      data: {
        key: apiKeyString,
        name: createApikeyDto.name,
        description: createApikeyDto.description,
        expiresAt: createApikeyDto.expiresAt,
        companyId: createApikeyDto.companyId,
      },
    });
  }

  // Mendapatkan semua API key untuk perusahaan tertentu
  async findAllByCompany(companyId: number) {
    return this.prisma.mysql.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Mendapatkan API key berdasarkan ID
  async findOne(id: number) {
    const apiKey = await this.prisma.mysql.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key dengan ID ${id} tidak ditemukan`);
    }

    return apiKey;
  }

  // Memvalidasi API key
  async validateApiKey(key: string) {
    const apiKey = await this.prisma.mysql.apiKey.findUnique({
      where: { key },
      include: { company: true },
    });

    // Jika API key tidak ditemukan atau tidak aktif
    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException('API key tidak valid atau tidak aktif');
    }

    // Jika API key sudah kadaluarsa
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      throw new UnauthorizedException('API key sudah kadaluarsa');
    }

    // Update lastUsedAt
    await this.prisma.mysql.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return apiKey;
  }

  // Mencatat penggunaan API
  async logApiUsage(
    apiKeyId: number,
    endpoint: string,
    method: string,
    statusCode: number,
    requestBody?: string,
  ) {
    return this.prisma.mysql.apiLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        requestBody,
      },
    });
  }

  // Update API key
  async update(id: number, updateApikeyDto: UpdateApikeyDto) {
    // Pastikan API key ada
    await this.findOne(id);

    return this.prisma.mysql.apiKey.update({
      where: { id },
      data: updateApikeyDto,
    });
  }

  // Menghapus API key
  async remove(id: number) {
    // Pastikan API key ada
    await this.findOne(id);

    return this.prisma.mysql.apiKey.delete({
      where: { id },
    });
  }

  // Mendapatkan log penggunaan API untuk API key tertentu
  async getApiLogs(apiKeyId: number) {
    // Pastikan API key ada
    await this.findOne(apiKeyId);

    return this.prisma.mysql.apiLog.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
