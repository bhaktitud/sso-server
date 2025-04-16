import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../roles/roles.enum';

export class ProfileResponseDto {
  @ApiProperty({ example: 1, description: 'Unique user ID' })
  userId: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name (can be null)',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    example: Role.USER,
    description: 'User role',
    enum: Role, // Menunjukkan bahwa ini adalah enum
  })
  role: Role;
} 