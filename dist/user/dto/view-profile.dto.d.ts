import { Role } from '@src/auth/roles/roles.enum';
export declare class ViewProfileDto {
    id: number;
    email: string;
    name: string | null;
    role: Role;
    isEmailVerified: boolean;
}
