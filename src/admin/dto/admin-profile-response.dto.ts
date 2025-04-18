import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'generated/mysql'; // Import tipe Role asli
import { RoleResponseDto } from '@src/rbac/dto/role-response.dto'; // Import DTO Role

// Asumsi struktur AdminProfile berdasarkan penggunaan umum
// Sesuaikan properti dan tipe berdasarkan definisi AdminProfile Anda di Prisma Schema
export class AdminProfileResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the admin profile.',
  })
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'The name of the admin.' })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the admin user.',
  })
  email: string; // Asumsi email diambil dari relasi User

  @ApiProperty({
    example: 'Administrator',
    description: 'Optional title or position.',
    required: false,
    nullable: true,
  })
  title?: string | null; // Menjadikan nullable

  @ApiProperty({
    example: '+1234567890',
    description: 'Optional contact phone number.',
    required: false,
    nullable: true,
  })
  phone?: string | null; // Menjadikan nullable

  @ApiProperty({
    type: () => [RoleResponseDto], // Gunakan DTO Role
    description: 'Roles assigned to the admin.',
    required: false,
  })
  roles?: RoleResponseDto[]; // Gunakan DTO Role

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Tambahkan properti lain dari AdminProfile jika ada
} 