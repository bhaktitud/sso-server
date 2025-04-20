"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const rbac_service_1 = require("../rbac/rbac.service");
const mail_service_1 = require("../mail/mail.service");
const mysql_1 = require("../../generated/mysql");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
let AdminService = class AdminService {
    prisma;
    userService;
    rbacService;
    mailService;
    saltRounds = 10;
    constructor(prisma, userService, rbacService, mailService) {
        this.prisma = prisma;
        this.userService = userService;
        this.rbacService = rbacService;
        this.mailService = mailService;
    }
    async createAdmin(createAdminDto) {
        const { email, password, name, companyId, roleIds } = createAdminDto;
        const existingUser = await this.userService.findOneByEmail(email);
        if (existingUser) {
            throw new common_1.ConflictException(`Email ${email} sudah terdaftar.`);
        }
        await Promise.all(roleIds.map(async (roleId) => {
            try {
                await this.rbacService.findRoleById(roleId);
            }
            catch (error) {
                throw new common_1.BadRequestException(`Role dengan ID ${roleId} tidak valid.`);
            }
        }));
        if (companyId) {
            try {
                await this.prisma.mysql.company.findUniqueOrThrow({
                    where: { id: companyId },
                });
            }
            catch (error) {
                throw new common_1.BadRequestException(`Company dengan ID ${companyId} tidak valid.`);
            }
        }
        const hashedPassword = await bcrypt.hash(password, this.saltRounds);
        const rawVerificationToken = crypto.randomBytes(32).toString('hex');
        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(rawVerificationToken)
            .digest('hex');
        try {
            const createdAdmin = await this.prisma.mysql.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        name,
                        userType: mysql_1.UserType.ADMIN_USER,
                        emailVerificationToken: hashedVerificationToken,
                        isEmailVerified: false,
                    },
                });
                const adminData = {
                    userId: newUser.id,
                    name: name,
                    ...(companyId && { companyId: companyId }),
                };
                const newAdminProfileBase = await tx.adminProfile.create({
                    data: adminData,
                });
                const newAdminProfileWithRoles = await tx.adminProfile.update({
                    where: { id: newAdminProfileBase.id },
                    data: {
                        roles: { connect: roleIds.map((id) => ({ id })) },
                    },
                    include: { user: true, company: true, roles: true },
                });
                return newAdminProfileWithRoles;
            });
            try {
                await this.mailService.sendVerificationEmail(email, name, rawVerificationToken);
            }
            catch (error) {
                console.error('Error sending verification email to admin:', error);
            }
            return createdAdmin;
        }
        catch (error) {
            console.error('Error creating admin:', error);
            throw new Error('Gagal membuat admin baru.');
        }
    }
    async findAllAdmins() {
        return await this.prisma.mysql.adminProfile.findMany({
            include: { user: true, company: true, roles: true },
        });
    }
    async findAdminById(id) {
        const admin = await this.prisma.mysql.adminProfile.findUnique({
            where: { id },
            include: { user: true, company: true, roles: true },
        });
        if (!admin) {
            throw new common_1.NotFoundException(`Admin profile with ID ${id} not found.`);
        }
        return admin;
    }
    async findAdminByUserId(userId) {
        return await this.prisma.mysql.adminProfile.findUnique({
            where: { userId },
            include: { user: true, company: true, roles: true },
        });
    }
    async updateAdmin(id, updateAdminDto) {
        const { name, companyId, roleIds } = updateAdminDto;
        await this.findAdminById(id);
        if (roleIds) {
            await Promise.all(roleIds.map(async (roleId) => {
                try {
                    await this.rbacService.findRoleById(roleId);
                }
                catch (error) {
                    throw new common_1.BadRequestException(`Role with ID ${roleId} not valid.`);
                }
            }));
        }
        if (companyId) {
            try {
                await this.prisma.mysql.company.findUniqueOrThrow({
                    where: { id: companyId },
                });
            }
            catch (error) {
                throw new common_1.BadRequestException(`Company with ID ${companyId} not valid.`);
            }
        }
        try {
            return await this.prisma.mysql.adminProfile.update({
                where: { id },
                data: {
                    name: name,
                    company: companyId !== undefined
                        ? companyId === null
                            ? { disconnect: true }
                            : { connect: { id: companyId } }
                        : undefined,
                    roles: roleIds ? { set: roleIds.map((id) => ({ id })) } : undefined,
                },
                include: { user: true, company: true, roles: true },
            });
        }
        catch (error) {
            console.error(`Error updating admin profile ${id}:`, error);
            throw new Error(`Failed to update admin profile.`);
        }
    }
    async deleteAdmin(id) {
        const adminProfile = await this.findAdminById(id);
        const userIdToDelete = adminProfile.userId;
        try {
            const [deletedAdmin, deletedUser] = await this.prisma.mysql.$transaction([
                this.prisma.mysql.adminProfile.delete({ where: { id } }),
                this.prisma.mysql.user.delete({ where: { id: userIdToDelete } }),
            ]);
            return { adminProfile: deletedAdmin, user: deletedUser };
        }
        catch (error) {
            console.error(`Error deleting admin ${id} and user ${userIdToDelete}:`, error);
            throw new Error(`Failed to delete admin.`);
        }
    }
    async assignRoleToAdmin(adminId, roleId) {
        await this.findAdminById(adminId);
        await this.rbacService.findRoleById(roleId);
        return await this.prisma.mysql.adminProfile.update({
            where: { id: adminId },
            data: { roles: { connect: { id: roleId } } },
            include: { roles: true },
        });
    }
    async removeRoleFromAdmin(adminId, roleId) {
        await this.findAdminById(adminId);
        await this.rbacService.findRoleById(roleId);
        return await this.prisma.mysql.adminProfile.update({
            where: { id: adminId },
            data: { roles: { disconnect: { id: roleId } } },
            include: { roles: true },
        });
    }
    async findAdminProfileWithDetails(userId) {
        const adminProfile = await this.prisma.mysql.adminProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        isEmailVerified: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                company: {
                    include: {
                        apiKeys: {
                            where: { isActive: true },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
                roles: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
        if (!adminProfile) {
            throw new common_1.NotFoundException(`Admin profile not found for user ID ${userId}`);
        }
        return adminProfile;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService,
        rbac_service_1.RbacService,
        mail_service_1.MailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map