import { ApiProperty } from '@nestjs/swagger';

export class ViewProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty({ example: 'ADMIN', description: 'User role name' })
  role: string;

  @ApiProperty()
  isEmailVerified: boolean;

  // Tambahkan properti lain jika perlu (misal: createdAt, updatedAt)
}
