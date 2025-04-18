import { Role } from '../../../generated/mysql';
export declare class RoleResponseDto implements Omit<Role, 'admins' | 'permissions'> {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
