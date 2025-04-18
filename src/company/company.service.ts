import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { Company, Prisma } from '../../generated/mysql';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    return await this.prisma.mysql.company.create({
      data: createCompanyDto,
    });
    // Note: Tambahkan penanganan error jika nama company harus unik (perlu @unique di skema)
  }

  async findAll(): Promise<Company[]> {
    return await this.prisma.mysql.company.findMany();
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.prisma.mysql.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found.`);
    }
    return company;
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    await this.findOne(id); // Ensure company exists
    return await this.prisma.mysql.company.update({
      where: { id },
      data: updateCompanyDto,
    });
    // Note: Tambahkan penanganan error jika nama company harus unik
  }

  async remove(id: number): Promise<Company> {
    await this.findOne(id); // Ensure company exists
    try {
      return await this.prisma.mysql.company.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        // Foreign key constraint violation
        throw new ConflictException(
          `Cannot delete company with ID ${id}. It still has associated admins.`,
        );
      }
      console.error(`Error deleting company ${id}:`, error);
      throw new Error(`Failed to delete company with ID ${id}.`);
    }
  }
}
