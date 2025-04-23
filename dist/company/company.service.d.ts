import { PrismaService } from '@src/prisma/prisma.service';
import { Company } from '../../generated/mysql';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompanyService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCompanyDto: CreateCompanyDto): Promise<Company>;
    findAll(): Promise<Company[]>;
    findOne(id: number): Promise<Company>;
    update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company>;
    regenerateClientCredentials(id: number): Promise<Company>;
    remove(id: number): Promise<Company>;
    private generateClientId;
    extractPermissionsFromClientId(clientId: string): string;
    extractCompanyInfoFromClientId(clientId: string): {
        companyPrefix: string;
    } | null;
    private generateClientSecret;
}
