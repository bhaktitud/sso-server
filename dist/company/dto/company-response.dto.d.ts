import { ApiKeyEntity } from '@src/apikey/entities/api-key.entity';
export declare class CompanyResponseDto {
    id: number;
    name: string;
    description?: string | null;
    clientId?: string | null;
    clientSecret?: string | null;
    apiKeys?: ApiKeyEntity[];
    createdAt: Date;
    updatedAt: Date;
}
