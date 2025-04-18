import { Permission } from '../../../generated/mysql';
export declare class PermissionResponseDto implements Omit<Permission, 'roles'> {
    id: number;
    action: string;
    subject: string;
    createdAt: Date;
    updatedAt: Date;
}
