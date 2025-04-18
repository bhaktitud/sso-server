import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/mysql';
// Import PermissionResponseDto jika ingin menampilkan detail permission
// import { PermissionResponseDto } from './permission-response.dto';

export class RoleResponseDto implements Omit<Role, 'admins' | 'permissions'> {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'admin' })
  name: string;

  @ApiProperty({
    example: 'Administrator role',
    required: false,
    nullable: true,
  })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Jika ingin menyertakan permission di response, tambahkan:
  // @ApiProperty({ type: () => [PermissionResponseDto], required: false }) // Gunakan arrow function untuk circular dependency
  // permissions?: PermissionResponseDto[];
}
