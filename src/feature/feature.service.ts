import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { Feature, Prisma } from '../../generated/mysql';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@Injectable()
export class FeatureService {
  constructor(private prisma: PrismaService) {}

  async create(createFeatureDto: CreateFeatureDto): Promise<Feature> {
    try {
      return await this.prisma.mysql.feature.create({
        data: createFeatureDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Unique constraint violation
        throw new ConflictException(
          'Feature dengan nama atau kode tersebut sudah ada.',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Feature[]> {
    return await this.prisma.mysql.feature.findMany();
  }

  async findOne(id: number): Promise<Feature> {
    const feature = await this.prisma.mysql.feature.findUnique({
      where: { id },
    });
    if (!feature) {
      throw new NotFoundException(`Feature dengan ID ${id} tidak ditemukan.`);
    }
    return feature;
  }

  async update(
    id: number,
    updateFeatureDto: UpdateFeatureDto,
  ): Promise<Feature> {
    try {
      await this.findOne(id); // Pastikan feature ada
      return await this.prisma.mysql.feature.update({
        where: { id },
        data: updateFeatureDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Unique constraint violation
        throw new ConflictException(
          'Feature dengan nama atau kode tersebut sudah ada.',
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<Feature> {
    await this.findOne(id); // Pastikan feature ada
    try {
      return await this.prisma.mysql.feature.delete({ where: { id } });
    } catch (error) {
      // Handle error seperti relasi yang masih ada
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          `Tidak dapat menghapus feature dengan ID ${id}. Feature ini masih terhubung dengan profil admin.`,
        );
      }
      throw error;
    }
  }

  // Metode untuk mengelola relasi dengan AdminProfile
  async assignToAdmin(featureId: number, adminId: number): Promise<void> {
    // Pastikan feature dan admin ada
    await this.findOne(featureId);
    const admin = await this.prisma.mysql.adminProfile.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException(`Admin dengan ID ${adminId} tidak ditemukan.`);
    }

    // Hubungkan feature ke admin
    await this.prisma.mysql.adminProfile.update({
      where: { id: adminId },
      data: {
        features: {
          connect: { id: featureId },
        },
      },
    });
  }

  async removeFromAdmin(featureId: number, adminId: number): Promise<void> {
    // Pastikan feature dan admin ada
    await this.findOne(featureId);
    const admin = await this.prisma.mysql.adminProfile.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException(`Admin dengan ID ${adminId} tidak ditemukan.`);
    }

    // Putuskan hubungan feature dengan admin
    await this.prisma.mysql.adminProfile.update({
      where: { id: adminId },
      data: {
        features: {
          disconnect: { id: featureId },
        },
      },
    });
  }
} 