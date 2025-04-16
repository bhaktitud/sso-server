import { ApiProperty } from '@nestjs/swagger';

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
    example: 'ADMIN',
    description: 'User role name',
  })
  role: string;
}
