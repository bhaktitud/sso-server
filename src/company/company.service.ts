import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { Company, Prisma } from '../../generated/mysql';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { randomUUID } from 'crypto';
import { v4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      const {
        name,
        description,
        clientId,
        clientSecret,
        roleType = 'basic',
      } = createCompanyDto;

      // Generate clientId if not provided
      const generatedClientId = clientId || this.generateClientId(name, roleType);
      // Generate clientSecret if not provided
      const generatedClientSecret = clientSecret || this.generateClientSecret();

      // Create company in database
      return await this.prisma.mysql.company.create({
        data: {
          name,
          description,
          clientId: generatedClientId,
          clientSecret: generatedClientSecret,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Client ID or company name already exists');
      }
      throw error;
    }
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

  async regenerateClientCredentials(id: number): Promise<Company> {
    const company = await this.findOne(id); // Ensure company exists
    
    // Ekstrak role permissions dari clientId lama jika memungkinkan
    let roleType = 'basic';
    if (company.clientId) {
      const parts = company.clientId.split('_');
      if (parts.length >= 3) {
        roleType = parts[2];
      }
    }
    
    // Generate client ID baru dengan informasi perusahaan dan role
    const clientId = this.generateClientId(company.name, roleType);
    
    return await this.prisma.mysql.company.update({
      where: { id },
      data: {
        clientId,
        clientSecret: this.generateClientSecret(),
      },
    });
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

  /**
   * Generates a client ID based on company name and role type
   * Format: comp_[companyId]_[companyPrefix]_[permissionCode]_[timestamp]_[randomId]
   *
   * @param companyName The name of the company
   * @param roleType The role type for permissions (basic, premium, admin)
   * @returns A unique client ID containing company and role information
   */
  private generateClientId(companyName: string, roleType: string): string {
    // Create prefix from company name (lowercase, spaces replaced with underscore)
    const companyPrefix = companyName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .substring(0, 10);
    
    // Role type for permissions (encode permissions based on role)
    let permissionCode: string;
    switch (roleType.toLowerCase()) {
      case 'admin':
        permissionCode = 'adm-rwx'; // Admin dengan full access (read-write-execute)
        break;
      case 'premium':
        permissionCode = 'prm-rw'; // Premium dengan akses read-write
        break;
      default:
        permissionCode = 'bsc-r'; // Basic dengan akses hanya read
        break;
    }
    
    // Add timestamp for version tracking
    const timestamp = new Date().getTime().toString().substring(0, 10);
    
    // Add random string for uniqueness
    const randomId = v4().substring(0, 8);
    
    // Format: comp_[companyPrefix]_[permissionCode]_[timestamp]_[randomId]
    return `comp_${companyPrefix}_${permissionCode}_${timestamp}_${randomId}`;
  }

  /**
   * Extracts role permissions from a client ID
   * 
   * @param clientId The client ID to extract permissions from
   * @returns The role permissions string or 'basic' if not found
   */
  public extractPermissionsFromClientId(clientId: string): string {
    if (!clientId) return 'bsc-r';
    
    const parts = clientId.split('_');
    if (parts.length >= 3) {
      return parts[2]; // Bagian permission code
    }
    
    return 'bsc-r'; // Default to basic permissions
  }

  /**
   * Extracts company information from a client ID
   * 
   * @param clientId The client ID to extract company info from
   * @returns Object containing company information or null if not found
   */
  public extractCompanyInfoFromClientId(clientId: string): { companyPrefix: string } | null {
    if (!clientId) return null;
    
    const parts = clientId.split('_');
    if (parts.length >= 2) {
      return {
        companyPrefix: parts[1]
      };
    }
    
    return null;
  }

  /**
   * Generates a random client secret
   * @returns A unique client secret
   */
  private generateClientSecret(): string {
    return `cs_${randomUUID()}`;
  }
}
