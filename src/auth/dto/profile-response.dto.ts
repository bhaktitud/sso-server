import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../../generated/mysql';

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
    example: UserType.APP_USER,
    description: 'User type',
    enum: UserType, // Menunjukkan bahwa ini adalah enum
  })
  userType: UserType;
}
