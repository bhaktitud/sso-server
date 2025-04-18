import { PrismaService } from '@src/prisma/prisma.service';
import { UserService } from '@src/user/user.service';
import { RbacService } from '@src/rbac/rbac.service';
import { AdminProfile, User } from '../../generated/mysql';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
export declare class AdminService {
    private prisma;
    private userService;
    private rbacService;
    private saltRounds;
    constructor(prisma: PrismaService, userService: UserService, rbacService: RbacService);
    createAdmin(createAdminDto: CreateAdminDto): Promise<AdminProfile>;
    findAllAdmins(): Promise<AdminProfile[]>;
    findAdminById(id: number): Promise<AdminProfile>;
    findAdminByUserId(userId: number): Promise<AdminProfile | null>;
    updateAdmin(id: number, updateAdminDto: UpdateAdminDto): Promise<AdminProfile>;
    deleteAdmin(id: number): Promise<{
        adminProfile: AdminProfile;
        user: User;
    }>;
    assignRoleToAdmin(adminId: number, roleId: number): Promise<AdminProfile>;
    removeRoleFromAdmin(adminId: number, roleId: number): Promise<AdminProfile>;
}
