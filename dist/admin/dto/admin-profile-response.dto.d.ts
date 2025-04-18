import { RoleResponseDto } from '@src/rbac/dto/role-response.dto';
export declare class AdminProfileResponseDto {
    id: number;
    name: string;
    email: string;
    title?: string | null;
    phone?: string | null;
    roles?: RoleResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}
