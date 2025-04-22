import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminProfile, User, ApiKey } from '../../generated/mysql';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    create(createAdminDto: CreateAdminDto): Promise<AdminProfile>;
    getProfile(req: any): Promise<{
        email: string | undefined;
        apiKeys: {
            id: number;
            key: string;
            name: string;
            description: string | null;
            isActive: boolean;
            companyId: number;
            lastUsedAt: Date | null;
            expiresAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        id: number;
        name: string;
        companyId: number | null;
        createdAt: Date;
        updatedAt: Date;
        userId: number;
        user: Partial<User>;
        company?: {
            apiKeys: ApiKey[];
        } | null;
        roles: any[];
    }>;
    findAll(): Promise<AdminProfile[]>;
    findOne(id: number): Promise<AdminProfile>;
    update(id: number, updateAdminDto: UpdateAdminDto): Promise<AdminProfile>;
    remove(id: number): Promise<void>;
    assignRole(adminId: number, roleId: number): Promise<AdminProfile>;
    removeRole(adminId: number, roleId: number): Promise<AdminProfile>;
}
