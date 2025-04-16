import { Role } from '../roles/roles.enum';
export declare class ProfileResponseDto {
    userId: number;
    email: string;
    name: string | null;
    role: Role;
}
