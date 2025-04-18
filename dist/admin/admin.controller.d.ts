import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminProfile } from '../../generated/mysql';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    create(createAdminDto: CreateAdminDto): Promise<AdminProfile>;
    findAll(): Promise<AdminProfile[]>;
    findOne(id: number): Promise<AdminProfile>;
    update(id: number, updateAdminDto: UpdateAdminDto): Promise<AdminProfile>;
    remove(id: number): Promise<void>;
    assignRole(adminId: number, roleId: number): Promise<AdminProfile>;
    removeRole(adminId: number, roleId: number): Promise<AdminProfile>;
}
