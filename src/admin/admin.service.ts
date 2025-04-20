import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { UserService } from '@src/user/user.service';
import { RbacService } from '@src/rbac/rbac.service';
import { MailService } from '@src/mail/mail.service';
import { AdminProfile, User, UserType, Prisma } from '../../generated/mysql';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  private saltRounds = 10;

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private rbacService: RbacService,
    private mailService: MailService,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<AdminProfile> {
    const { email, password, name, companyId, roleIds } = createAdminDto;

    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException(`Email ${email} sudah terdaftar.`);
    }

    await Promise.all(
      roleIds.map(async (roleId) => {
        try {
          await this.rbacService.findRoleById(roleId);
        } catch (error) {
          throw new BadRequestException(
            `Role dengan ID ${roleId} tidak valid.`,
          );
        }
      }),
    );

    if (companyId) {
      try {
        await this.prisma.mysql.company.findUniqueOrThrow({
          where: { id: companyId },
        });
      } catch (error) {
        throw new BadRequestException(
          `Company dengan ID ${companyId} tidak valid.`,
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Generate token verifikasi email
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
            userType: UserType.ADMIN_USER,
            emailVerificationToken: hashedVerificationToken,
            isEmailVerified: false, // Set false karena perlu verifikasi email
          },
        });

        const adminData: Prisma.AdminProfileUncheckedCreateInput = {
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

      // Kirim email verifikasi setelah admin berhasil dibuat
      try {
        await this.mailService.sendVerificationEmail(
          email,
          name,
          rawVerificationToken,
        );
      } catch (error) {
        console.error('Error sending verification email to admin:', error);
        // Tidak menggagalkan proses pembuatan admin, tapi perlu dicatat errornya
      }

      return createdAdmin;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw new Error('Gagal membuat admin baru.');
    }
  }

  async findAllAdmins(): Promise<AdminProfile[]> {
    return await this.prisma.mysql.adminProfile.findMany({
      include: { user: true, company: true, roles: true },
    });
  }

  async findAdminById(id: number): Promise<AdminProfile> {
    const admin = await this.prisma.mysql.adminProfile.findUnique({
      where: { id },
      include: { user: true, company: true, roles: true },
    });
    if (!admin) {
      throw new NotFoundException(`Admin profile with ID ${id} not found.`);
    }
    return admin;
  }

  async findAdminByUserId(userId: number): Promise<AdminProfile | null> {
    return await this.prisma.mysql.adminProfile.findUnique({
      where: { userId },
      include: { user: true, company: true, roles: true },
    });
  }

  async updateAdmin(
    id: number,
    updateAdminDto: UpdateAdminDto,
  ): Promise<AdminProfile> {
    const { name, companyId, roleIds } = updateAdminDto;
    await this.findAdminById(id);

    if (roleIds) {
      await Promise.all(
        roleIds.map(async (roleId) => {
          try {
            await this.rbacService.findRoleById(roleId);
          } catch (error) {
            throw new BadRequestException(`Role with ID ${roleId} not valid.`);
          }
        }),
      );
    }
    if (companyId) {
      try {
        await this.prisma.mysql.company.findUniqueOrThrow({
          where: { id: companyId },
        });
      } catch (error) {
        throw new BadRequestException(
          `Company with ID ${companyId} not valid.`,
        );
      }
    }

    try {
      return await this.prisma.mysql.adminProfile.update({
        where: { id },
        data: {
          name: name,
          company:
            companyId !== undefined
              ? companyId === null
                ? { disconnect: true }
                : { connect: { id: companyId } }
              : undefined,
          roles: roleIds ? { set: roleIds.map((id) => ({ id })) } : undefined,
        },
        include: { user: true, company: true, roles: true },
      });
    } catch (error) {
      console.error(`Error updating admin profile ${id}:`, error);
      throw new Error(`Failed to update admin profile.`);
    }
  }

  async deleteAdmin(
    id: number,
  ): Promise<{ adminProfile: AdminProfile; user: User }> {
    const adminProfile = await this.findAdminById(id);
    const userIdToDelete = adminProfile.userId;

    try {
      const [deletedAdmin, deletedUser] = await this.prisma.mysql.$transaction([
        this.prisma.mysql.adminProfile.delete({ where: { id } }),
        this.prisma.mysql.user.delete({ where: { id: userIdToDelete } }),
      ]);
      return { adminProfile: deletedAdmin, user: deletedUser };
    } catch (error) {
      console.error(
        `Error deleting admin ${id} and user ${userIdToDelete}:`,
        error,
      );
      throw new Error(`Failed to delete admin.`);
    }
  }

  async assignRoleToAdmin(
    adminId: number,
    roleId: number,
  ): Promise<AdminProfile> {
    await this.findAdminById(adminId);
    await this.rbacService.findRoleById(roleId);

    return await this.prisma.mysql.adminProfile.update({
      where: { id: adminId },
      data: { roles: { connect: { id: roleId } } },
      include: { roles: true },
    });
  }

  async removeRoleFromAdmin(
    adminId: number,
    roleId: number,
  ): Promise<AdminProfile> {
    await this.findAdminById(adminId);
    await this.rbacService.findRoleById(roleId);

    return await this.prisma.mysql.adminProfile.update({
      where: { id: adminId },
      data: { roles: { disconnect: { id: roleId } } },
      include: { roles: true },
    });
  }

  async findAdminProfileWithDetails(userId: number): Promise<AdminProfile> {
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
      throw new NotFoundException(
        `Admin profile not found for user ID ${userId}`,
      );
    }

    return adminProfile;
  }
}
