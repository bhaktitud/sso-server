import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@src/auth/roles/roles.enum'; // Pastikan path ini benar

export class ViewProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name (can be null)',
    example: 'John Doe',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Indicates if the user email address has been verified',
    example: true,
  })
  isEmailVerified: boolean;

  // Tambahkan properti lain jika perlu (misal: createdAt, updatedAt)
}
