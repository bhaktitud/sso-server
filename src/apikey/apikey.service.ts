import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CreateApikeyDto } from './dto/create-apikey.dto';
import { UpdateApikeyDto } from './dto/update-apikey.dto';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { QueryApiLogsDto, StatusCodeFilter } from './dto/query-api-logs.dto';

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

    // Periksa jumlah API key yang sudah dimiliki perusahaan
    const existingApiKeysCount = await this.prisma.mysql.apiKey.count({
      where: { companyId: createApikeyDto.companyId },
    });

    // Batasi maksimum 3 API key per perusahaan
    if (existingApiKeysCount >= 3) {
      throw new BadRequestException(
        `Perusahaan dengan ID ${createApikeyDto.companyId} sudah memiliki 3 API key (maksimum). Hapus salah satu API key yang ada sebelum membuat yang baru.`,
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
    responseBody?: string,
    responseTime?: number,
    ipAddress?: string,
    userAgent?: string,
    companyId?: number,
  ) {
    return this.prisma.mysql.apiLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        requestBody,
        responseBody,
        responseTime,
        ipAddress,
        userAgent,
        companyId,
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

  // Mencari log API dengan filter
  async searchApiLogs(queryParams: QueryApiLogsDto) {
    // Buat kondisi filter
    const where: any = {};

    // Terapkan filter
    if (queryParams.companyId) {
      where.companyId = queryParams.companyId;
    }

    if (queryParams.endpoint) {
      where.endpoint = { contains: queryParams.endpoint };
    }

    if (queryParams.method) {
      where.method = queryParams.method;
    }

    if (queryParams.status) {
      // Filter berdasarkan kategori status code
      if (queryParams.status === StatusCodeFilter.SUCCESS) {
        where.statusCode = { gte: 200, lt: 300 };
      } else if (queryParams.status === StatusCodeFilter.ERROR) {
        where.OR = [
          { statusCode: { gte: 400, lt: 500 } },
          { statusCode: { gte: 500, lt: 600 } },
        ];
      }
    }

    if (queryParams.ipAddress) {
      where.ipAddress = { contains: queryParams.ipAddress };
    }

    // Filter tanggal
    if (queryParams.startDate || queryParams.endDate) {
      where.createdAt = {};
      
      if (queryParams.startDate) {
        where.createdAt.gte = new Date(queryParams.startDate);
      }
      
      if (queryParams.endDate) {
        where.createdAt.lte = new Date(queryParams.endDate);
      }
    }

    // Jumlah total hasil yang sesuai dengan filter (tanpa pagination)
    const totalCount = await this.prisma.mysql.apiLog.count({ where });

    // Ambil data dengan pagination
    const logs = await this.prisma.mysql.apiLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: queryParams.offset || 0,
      take: queryParams.limit || 50,
      include: {
        apiKey: {
          select: {
            name: true,
            key: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Format hasil untuk menyembunyikan bagian penting API key
    const formattedLogs = logs.map(log => {
      if (log.apiKey && log.apiKey.key) {
        return {
          ...log,
          apiKey: {
            ...log.apiKey,
            key: this.maskApiKey(log.apiKey.key),
          },
        };
      }
      return log;
    });

    return {
      total: totalCount,
      offset: queryParams.offset || 0,
      limit: queryParams.limit || 50,
      logs: formattedLogs,
    };
  }

  // Mendapatkan ringkasan statistik penggunaan API
  async getApiUsageStats(companyId?: number, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Filter berdasarkan companyId dan periode waktu
    const where: any = {
      createdAt: { gte: startDate },
    };
    
    if (companyId) {
      where.companyId = companyId;
    }

    // Hitung total request
    const totalRequests = await this.prisma.mysql.apiLog.count({ where });

    // Hitung berdasarkan status code
    const successRequests = await this.prisma.mysql.apiLog.count({
      where: {
        ...where,
        statusCode: { gte: 200, lt: 300 },
      },
    });

    const clientErrorRequests = await this.prisma.mysql.apiLog.count({
      where: {
        ...where,
        statusCode: { gte: 400, lt: 500 },
      },
    });

    const serverErrorRequests = await this.prisma.mysql.apiLog.count({
      where: {
        ...where,
        statusCode: { gte: 500, lt: 600 },
      },
    });

    // Hitung waktu respons rata-rata untuk request yang sukses
    const avgResponseTimeResult: any = await this.prisma.mysql.$queryRaw`
      SELECT AVG(responseTime) as avgTime 
      FROM ApiLog 
      WHERE statusCode >= 200 AND statusCode < 300 
        AND responseTime IS NOT NULL
        AND createdAt >= ${startDate}
        ${companyId ? `AND companyId = ${companyId}` : ``}
    `;
    
    const avgResponseTime = avgResponseTimeResult[0]?.avgTime || 0;

    // Dapatkan 5 endpoint yang paling sering diakses
    const topEndpoints = await this.prisma.mysql.apiLog.groupBy({
      by: ['endpoint', 'method'],
      where,
      _count: {
        endpoint: true,
      },
      orderBy: {
        _count: {
          endpoint: 'desc',
        },
      },
      take: 5,
    });

    return {
      period: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days,
      },
      totalRequests,
      successRate: totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0,
      statusCounts: {
        success: successRequests,
        clientError: clientErrorRequests,
        serverError: serverErrorRequests,
      },
      avgResponseTimeMs: avgResponseTime,
      topEndpoints: topEndpoints.map(item => ({
        endpoint: item.endpoint,
        method: item.method,
        count: item._count.endpoint,
      })),
    };
  }

  // Helper untuk menyembunyikan API key
  private maskApiKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  }
}
