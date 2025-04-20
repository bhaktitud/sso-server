import { RoleResponseDto } from '@src/rbac/dto/role-response.dto';
import { CompanyResponseDto } from '@src/company/dto/company-response.dto';
import { ApiKeyEntity } from '@src/apikey/entities/api-key.entity';
export declare class AdminProfileResponseDto {
    id: number;
    name: string;
    email: string;
    title?: string | null;
    phone?: string | null;
    roles?: RoleResponseDto[];
    company?: CompanyResponseDto | null;
    apiKeys?: ApiKeyEntity[];
    createdAt: Date;
    updatedAt: Date;
}
